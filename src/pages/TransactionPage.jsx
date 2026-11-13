import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { IconTile } from "../components/transaction/IconTile.jsx";
import {
  Alert,
  AmountText,
  Button,
  Card,
  ConfirmDialog,
  Divider,
  EmptyState,
  IconButton,
  Spinner,
} from "../components/ui/index.js";
import {
  ENTRY_SCOPES,
  useLedgerMutation,
  useLookups,
  useRecurrences,
  useTransaction,
} from "../hooks/useLedger.js";
import { useSettings } from "../hooks/useSettings.js";
import { useToast } from "../hooks/useToast.js";
import { ApiError } from "../lib/api.js";
import { formatLocalDate, formatTime, toLocalParts } from "../lib/ledger-format.js";
import { transactionsApi } from "../lib/ledger-api.js";
import { queryKeys } from "../lib/query-keys.js";
import { formatMoney } from "../lib/money.js";
import { describeTransaction } from "../lib/transaction-display.js";
import { cn } from "../lib/cn.js";

const BADGE = {
  income: "bg-income/18 text-income",
  expense: "bg-expense/18 text-expense",
  transfer: "bg-transfer/18 text-transfer",
};
const FREQ = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

function Field({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-[14px] text-text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-[15px] font-medium break-words text-text">
        {children}
      </dd>
    </div>
  );
}

