import { Link, useSearchParams } from "react-router";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Button, Card, EmptyState, IconButton, Segmented } from "../components/ui/index.js";

const GROUPS = [
  { value: "categories", label: "Categories" },
  { value: "accounts", label: "Accounts" },
];

const KINDS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

export function ListsPage() {
  const [params, setParams] = useSearchParams();
  const tab = ["income", "accounts"].includes(params.get("tab")) ? params.get("tab") : "expense";
  const group = tab === "accounts" ? "accounts" : "categories";

  function setTab(value) {
    setParams({ tab: value }, { replace: true });
  }

  const content =
    tab === "accounts"
      ? {
          title: "No accounts yet",
          description: "Accounts you add appear here and in the Add screen.",
          add: "Add account",
        }
      : {
          title: `No ${tab} categories yet`,
          description: "Categories you add appear here and in the Add screen.",
          add: `Add ${tab} category`,
        };

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
      <Card>
        <EmptyState
          title={content.title}
          description={content.description}
          action={
            <Button variant="hairline" disabled title="Coming soon">
              {content.add}
            </Button>
          }
        />
      </Card>
    </div>
  );
}
