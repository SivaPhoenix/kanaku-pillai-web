import { useState } from "react";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { AmountText, Button, EmptyState, IconButton } from "../components/ui/index.js";
import { useAuth } from "../hooks/useAuth.js";

function Tile({ label, tone, money, hidden }) {
  return (
    <div className="min-w-0 rounded-xl surface-l0 p-3">
      <p className="text-[13px] font-semibold text-text-muted-2">{label}</p>
      <AmountText
        minor={0}
        {...money}
        hidden={hidden}
        className={`text-[18px] whitespace-nowrap ${tone}`}
      />
    </div>
  );
}

export function AccountsPage() {
  const { user } = useAuth();
  const { currencyCode, locale } = user.settings;
  const money = { currencyCode, locale };
  const [hidden, setHidden] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Accounts"
        phoneShortcuts={["settings"]}
        actions={
          <IconButton
            icon={hidden ? "eyeOff" : "eye"}
            label={hidden ? "Show balances" : "Hide balances"}
            aria-pressed={hidden}
            onClick={() => setHidden((value) => !value)}
          />
        }
      />

      <section aria-label="Net worth" className="flex flex-col gap-4 rounded-2xl surface-l2 p-5">
        <div>
          <p className="text-[13px] font-semibold text-text-muted-2">Net worth</p>
          <AmountText
            minor={0}
            {...money}
            hidden={hidden}
            className="text-[32px] whitespace-nowrap text-text-muted"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Assets" tone="text-income" money={money} hidden={hidden} />
          <Tile label="Liabilities" tone="text-expense" money={money} hidden={hidden} />
        </div>
      </section>

      <EmptyState
        title="No accounts yet"
        description="Add your bank, cash, cards and investments to see balances and net worth."
        action={
          <Button variant="hairline" disabled title="Coming soon">
            Add account
          </Button>
        }
      />
    </div>
  );
}
