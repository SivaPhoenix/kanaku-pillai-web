import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useSettings } from "../../hooks/useSettings.js";
import { useToast } from "../../hooks/useToast.js";
import { ApiError } from "../../lib/api.js";
import { cn } from "../../lib/cn.js";
import { meApi } from "../../lib/ledger-api.js";
import { Alert, Dialog, Icon, Input } from "../ui/index.js";

function currencyCodes() {
  try {
    return Intl.supportedValuesOf("currency");
  } catch {
    return ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY"];
  }
}

function symbolFor(code, locale) {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export function CurrencyDialog({ open, onClose }) {
  const { currencyCode, locale } = useSettings();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);

  const options = useMemo(() => {
    let names = null;
    try {
      names = new Intl.DisplayNames([locale], { type: "currency" });
    } catch {
      names = null;
    }
    return currencyCodes().map((code) => ({ code, name: names?.of(code) ?? code }));
  }, [locale]);

  const needle = search.trim().toLowerCase();
  const shown = needle
    ? options.filter(
        (o) => o.code.toLowerCase().includes(needle) || o.name.toLowerCase().includes(needle),
      )
    : options;

  async function choose(code) {
    if (code === currencyCode) return onClose();
    setSaving(code);
    setError(null);
    try {
      const result = await meApi.updateSettings({ currencyCode: code });
      await refreshUser();
      await queryClient.invalidateQueries();
      toast.show({
        message: `Currency changed · ${result?.relabeledCount ?? 0} entries relabelled`,
      });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't change the currency. Try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Currency">
      <div className="flex flex-col gap-3 pt-2">
        <Alert tone="warning">
          Changing currency relabels your existing entries. Amounts are not converted.
        </Alert>
        {error ? <Alert>{error}</Alert> : null}
        <Input
          type="search"
          aria-label="Search code or name"
          placeholder="Search code or name"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="flex max-h-[45dvh] flex-col gap-1 overflow-y-auto">
          {shown.map(({ code, name }) => (
            <li key={code}>
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => choose(code)}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-primary/5 disabled:opacity-50",
                  code === currencyCode && "bg-primary/10",
                )}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md surface-l0 font-mono text-[14px] font-bold">
                  {symbolFor(code, locale)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] text-text">
                  {code} {"·"} {name}
                </span>
                {code === currencyCode ? <Icon name="check" size={18} /> : null}
              </button>
            </li>
          ))}
          {shown.length === 0 ? (
            <li className="px-3 py-4 text-[14px] text-text-muted">No currency matches.</li>
          ) : null}
        </ul>
      </div>
    </Dialog>
  );
}
