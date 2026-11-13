import { Link, useParams, useSearchParams } from "react-router";
import { TransactionForm } from "../components/add/TransactionForm.jsx";
import { Alert, Button, EmptyState, Spinner } from "../components/ui/index.js";
import { useAccounts, useCategories, useTransaction } from "../hooks/useLedger.js";
import { useSettings } from "../hooks/useSettings.js";
import { ApiError } from "../lib/api.js";
import { minorToInput, TRANSACTION_TYPES } from "../schemas/transaction.js";

function prefillFrom(params, accounts, currencyCode) {
  const initial = {};
  const type = params.get("type");
  if (TRANSACTION_TYPES.includes(type)) initial.type = type;
  const known = (id) => accounts.some((a) => a.id === id && !a.archived);
  const from = params.get("from");
  const to = params.get("to");
  if (from && known(from)) initial.accountId = from;
  if (to && known(to) && initial.type === "transfer") initial.toAccountId = to;
  const amount = Number(params.get("amount"));
  if (Number.isSafeInteger(amount) && amount > 0)
    initial.amount = minorToInput(amount, currencyCode);
  return initial;
}

export function AddTransactionPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { currencyCode } = useSettings();
  const accounts = useAccounts({ includeArchived: true });
  const categories = useCategories({ includeArchived: true });
  const transaction = useTransaction(id);

  const queries = [accounts, categories, ...(id ? [transaction] : [])];
  const failed = queries.find((q) => q.isError);
  const notFound = id && transaction.error instanceof ApiError && transaction.error.status === 404;

  let content;
  if (notFound) {
    content = (
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
  } else if (failed) {
    content = (
      <Alert>
        <p>{failed.error?.message ?? "Could not load this screen."}</p>
        <Button
          variant="hairline"
          className="mt-2"
          onClick={() => queries.forEach((q) => q.refetch())}
        >
          Retry
        </Button>
      </Alert>
    );
  } else if (queries.some((q) => q.isLoading || !q.data)) {
    content = (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  } else {
    content = (
      <TransactionForm
        key={id ?? "new"}
        transaction={id ? transaction.data : undefined}
        initial={id ? undefined : prefillFrom(params, accounts.data, currencyCode)}
        accounts={accounts.data}
        categories={categories.data}
      />
    );
  }

  return <div className="py-2">{content}</div>;
}
