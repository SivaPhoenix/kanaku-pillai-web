import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { Alert, Button, Card, Icon, Input, Logo, Switch } from "../components/ui/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { ApiError, fieldErrors } from "../lib/api.js";
import { cn } from "../lib/cn.js";
import { meApi } from "../lib/ledger-api.js";
import { parseAmountToMinor } from "../lib/money.js";

// Quick picks from design spec §7.4; "All currencies" opens a searchable list of every ISO code the browser knows.
const QUICK_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

// Same defaults the backend derives (CURRENCY_LOCALES); used here only for the live preview.
const PREVIEW_LOCALES = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
  SGD: "en-SG",
  JPY: "ja-JP",
};

function allCurrencyCodes() {
  try {
    return Intl.supportedValuesOf("currency");
  } catch {
    return [...QUICK_CURRENCIES, "JPY"];
  }
}

function currencyName(code, displayNames) {
  try {
    return displayNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

function currencySymbol(code, locale) {
  try {
    return (
      new Intl.NumberFormat(locale, { style: "currency", currency: code })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? code
    );
  } catch {
    return code;
  }
}

function preview(code) {
  const locale = PREVIEW_LOCALES[code] ?? "en-US";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(123456.5);
  } catch {
    return code;
  }
}

// Some browsers still report legacy IANA aliases; store the current canonical names (spec uses Asia/Kolkata).
const ZONE_ALIASES = {
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Europe/Kiev": "Europe/Kyiv",
};

function deviceZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    return ZONE_ALIASES[zone] ?? zone;
  } catch {
    return "Asia/Kolkata";
  }
}

function zoneNamePart(zone, locale, style) {
  return new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: style })
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName")?.value;
}

// "IST (UTC+05:30)" for the zone, as the spec's info row shows it; falls back to the offset alone.
function zoneLabel(zone) {
  try {
    const offset = zoneNamePart(zone, "en-US", "longOffset")?.replace("GMT", "UTC") || "UTC";
    const short = ["en-US", "en-IN", "en-GB"]
      .map((locale) => zoneNamePart(zone, locale, "short"))
      .find((name) => name && !/^(GMT|UTC)/.test(name));
    return short ? `${short} (${offset})` : offset;
  } catch {
    return "";
  }
}

const BALANCE_FIELDS = [
  { name: "savings", label: "Savings (bank)", key: "savingsMinor" },
  { name: "wallet", label: "Wallet (cash)", key: "walletMinor" },
  { name: "card", label: "Credit card — amount owed", key: "creditCardOwedMinor" },
];

function CurrencyTile({ code, selected, onSelect, displayNames }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(code)}
      className={cn(
        "flex min-h-16 min-w-0 items-center gap-3 rounded-lg surface-l0 px-3 py-2 text-left",
        selected && "border-[1.5px] border-primary bg-primary/18",
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 font-mono text-[15px] font-bold"
      >
        {currencySymbol(code, PREVIEW_LOCALES[code] ?? "en-US")}
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[15px] font-bold text-text">{code}</span>
        <span className="block truncate text-[13px] text-text-muted">
          {currencyName(code, displayNames)}
        </span>
      </span>
    </button>
  );
}

