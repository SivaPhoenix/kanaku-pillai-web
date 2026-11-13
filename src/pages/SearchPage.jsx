import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Card, Chip, EmptyState, Input } from "../components/ui/index.js";

const TYPES = [
  { value: "all", label: "All", tone: "primary" },
  { value: "expense", label: "Expense", tone: "expense" },
  { value: "income", label: "Income", tone: "income" },
  { value: "transfer", label: "Transfer", tone: "transfer", tabletUp: true },
];

export function SearchPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [type, setType] = useState(params.get("type") ?? "all");

  function sync(nextQuery, nextType) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextQuery) next.set("q", nextQuery);
        else next.delete("q");
        if (nextType !== "all") next.set("type", nextType);
        else next.delete("type");
        return next;
      },
      { replace: true },
    );
  }

  const hasQuery = query.trim() !== "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <h1 className="sr-only">Search</h1>
      <div className="flex items-end gap-2 pt-2">
        <Input
          autoFocus
          type="search"
          aria-label="Search entries"
          placeholder="Search notes, categories, accounts"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            sync(event.target.value, type);
          }}
        />
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Entry type">
        {TYPES.map((item) => (
          <Chip
            key={item.value}
            tone={item.tone}
            selected={type === item.value}
            className={item.tabletUp ? "hidden tablet:inline-flex" : undefined}
            onClick={() => {
              setType(item.value);
              sync(query, item.value);
            }}
          >
            {item.label}
          </Chip>
        ))}
      </div>

      <Card>
        <p className="text-[15px] text-text">
          <strong className="font-bold">0</strong> results
        </p>
      </Card>

      {hasQuery ? (
        <EmptyState title="No matches" description="Try another word or clear a filter." />
      ) : (
        <EmptyState
          title="Search your entries"
          description="Find entries by note, category, account or amount."
        />
      )}
    </div>
  );
}
