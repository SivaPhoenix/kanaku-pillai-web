import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AccountForm } from "../components/accounts/AccountForm.jsx";
import { AccountRow } from "../components/accounts/AccountRow.jsx";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { CategoryForm } from "../components/lists/CategoryForm.jsx";
import { IconTile } from "../components/transaction/IconTile.jsx";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  IconButton,
  Segmented,
  Spinner,
} from "../components/ui/index.js";
import {
  ACCOUNT_SCOPES,
  CATEGORY_SCOPES,
  useAccounts,
  useCategories,
  useLedgerMutation,
} from "../hooks/useLedger.js";
import { useSettings } from "../hooks/useSettings.js";
import { accountsApi, categoriesApi } from "../lib/ledger-api.js";

const GROUPS = [
  { value: "categories", label: "Categories" },
  { value: "accounts", label: "Accounts" },
];

const KINDS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

function ReorderButtons({ index, count, onMove, disabled }) {
  return (
    <div className="flex shrink-0 pr-1">
      <IconButton
        icon="chevronDown"
        label="Move up"
        className="rotate-180 bg-transparent"
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1)}
      />
      <IconButton
        icon="chevronDown"
        label="Move down"
        className="bg-transparent"
        disabled={disabled || index === count - 1}
        onClick={() => onMove(index, index + 1)}
      />
    </div>
  );
}

function moved(ids, from, to) {
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ListState({ query, children }) {
  if (query.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (query.isError) {
    return (
      <Alert>
        <p>Couldn't load this list.</p>
        <Button variant="ghost" onClick={() => query.refetch()}>
          Retry
        </Button>
      </Alert>
    );
  }
  return children;
}

function CategoriesTab({ kind }) {
  const query = useCategories({ kind, includeArchived: true });
  const [form, setForm] = useState({ open: false, category: null });
  const all = query.data ?? [];
  const active = all.filter((c) => !c.archived);
  const archived = all.filter((c) => c.archived);
  const reorder = useLedgerMutation((ids) => categoriesApi.reorder(kind, ids), {
    scopes: CATEGORY_SCOPES,
  });

  const open = (category = null) => setForm({ open: true, category });
  const row = (category, trailing) => (
    <div key={category.id} className="flex items-center gap-1 rounded-xl surface-l0">
      <div className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
        <IconTile icon={category.icon} tone={category.color} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-text">
            {category.name}
          </span>
          <span className="block truncate text-[13px] text-text-muted">
            {category.usageThisMonth} {category.usageThisMonth === 1 ? "entry" : "entries"} this
            month
          </span>
        </span>
      </div>
      {trailing}
      <IconButton
        icon="edit"
        label={`Edit ${category.name}`}
        className="mr-1 bg-transparent"
        onClick={() => open(category)}
      />
    </div>
  );

  return (
    <ListState query={query}>
      {reorder.isError ? <Alert>Couldn't save the new order. Try again.</Alert> : null}
      {active.length === 0 ? (
        <Card>
          <EmptyState
            title={`No ${kind} categories yet`}
            description="Categories you add appear here and in the Add screen."
          />
        </Card>
      ) : (
        <Card className="flex flex-col gap-2">
          {active.map((category, index) =>
            row(
              category,
              <ReorderButtons
                index={index}
                count={active.length}
                disabled={reorder.isPending}
                onMove={(from, to) =>
                  reorder.mutate(
                    moved(
                      active.map((c) => c.id),
                      from,
                      to,
                    ),
                  )
                }
              />,
            ),
          )}
        </Card>
      )}
      <Button variant="hairline" leftIcon="plus" onClick={() => open()}>
        Add {kind} category
      </Button>
      {archived.length > 0 ? (
        <details className="rounded-2xl surface-l1 p-4">
          <summary className="min-h-11 cursor-pointer text-[13px] font-bold tracking-wider text-text-muted-2 uppercase">
            Archived ({archived.length})
          </summary>
          <div className="mt-2 flex flex-col gap-2">{archived.map((c) => row(c))}</div>
        </details>
      ) : null}
      <CategoryForm
        open={form.open}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        category={form.category}
        kind={kind}
      />
    </ListState>
  );
}

function AccountsTab() {
  const { currencyCode, locale } = useSettings();
  const money = { currencyCode, locale };
  const query = useAccounts({ includeArchived: true });
  const [form, setForm] = useState({ open: false, account: null });
  const all = query.data ?? [];
  const active = all.filter((a) => !a.archived);
  const archived = all.filter((a) => a.archived);
  const reorder = useLedgerMutation((ids) => accountsApi.reorder(ids), { scopes: ACCOUNT_SCOPES });
  const open = (account = null) => setForm({ open: true, account });

  return (
    <ListState query={query}>
      {reorder.isError ? <Alert>Couldn't save the new order. Try again.</Alert> : null}
      {active.length === 0 ? (
        <Card>
          <EmptyState
            title="No accounts yet"
            description="Accounts you add appear here and in the Add screen."
          />
        </Card>
      ) : (
        <Card className="flex flex-col gap-2">
          {active.map((account, index) => (
            <AccountRow
              key={account.id}
              account={account}
              accounts={all}
              money={money}
              onSelect={open}
              trailing={
                <ReorderButtons
                  index={index}
                  count={active.length}
                  disabled={reorder.isPending}
                  onMove={(from, to) =>
                    reorder.mutate(
                      moved(
                        active.map((a) => a.id),
                        from,
                        to,
                      ),
                    )
                  }
                />
              }
            />
          ))}
        </Card>
      )}
      <Button variant="hairline" leftIcon="plus" onClick={() => open()}>
        Add account
      </Button>
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
                accounts={all}
                money={money}
                onSelect={open}
              />
            ))}
          </div>
        </details>
      ) : null}
      <AccountForm
        open={form.open}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        account={form.account}
        accounts={active}
      />
    </ListState>
  );
}

export function ListsPage() {
  const [params, setParams] = useSearchParams();
  const tab = ["income", "accounts"].includes(params.get("tab")) ? params.get("tab") : "expense";
  const group = tab === "accounts" ? "accounts" : "categories";

  function setTab(value) {
    setParams({ tab: value }, { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <PageHeader
        title="Manage lists"
        leading={<IconButton as={Link} to="/settings" icon="back" label="Back to Settings" />}
      />
      <Segmented
        aria-label="List"
        options={GROUPS}
        value={group}
        onChange={(value) => setTab(value === "accounts" ? "accounts" : "expense")}
      />
      {group === "categories" ? (
        <Segmented
          aria-label="Category type"
          variant="tint"
          options={KINDS}
          value={tab}
          onChange={setTab}
        />
      ) : null}
      {tab === "accounts" ? <AccountsTab /> : <CategoriesTab key={tab} kind={tab} />}
    </div>
  );
}
