import { useState } from "react";
import { AccountForm } from "../components/accounts/AccountForm.jsx";
import { AccountRow } from "../components/accounts/AccountRow.jsx";
import { CreditCardBlock } from "../components/accounts/CreditCardBlock.jsx";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import {
  Alert,
  AmountText,
  Button,
  Card,
  EmptyState,
  IconButton,
  Spinner,
} from "../components/ui/index.js";
import { useAccounts, useAccountSummary } from "../hooks/useLedger.js";
import { useSettings } from "../hooks/useSettings.js";

const GROUPS = [
  { label: "Bank", types: ["bank"] },
  { label: "Cash", types: ["cash"] },
  { label: "Cards", types: ["credit_card", "debit_card"] },
  { label: "Investments", types: ["investment"] },
];

function Tile({ label, tone, minor, money, hidden }) {
  return (
    <div className="min-w-0 rounded-xl surface-l0 p-3">
      <p className="text-[13px] font-semibold text-text-muted-2">{label}</p>
      <AmountText
        minor={minor ?? 0}
        {...money}
        hidden={hidden}
        className={`text-[18px] whitespace-nowrap ${tone}`}
      />
    </div>
  );
}

export function AccountsPage() {
  const { currencyCode, locale } = useSettings();
  const money = { currencyCode, locale };
  const [hidden, setHidden] = useState(false);
  const [form, setForm] = useState({ open: false, account: null });

  const summary = useAccountSummary();
  const accountsQuery = useAccounts();
  const allQuery = useAccounts({ includeArchived: true });
  const accounts = accountsQuery.data ?? [];
  const archived = (allQuery.data ?? []).filter((a) => a.archived);
  const defaultBank =
    accounts.find((a) => a.type === "bank" && a.isDefault) ??
    accounts.find((a) => a.type === "bank");

  const openForm = (account = null) => setForm({ open: true, account });
  const closeForm = () => setForm((current) => ({ ...current, open: false }));

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
          {summary.isError ? (
            <Alert className="mt-2">
              <p>Couldn't load net worth.</p>
              <Button variant="ghost" onClick={() => summary.refetch()}>
                Retry
              </Button>
            </Alert>
          ) : (
            <AmountText
              minor={summary.data?.netWorthMinor ?? 0}
              {...money}
              hidden={hidden}
              className="text-[32px] whitespace-nowrap"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Tile
            label="Assets"
            tone="text-income"
            minor={summary.data?.assetsMinor}
            money={money}
            hidden={hidden}
          />
          <Tile
            label="Liabilities"
            tone="text-expense"
            minor={summary.data?.liabilitiesMinor}
            money={money}
            hidden={hidden}
          />
        </div>
      </section>

      {accountsQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : accountsQuery.isError ? (
        <Alert>
          <p>Couldn't load your accounts.</p>
          <Button variant="ghost" onClick={() => accountsQuery.refetch()}>
            Retry
          </Button>
        </Alert>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          description="Add your bank, cash, cards and investments to see balances and net worth."
          action={
            <Button variant="hairline" onClick={() => openForm()}>
              Add account
            </Button>
          }
        />
      ) : (
        <>
          {GROUPS.map((group) => {
            const items = accounts.filter((a) => group.types.includes(a.type));
            if (items.length === 0) return null;
            return (
              <section key={group.label} className="flex flex-col gap-2">
                <h2 className="px-1 text-[13px] font-bold tracking-wider text-text-muted-2 uppercase">
                  {group.label}
                </h2>
                <Card className="flex flex-col gap-2">
                  {items.map((account) =>
                    account.type === "credit_card" ? (
                      <CreditCardBlock
                        key={account.id}
                        account={account}
                        defaultBank={defaultBank}
                        money={money}
                        hidden={hidden}
                        onSelect={openForm}
                      />
                    ) : (
                      <AccountRow
                        key={account.id}
                        account={account}
                        accounts={accounts}
                        money={money}
                        hidden={hidden}
                        onSelect={openForm}
                      />
                    ),
                  )}
                </Card>
              </section>
            );
          })}
          <Button variant="hairline" leftIcon="plus" onClick={() => openForm()}>
            Add account
          </Button>
        </>
      )}

      {archived.length > 0 ? (
        <details className="rounded-2xl surface-l1 p-4">
          <summary className="min-h-11 cursor-pointer text-[13px] font-bold tracking-wider text-text-muted-2 uppercase">
            Archived ({archived.length})
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {archived.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                accounts={allQuery.data}
                money={money}
                hidden={hidden}
                onSelect={openForm}
              />
            ))}
          </div>
        </details>
      ) : null}

      <AccountForm
        open={form.open}
        onClose={closeForm}
        account={form.account}
        accounts={accounts}
      />
    </div>
  );
}