// First run (design spec §7.4): pick the currency, confirm the zone, optionally add opening balances; the server then
// creates the default accounts (Savings, Wallet, Credit card, Debit card) and starter categories.
export function SetupPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [balances, setBalances] = useState({ savings: "", wallet: "", card: "" });
  const [balanceErrors, setBalanceErrors] = useState({});
  const [starterCategories, setStarterCategories] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const tzid = useMemo(() => deviceZone(), []);

  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(["en"], { type: "currency" });
    } catch {
      return null;
    }
  }, []);

  const searchResults = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const codes = allCurrencyCodes();
    if (!needle) return codes.slice(0, 40);
    return codes
      .filter(
        (code) =>
          code.toLowerCase().includes(needle) ||
          currencyName(code, displayNames).toLowerCase().includes(needle),
      )
      .slice(0, 40);
  }, [search, displayNames]);

  if (user?.setupComplete) return <Navigate to="/month" replace />;

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const quick = QUICK_CURRENCIES.includes(currencyCode)
    ? QUICK_CURRENCIES
    : [...QUICK_CURRENCIES.slice(0, 5), currencyCode];

  async function submit(event) {
    event.preventDefault();
    setError(null);

    const startingBalances = {};
    const errors = {};
    for (const field of BALANCE_FIELDS) {
      const text = balances[field.name].trim();
      if (!text) continue;
      const minor = text === "0" ? 0 : parseAmountToMinor(text, currencyCode);
      if (minor === null) errors[field.name] = "Enter an amount like 1,234.50";
      else startingBalances[field.key] = minor;
    }
    setBalanceErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await meApi.setup({
        currencyCode,
        tzid,
        starterCategories,
        ...(Object.keys(startingBalances).length > 0 && { startingBalances }),
      });
      await refreshUser();
      navigate("/month", { replace: true });
    } catch (caught) {
      setSaving(false);
      if (caught instanceof ApiError && caught.code === "SETUP_ALREADY_DONE") {
        await refreshUser();
        navigate("/month", { replace: true });
        return;
      }
      const fields = fieldErrors(caught);
      setError(Object.values(fields)[0] ?? caught?.message ?? "Could not finish setup. Try again.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col gap-6 px-5 py-8 tablet:max-w-[860px] tablet:px-6 desktop:max-w-[1080px]">
      <Logo withWordmark />
      <header>
        <p className="text-[15px] font-semibold text-text-muted-2">Welcome, {firstName}</p>
        <h1 className="mt-1 text-[24px] font-bold desktop:text-[26px]">Set up your account</h1>
        <p className="mt-1 text-[15px] text-text-muted">
          Pick the currency you track in. You can change it later in Settings.
        </p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
        <div className="grid gap-6 desktop:grid-cols-2">
          <Card className="flex flex-col gap-4">
            <h2 className="text-[13px] font-bold tracking-wider text-text-muted-2 uppercase">
              Currency
            </h2>
            <div
              role="radiogroup"
              aria-label="Currency"
              className="grid grid-cols-2 gap-2 tablet:grid-cols-3"
            >
              {quick.map((code) => (
                <CurrencyTile
                  key={code}
                  code={code}
                  selected={code === currencyCode}
                  onSelect={setCurrencyCode}
                  displayNames={displayNames}
                />
              ))}
            </div>

            <button
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((open) => !open)}
              className="inline-flex min-h-11 items-center gap-1 self-start text-[15px] font-bold text-link"
            >
              All currencies
              <Icon name="chevronDown" size={18} className={cn(showAll && "rotate-180")} />
            </button>

            {showAll ? (
              <div className="flex flex-col gap-2">
                <Input
                  label="Search currencies"
                  placeholder="Search code or name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  autoComplete="off"
                />
                <ul
                  className="flex max-h-64 flex-col gap-1 overflow-y-auto"
                  aria-label="Currencies"
                >
                  {searchResults.map((code) => (
                    <li key={code}>
                      <button
                        type="button"
                        aria-pressed={code === currencyCode}
                        onClick={() => {
                          setCurrencyCode(code);
                          setShowAll(false);
                          setSearch("");
                        }}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left hover:bg-primary/5",
                          code === currencyCode && "bg-primary/18 font-bold",
                        )}
                      >
                        <span className="w-12 font-mono text-[15px] font-bold">{code}</span>
                        <span className="min-w-0 flex-1 truncate text-[15px] text-text-muted-2">
                          {currencyName(code, displayNames)}
                        </span>
                        {code === currencyCode ? <Icon name="check" size={18} /> : null}
                      </button>
                    </li>
                  ))}
                  {searchResults.length === 0 ? (
                    <li className="px-3 py-2 text-[15px] text-text-muted">No currency matches.</li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            <p className="text-[15px] text-text-muted" aria-live="polite">
              Amounts will look like{" "}
              <span className="font-mono font-semibold text-text tabular">
                {preview(currencyCode)}
              </span>
            </p>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10"
              >
                <Icon name="globe" size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-text">
                  {tzid} <span className="text-text-muted">· {zoneLabel(tzid)}</span>
                </h2>
                <p className="text-[13px] text-text-muted">
                  Taken from this device · decides which day an entry falls on
                </p>
              </div>
            </Card>

            <Card className="flex flex-col gap-4">
              <div>
                <h2 className="text-[13px] font-bold tracking-wider text-text-muted-2 uppercase">
                  Starting balances (optional)
                </h2>
                <p className="mt-1 text-[13px] text-text-muted">
                  What each account holds today. Leave blank to start at zero.
                </p>
              </div>
              {BALANCE_FIELDS.map((field) => (
                <Input
                  key={field.name}
                  label={field.label}
                  inputMode="decimal"
                  placeholder="0"
                  value={balances[field.name]}
                  error={balanceErrors[field.name]}
                  onChange={(event) =>
                    setBalances((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  inputClassName="font-mono"
                />
              ))}
            </Card>

            <Card className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-text">Starter categories</h2>
                <p className="text-[13px] text-text-muted">
                  Food, Transport, Rent, Salary and more. You can edit them any time.
                </p>
              </div>
              <Switch
                checked={starterCategories}
                onChange={setStarterCategories}
                label="Add starter categories"
              />
            </Card>
          </div>
        </div>

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={saving}
          className="desktop:ml-auto desktop:w-80"
        >
          Start tracking
        </Button>
      </form>
    </main>
  );
}
