import { Link, useNavigate } from "react-router";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Avatar, Button, Card, Icon, Segmented } from "../components/ui/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { useTheme } from "../hooks/useTheme.js";
import { config } from "../lib/config.js";

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
    <Component className={ROW} {...rest}>
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

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const { currencyCode, locale, tzid, weekStart } = user.settings;
  const hasPassword = user.authMethods?.includes("password");
  const hasGoogle = user.authMethods?.includes("google");

  async function signOut() {
    await logout();
    navigate("/auth/login", { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <PageHeader title="Settings" />

      <Card className="flex items-center gap-4">
        <Avatar name={user.name} src={user.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold text-text">{user.name}</p>
          <p className="truncate text-[14px] text-text-muted">{user.email}</p>
          {hasGoogle ? <p className="text-[13px] text-text-muted">Signed in with Google</p> : null}
        </div>
        <Button variant="ghost" disabled title="Coming soon">
          Edit
        </Button>
      </Card>

      <section className="flex flex-col gap-2">
        <SectionLabel>Preferences</SectionLabel>
        <Card className="flex flex-col gap-2">
          <Row
            as="button"
            type="button"
            disabled
            title="Coming soon"
            label="Currency"
            value={currencyLabel(currencyCode, locale)}
          />
          <Row label="Time zone" value={tzid} />
          <div className="flex flex-col gap-3 rounded-xl surface-l0 p-4">
            <span className="text-[15px] font-semibold text-text">Appearance</span>
            <Segmented aria-label="Appearance" options={THEMES} value={mode} onChange={setMode} />
          </div>
          <div className="flex flex-col gap-3 rounded-xl surface-l0 p-4">
            <span className="text-[15px] font-semibold text-text">Week starts on</span>
            <fieldset disabled title="Coming soon" className="min-w-0 border-0 p-0 opacity-50">
              <Segmented
                aria-label="Week starts on"
                options={WEEK_STARTS}
                value={weekStart}
                onChange={() => {}}
              />
            </fieldset>
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
        <SectionLabel>Account</SectionLabel>
        <Card className="flex flex-col gap-3">
          {hasPassword ? (
            <Row as="button" type="button" disabled title="Coming soon" label="Change password" />
          ) : null}
          <Button variant="secondary" leftIcon="logout" onClick={signOut}>
            Sign out
          </Button>
          <Button variant="ghost" disabled title="Coming soon" className="text-danger">
            Delete account
          </Button>
        </Card>
      </section>

      <p className="pt-2 text-center text-[13px] text-text-muted">
        Kanaku Pillai {"·"} v{config.appVersion}
      </p>
    </div>
  );
}
