import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { SelectField } from "../components/accounts/SelectField.jsx";
import { TransactionRow } from "../components/transaction/TransactionRow.jsx";
import {
  Alert,
  AmountText,
  Button,
  Card,
  Chip,
  EmptyState,
  Input,
  Spinner,
} from "../components/ui/index.js";
import {
  useAccounts,
  useCategories,
  useLookups,
  useTransactions,
  useTransactionSummary,
} from "../hooks/useLedger.js";
import { useSettings } from "../hooks/useSettings.js";
import { useToast } from "../hooks/useToast.js";
import { transactionsApi } from "../lib/ledger-api.js";
import { formatLocalDate } from "../lib/ledger-format.js";
import { describeTransaction } from "../lib/transaction-display.js";
import { buildSearchFilters } from "../schemas/search.js";

const TYPES = [
  { value: "all", label: "All", tone: "primary" },
  { value: "expense", label: "Expense", tone: "expense" },
  { value: "income", label: "Income", tone: "income" },
  { value: "transfer", label: "Transfer", tone: "transfer", tabletUp: true },
];

const PAGE_SIZE = 50;

function DateBlock({ localDate, locale }) {
  const date = new Date(`${localDate}T00:00:00Z`);
  return (
    <span className="flex w-11 shrink-0 flex-col items-center text-center" aria-hidden="true">
      <span className="font-mono text-[18px] leading-none font-bold text-text">
        {date.getUTCDate()}
      </span>
      <span className="text-[12px] text-text-muted">
        {date.toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" })}
      </span>
    </span>
  );
}

function ResultsTable({ items, lookups, settings }) {
  const cell = "px-3 py-2";
  return (
    <table className="w-full text-left text-[14px]">
      <thead>
        <tr className="text-[13px] text-text-muted-2">
          <th className={cell}>Date</th>
          <th className={cell}>Note</th>
          <th className={cell}>Category</th>
          <th className={cell}>Account</th>
          <th className={`${cell} text-right`}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((tx) => {
          const { title } = describeTransaction(tx, lookups);
          const category = lookups.categoriesById.get(tx.categoryId)?.name ?? "";
          const account = lookups.accountsById.get(tx.accountId)?.name ?? "";
          const link = "block min-h-11 py-2.5 truncate";
          return (
            <tr key={tx.id} className="border-t border-line hover:bg-primary/5">
              <td className="whitespace-nowrap">
                <Link to={`/tx/${tx.id}`} className={`${link} px-3`}>
                  {formatLocalDate(tx.localDate, { locale: settings.locale })}
                </Link>
              </td>
              <td className="max-w-[260px]">
                <Link to={`/tx/${tx.id}`} className={`${link} px-3 font-semibold`}>
                  {title}
                </Link>
              </td>
              <td>
                <Link to={`/tx/${tx.id}`} className={`${link} px-3`}>
                  {category || "—"}
                </Link>
              </td>
              <td>
                <Link to={`/tx/${tx.id}`} className={`${link} px-3`}>
                  {account}
                </Link>
              </td>
              <td className="text-right whitespace-nowrap">
                <Link to={`/tx/${tx.id}`} className={`${link} px-3`}>
                  <AmountText
                    minor={tx.amountMinor}
                    type={tx.type}
                    currencyCode={tx.currencyCode}
                    locale={settings.locale}
                  />
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const settings = useSettings();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get("q") ?? "");
  const [exporting, setExporting] = useState(false);

  const type = TYPES.some((t) => t.value === params.get("type")) ? params.get("type") : "all";
  const filters = buildSearchFilters(params, settings.currencyCode);
  const hasCriteria = Object.keys(filters).length > 0;

  function setParam(name, value) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "all") next.set(name, value);
        else next.delete(name);
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim() !== (params.get("q") ?? "")) setParam("q", text.trim());
    }, 300);
    return () => clearTimeout(timer);
    // setParam is recreated each render; only the typed text should restart the debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const lookups = useLookups();
  const categories = useCategories({ includeArchived: true });
  const accounts = useAccounts({ includeArchived: true });
  const summary = useTransactionSummary(filters, { enabled: hasCriteria });
  const list = useTransactions({ ...filters, limit: PAGE_SIZE }, { enabled: hasCriteria });
  const items = list.data?.items ?? [];
  const net = summary.data?.netMinor ?? 0;

  async function exportCsv() {
    setExporting(true);
    try {
      const { blob, headers } = await transactionsApi.exportCsv(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "kanaku-pillai-transactions.csv";
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      if (headers.get("X-Export-Truncated") === "true") {
        toast.show({ message: "Exported the newest 10,000 entries" });
      }
    } catch (error) {
      toast.show({ message: error?.message ?? "Couldn't export. Try again.", tone: "danger" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <h1 className="sr-only">Search</h1>
      <div className="flex items-end gap-2 pt-2">
        <Input
          autoFocus
          type="search"
          aria-label="Search entries"
          placeholder="Search notes, categories, accounts"
          autoComplete="off"
          value={text}
          onChange={(event) => setText(event.target.value)}
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
            onClick={() => setParam("type", item.value)}
          >
            {item.label}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
        <Input
          type="date"
          label="From"
          value={params.get("from") ?? ""}
          onChange={(e) => setParam("from", e.target.value)}
        />
        <Input
          type="date"
          label="To"
          value={params.get("to") ?? ""}
          onChange={(e) => setParam("to", e.target.value)}
        />
        <SelectField
          label="Category"
          value={params.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value)}
        >
          <option value="">All categories</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Account"
          value={params.get("account") ?? ""}
          onChange={(e) => setParam("account", e.target.value)}
        >
          <option value="">All accounts</option>
          {(accounts.data ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </SelectField>
        <Input
          label="Min amount"
          inputMode="decimal"
          className="hidden desktop:flex"
          value={params.get("min") ?? ""}
          onChange={(e) => setParam("min", e.target.value)}
        />
        <Input
          label="Max amount"
          inputMode="decimal"
          className="hidden desktop:flex"
          value={params.get("max") ?? ""}
          onChange={(e) => setParam("max", e.target.value)}
        />
      </div>

      {hasCriteria ? (
        <Card className="flex items-center justify-between gap-3">
          <p className="text-[15px] text-text">
            <strong className="font-bold">{summary.data?.count ?? 0}</strong> results
          </p>
          <div className="flex items-center gap-3">
            <AmountText
              minor={Math.abs(net)}
              type={net > 0 ? "income" : net < 0 ? "expense" : undefined}
              currencyCode={settings.currencyCode}
              locale={settings.locale}
              className="text-[17px] whitespace-nowrap"
            />
            <Button
              variant="secondary"
              className="hidden desktop:inline-flex"
              loading={exporting}
              onClick={exportCsv}
            >
              Export CSV
            </Button>
          </div>
        </Card>
      ) : null}

      {!hasCriteria ? (
        <EmptyState
          title="Search your entries"
          description="Find entries by note, category, account or amount."
        />
      ) : list.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : list.isError ? (
        <Alert>
          <p>Couldn't load results.</p>
          <Button variant="ghost" onClick={() => list.refetch()}>
            Retry
          </Button>
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState title="No matches" description="Try another word or clear a filter." />
      ) : (
        <>
          <ul className="flex flex-col gap-2 desktop:hidden">
            {items.map((tx) => (
              <li key={tx.id} className="flex items-center gap-2">
                <DateBlock localDate={tx.localDate} locale={settings.locale} />
                <TransactionRow
                  tx={tx}
                  lookups={lookups}
                  settings={settings}
                  className="min-w-0 flex-1"
                />
              </li>
            ))}
          </ul>
          <Card className="hidden overflow-x-auto desktop:block">
            <ResultsTable items={items} lookups={lookups} settings={settings} />
          </Card>
          {list.hasNextPage ? (
            <Button
              variant="secondary"
              loading={list.isFetchingNextPage}
              onClick={() => list.fetchNextPage()}
            >
              Load more
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
