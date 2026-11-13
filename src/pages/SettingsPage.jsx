import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { SelectField } from "../components/accounts/SelectField.jsx";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { CurrencyDialog } from "../components/settings/CurrencyDialog.jsx";
import { DeleteAccountDialog } from "../components/settings/DeleteAccountDialog.jsx";
import { ProfileDialog } from "../components/settings/ProfileDialog.jsx";
import { SessionsList } from "../components/settings/SessionsList.jsx";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Dialog,
  Icon,
  Segmented,
  Switch,
} from "../components/ui/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { useTheme } from "../hooks/useTheme.js";
import { ApiError } from "../lib/api.js";
import { config } from "../lib/config.js";
import { meApi } from "../lib/ledger-api.js";

const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const WEEK_STARTS = [
  { value: "mon", label: "Monday" },
  { value: "sun", label: "Sunday" },
];

const ROW = "flex min-h-[54px] items-center justify-between gap-3 rounded-xl surface-l0 px-4 py-2";

function SectionLabel({ children }) {
  return (
    <h2 className="px-1 text-[13px] font-bold tracking-wider text-text-muted-2 uppercase">
      {children}
    </h2>
  );
}

function Row({ label, value, as: Component = "div", ...rest }) {
  return (
    <Component className={`${ROW} text-left`} {...rest}>
      <span className="min-w-0 text-[15px] font-semibold text-text">{label}</span>
      {value ? (
        <span className="min-w-0 text-right text-[15px] break-words text-text-muted">{value}</span>
      ) : null}
    </Component>
  );
}

function LinkRow({ to, label }) {
  return (
    <Link to={to} className={ROW}>
      <span className="min-w-0 text-[15px] font-semibold text-text">{label}</span>
      <Icon name="forward" size={18} className="shrink-0 text-text-muted" />
    </Link>
  );
}

function currencyLabel(currencyCode, locale) {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).formatToParts(0);
    const symbol = parts.find((p) => p.type === "currency")?.value ?? currencyCode;
    return `${currencyCode} · ${symbol}`;
  } catch {
    return currencyCode;
  }
}

function timeZones() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["Asia/Kolkata", "UTC"];
  }
}

const deviceZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const { currencyCode, locale, tzid, tzMode = "device", weekStart } = user.settings;
  const hasPassword = user.authMethods?.includes("password");
  const hasGoogle = user.authMethods?.includes("google");
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function signOut() {
    await logout();
    navigate("/auth/login", { replace: true });
  }

  async function saveSettings(body) {
    setSaving(true);
    setError(null);
    try {
      await meApi.updateSettings(body);
      await refreshUser();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save that setting. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const closeDialog = () => setDialog(null);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <PageHeader title="Settings" />

      {error ? <Alert>{error}</Alert> : null}

      <Card className="flex items-center gap-4">
        <Avatar name={user.name} src={user.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold text-text">{user.name}</p>
          <p className="truncate text-[14px] text-text-muted">{user.email}</p>
          {hasGoogle ? <p className="text-[13px] text-text-muted">Signed in with Google</p> : null}
        </div>
        <Button variant="ghost" onClick={() => setDialog("profile")}>
          Edit
        </Button>
      </Card>

      <section className="flex flex-col gap-2">
        <SectionLabel>Preferences</SectionLabel>
        <Card className="flex flex-col gap-2">
          <Row
            as="button"
            type="button"
            onClick={() => setDialog("currency")}
            label="Currency"
            value={currencyLabel(currencyCode, locale)}
          />
          <div className={ROW}>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-text">Use phone time zone</span>
              <span className="block text-[13px] break-words text-text-muted">{tzid}</span>
            </span>
            <Switch
              label="Use phone time zone"
              checked={tzMode === "device"}
              disabled={saving}
              onChange={(on) =>
                saveSettings(
                  on ? { tzMode: "device", tzid: deviceZone() } : { tzMode: "manual", tzid },
                )
              }
            />
          </div>
          {tzMode === "manual" ? (
            <div className="rounded-xl surface-l0 p-4">
              <SelectField
                label="Time zone"
                value={tzid}
                disabled={saving}
                onChange={(e) => saveSettings({ tzMode: "manual", tzid: e.target.value })}
              >
                {timeZones().map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </SelectField>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 rounded-xl surface-l0 p-4">
            <span className="text-[15px] font-semibold text-text">Appearance</span>
            <Segmented aria-label="Appearance" options={THEMES} value={mode} onChange={setMode} />
          </div>
          <div className="flex flex-col gap-3 rounded-xl surface-l0 p-4">
            <span className="text-[15px] font-semibold text-text">Week starts on</span>
            <Segmented
              aria-label="Week starts on"
              options={WEEK_STARTS}
              value={weekStart}
              onChange={(value) => value !== weekStart && saveSettings({ weekStart: value })}
            />
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Lists</SectionLabel>
        <Card className="flex flex-col gap-2">
          <LinkRow to="/lists?tab=expense" label="Categories" />
          <LinkRow to="/lists?tab=accounts" label="Payment modes / Accounts" />
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Signed-in devices</SectionLabel>
        <Card className="hidden tablet:block">
          <SessionsList locale={locale} />
        </Card>
        <Card className="tablet:hidden">
          <Row
            as="button"
            type="button"
            label="Signed-in devices"
            onClick={() => setDialog("sessions")}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Account</SectionLabel>
        <Card className="flex flex-col gap-3">
          {hasPassword ? (
            <Row as="button" type="button" disabled title="Coming soon" label="Change password" />
          ) : null}
          <Button variant="secondary" leftIcon="logout" onClick={signOut}>
            Sign out
          </Button>
          <Button variant="ghost" className="text-danger" onClick={() => setDialog("delete")}>
            Delete account
          </Button>
        </Card>
      </section>

      <p className="pt-2 text-center text-[13px] text-text-muted">
        Kanaku Pillai {"·"} v{config.appVersion}
      </p>

      <ProfileDialog open={dialog === "profile"} onClose={closeDialog} />
      <CurrencyDialog open={dialog === "currency"} onClose={closeDialog} />
      <DeleteAccountDialog open={dialog === "delete"} onClose={closeDialog} />
      <Dialog open={dialog === "sessions"} onClose={closeDialog} title="Signed-in devices">
        <SessionsList locale={locale} />
      </Dialog>
    </div>
  );
}