export function TransactionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const settings = useSettings();
  const lookups = useLookups();
  const recurrences = useRecurrences();
  const queryClient = useQueryClient();
  const { data: tx, isLoading, isError, error, refetch } = useTransaction(id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [duplicateKey, setDuplicateKey] = useState(() => crypto.randomUUID());

  // No automatic refresh here: refetching this page's own entry right after deleting it would 404. remove() handles it.
  const removeMutation = useLedgerMutation(() => transactionsApi.remove(id), { scopes: [] });
  const restoreMutation = useLedgerMutation((txId) => transactionsApi.restore(txId), {
    scopes: ENTRY_SCOPES,
  });
  const duplicateMutation = useLedgerMutation(
    (key) => transactionsApi.duplicate(id, {}, { idempotencyKey: key }),
    { scopes: ENTRY_SCOPES },
  );

  const back = <IconButton as={Link} to="/month" icon="back" label="Back" />;

  if (isLoading || lookups.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }
  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState
          title="Entry not found"
          description="It may have been deleted."
          action={
            <Button as={Link} to="/month">
              Back to Month
            </Button>
          }
        />
      );
    }
    return (
      <Alert className="mt-4">
        <p>{error?.message ?? "Could not load this entry."}</p>
        <Button variant="hairline" className="mt-2" onClick={() => refetch()}>
          Retry
        </Button>
      </Alert>
    );
  }
  if (!tx) return null;

  const { locale } = settings;
  const { title, icon, tone } = describeTransaction(tx, lookups);
  const account = lookups.accountsById.get(tx.accountId);
  const toAccount = lookups.accountsById.get(tx.toAccountId);
  const category = lookups.categoriesById.get(tx.categoryId);
  const signed = formatMoney(tx.amountMinor, {
    currencyCode: tx.currencyCode,
    locale,
    type: tx.type,
  });
  const dateLabel = formatLocalDate(tx.localDate, { locale, style: "full" });
  const rule = tx.recurrenceId ? recurrences.data?.find((r) => r.id === tx.recurrenceId) : null;
  const added = toLocalParts(tx.createdAt, tx.tzid);
  const edited = tx.updatedAt !== tx.createdAt ? toLocalParts(tx.updatedAt, tx.tzid) : null;
  const stamp = (parts, iso) =>
    `${formatLocalDate(parts.localDate, { locale })}, ${formatTime(iso, { locale, timeZone: tx.tzid })}`;

  async function duplicate() {
    setActionError(null);
    try {
      const copy = await duplicateMutation.mutateAsync(duplicateKey);
      setDuplicateKey(crypto.randomUUID());
      toast.show({ message: "Duplicated" });
      navigate(`/tx/${copy.id}`);
    } catch (e) {
      setActionError(e?.message ?? "Could not duplicate this entry.");
    }
  }

  async function remove() {
    setActionError(null);
    try {
      await removeMutation.mutateAsync();
    } catch (e) {
      setConfirmOpen(false);
      setActionError(e?.message ?? "Could not delete this entry.");
      return;
    }
    setConfirmOpen(false);
    toast.show({
      message: "Deleted",
      duration: 10000,
      action: {
        label: "Undo",
        onClick: () => {
          restoreMutation
            .mutateAsync(tx.id)
            .then(() => toast.show({ message: "Restored" }))
            .catch((e) =>
              toast.show({ message: e?.message ?? "Could not restore", tone: "danger" }),
            );
        },
      },
    });
    // Leave the page first (navigation resolves asynchronously), so this deleted entry is not refetched.
    await navigate(`/daily?d=${tx.localDate}`, { replace: true });
    queryClient.removeQueries({ queryKey: queryKeys.transaction(tx.id) });
    await Promise.all(ENTRY_SCOPES.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  }

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 py-2">
      <header className="flex items-center justify-between">
        {back}
        <h1 className="sr-only">Entry details</h1>
        <IconButton as={Link} to={`/tx/${tx.id}/edit`} icon="edit" label="Edit" />
      </header>

      <div className="flex flex-col items-center gap-2 text-center">
        <IconTile icon={icon} tone={tone} size="lg" />
        <p className="text-[17px] font-semibold break-words text-text">{title}</p>
        <AmountText
          minor={tx.amountMinor}
          type={tx.type}
          currencyCode={tx.currencyCode}
          locale={locale}
          className="text-[40px] leading-tight"
        />
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[13px] font-semibold capitalize",
            BADGE[tx.type],
          )}
        >
          {tx.type}
        </span>
      </div>

      {actionError ? <Alert>{actionError}</Alert> : null}

      <Card as="dl" className="flex flex-col py-2">
        {tx.type === "transfer" ? (
          <>
            <Field label="From">{account?.name ?? "Account"}</Field>
            <Divider />
            <Field label="To">{toAccount?.name ?? "Account"}</Field>
          </>
        ) : (
          <>
            <Field label="Category">{category?.name ?? "Uncategorised"}</Field>
            <Divider />
            <Field label="Account">{account?.name ?? "Account"}</Field>
          </>
        )}
        <Divider />
        <Field label="Date">{dateLabel}</Field>
        <Divider />
        <Field label="Time">
          {formatTime(tx.occurredAt, { locale, timeZone: tx.tzid })} · {tx.tzid}
        </Field>
        <Divider />
        <Field label="Note">{tx.note || "None"}</Field>
        {tx.recurrenceId ? (
          <>
            <Divider />
            <Field label="Repeats">
              {rule ? (FREQ[rule.freq] ?? rule.freq) : "Repeating entry"}
            </Field>
          </>
        ) : null}
        {tx.installmentPlanId ? (
          <>
            <Divider />
            <Field label="Instalment">
              Instalment {tx.installmentIndex} of {tx.installmentCount}
            </Field>
          </>
        ) : null}
      </Card>

      <p className="text-center text-[13px] text-text-muted">
        Added {stamp(added, tx.createdAt)}
        {edited ? ` · Last edited ${stamp(edited, tx.updatedAt)}` : ""}
      </p>

      <div className="flex flex-col gap-3 tablet:flex-row">
        <Button
          variant="secondary"
          fullWidth
          leftIcon="plus"
          loading={duplicateMutation.isPending}
          onClick={duplicate}
        >
          Duplicate
        </Button>
        <Button variant="danger" fullWidth leftIcon="trash" onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        loading={removeMutation.isPending}
        title={`Delete this ${tx.type}?`}
        description={`${signed} · ${title} · ${dateLabel}. Your balance will update.`}
      />
    </div>
  );
}
