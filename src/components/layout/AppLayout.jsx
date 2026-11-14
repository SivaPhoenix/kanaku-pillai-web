import { Suspense, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { PHONE_TABS, RAIL_ITEMS, SIDEBAR_ITEMS } from "../../lib/navigation.js";
import { cn } from "../../lib/cn.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useResendVerification } from "../../hooks/useResendVerification.js";
import { Alert, Avatar, Button, Icon, IconButton, Logo, Spinner } from "../ui/index.js";

const BANNER_DISMISSED_KEY = "kp-verify-banner-dismissed";

function wasDismissed() {
  try {
    return sessionStorage.getItem(BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function VerifyEmailBanner() {
  const [dismissed, setDismissed] = useState(wasDismissed);
  const { resend, sending } = useResendVerification();
  if (dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, "1");
    } catch {
      // Storage can be blocked; the banner then only stays hidden until the next reload.
    }
    setDismissed(true);
  }

  return (
    <Alert tone="warning" align="center" className="mb-4 [&>div]:flex-1">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <p className="min-w-0 flex-1 basis-48">Verify your email to keep your account secure.</p>
          <Button variant="ghost" loading={sending} onClick={resend} className="h-11 px-2">
            Resend email
          </Button>
        </div>
        <IconButton icon="close" label="Dismiss" onClick={dismiss} />
      </div>
    </Alert>
  );
}

const navState = ({ isActive }) => (isActive ? "bg-primary/20 text-text" : "text-text-muted-2");

function TabLink({ item }) {
  return (
    <NavLink
      to={item.to}
      className={(state) =>
        cn(
          "flex min-h-14 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[12px] font-semibold",
          navState(state),
        )
      }
    >
      <Icon name={item.icon} size={22} />
      {item.label}
    </NavLink>
  );
}

function PhoneTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-4 bottom-6 z-30 flex h-[72px] items-center gap-1 rounded-2xl surface-l2 px-2 tablet:hidden"
    >
      {PHONE_TABS.left.map((item) => (
        <TabLink key={item.to} item={item} />
      ))}
      <div className="flex flex-1 justify-center">
        <Link
          to="/add"
          aria-label="New entry"
          title="New entry"
          className="inline-flex size-14 items-center justify-center rounded-xl bg-primary text-on-primary"
        >
          <Icon name="plus" size={26} />
        </Link>
      </div>
      {PHONE_TABS.right.map((item) => (
        <TabLink key={item.to} item={item} />
      ))}
    </nav>
  );
}

function Rail() {
  return (
    <nav
      aria-label="Primary"
      className="fixed top-6 bottom-6 left-6 z-30 hidden w-[88px] flex-col items-center gap-2 rounded-2xl surface-l2 py-4 tablet:flex desktop:hidden"
    >
      <Logo className="mb-4" />
      <ul className="flex flex-col items-center gap-2">
        {RAIL_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              aria-label={item.label}
              title={item.label}
              className={(state) =>
                cn("inline-flex size-14 items-center justify-center rounded-xl", navState(state))
              }
            >
              <Icon name={item.icon} size={24} />
            </NavLink>
          </li>
        ))}
      </ul>
      <Link
        to="/add"
        aria-label="New entry"
        title="New entry"
        className="mt-auto inline-flex size-14 items-center justify-center rounded-xl bg-primary text-on-primary"
      >
        <Icon name="plus" size={24} />
      </Link>
    </nav>
  );
}

function Sidebar() {
  const { user } = useAuth();
  return (
    <nav
      aria-label="Primary"
      className="fixed top-6 bottom-6 left-6 z-30 hidden w-[232px] flex-col gap-4 rounded-2xl surface-l2 p-4 desktop:flex large:w-[248px]"
    >
      <Logo withWordmark className="px-2 pt-1" />
      <Button as={Link} to="/add" fullWidth leftIcon="plus">
        New entry
      </Button>
      <ul className="flex flex-col gap-1">
        {SIDEBAR_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={(state) =>
                cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-semibold",
                  navState(state),
                )
              }
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      {user ? (
        <Link
          to="/settings"
          aria-label={`${user.name}, settings`}
          className="mt-auto flex min-h-11 items-center gap-3 rounded-lg px-2 py-1"
        >
          <Avatar name={user.name} src={user.avatarUrl} size="sm" decorative />
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">
            {user.name}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}

export function AppLayout() {
  const { user } = useAuth();
  const showVerifyBanner = user?.emailVerified === false && user.authMethods?.includes("password");
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-on-primary"
      >
        Skip to content
      </a>
      <PhoneTabBar />
      <Rail />
      <Sidebar />
      <main
        id="main"
        tabIndex={-1}
        className="min-w-0 px-5 pt-4 pb-32 tablet:ml-28 tablet:px-6 tablet:pt-6 tablet:pb-10 desktop:ml-64 large:ml-68 large:px-7"
      >
        <div className="mx-auto w-full max-w-[1400px]">
          {showVerifyBanner ? <VerifyEmailBanner /> : null}
          <Suspense
            fallback={
              <div className="grid min-h-[50dvh] place-items-center text-text-muted">
                <Spinner />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
