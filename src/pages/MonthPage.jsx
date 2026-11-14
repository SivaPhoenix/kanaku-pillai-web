import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CategoryBar } from "../components/charts/CategoryBar.jsx";
import { DailyBars } from "../components/charts/DailyBars.jsx";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { DateGroup } from "../components/transaction/DateGroup.jsx";
import { IconTile } from "../components/transaction/IconTile.jsx";
import { TransactionRow } from "../components/transaction/TransactionRow.jsx";
import {
  Alert,
  AmountText,
  Button,
  Card,
  Divider,
  EmptyState,
  Icon,
  IconButton,
  Spinner,
} from "../components/ui/index.js";
import { useDay, useLookups, useMonthStats, useTransactions } from "../hooks/useLedger.js";
import { useSettings } from "../hooks/useSettings.js";
import { cn } from "../lib/cn.js";
import {
  currentMonth,
  daysInMonth,
  formatLocalDate,
  formatMonth,
  groupByLocalDate,
  shiftMonth,
  todayLocalDate,
} from "../lib/ledger-format.js";
import { formatMoney } from "../lib/money.js";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const COLLAPSED_COUNT = 4;

function ErrorBlock({ message, onRetry }) {
  return (
    <Alert>
      <p>{message}</p>
      <Button variant="ghost" className="mt-1 h-11 px-0" onClick={onRetry}>
        Retry
      </Button>
    </Alert>
  );
}

// A container, so the amount inside can size itself to the tile width (cqi) instead of overflowing it on phones.
function Tile({ label, children, className }) {
  return (
    <div className={cn("@container min-w-0", className)}>
      <p className="text-[13px] font-semibold text-text-muted-2">{label}</p>
      {children}
    </div>
  );
}

function InvestRow({ icon, label, children }) {
  return (
    <div className="@container flex min-w-0 items-center gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg surface-l0 text-text-muted-2">
        <Icon name={icon} size={18} />
      </span>
      <p className="min-w-0 flex-1 text-[14px] text-text-muted-2">{label}</p>
      {children}
    </div>
  );
}

// Investing is a transfer, so it never touches income, expense or balance; this shows it next to them (values from the API).
function InvestingSummary({ data, money, className }) {
  if (data.investedMinor === 0 && data.withdrawnMinor === 0) return null;
  const amount = "text-[clamp(13px,4.5cqi,16px)] whitespace-nowrap";
  return (
    <div
      aria-label="Investing this month"
      role="group"
      className={cn("flex flex-col gap-3", className)}
    >
      <InvestRow icon="trend" label="Invested">
        <AmountText minor={data.investedMinor} type="transfer" {...money} className={amount} />
      </InvestRow>
      {data.withdrawnMinor > 0 ? (
        <InvestRow icon="refund" label="Taken out of investments">
          <AmountText minor={data.withdrawnMinor} type="transfer" {...money} className={amount} />
        </InvestRow>
      ) : null}
      <InvestRow icon="wallet" label="Left after investing">
        <BalanceText minor={data.afterInvestingMinor} money={money} className={amount} />
      </InvestRow>
    </div>
  );
}

function BalanceText({ minor, money, muted, className }) {
  const text = `${minor < 0 ? "−" : ""}${formatMoney(Math.abs(minor), money)}`;
  return (
    <span
      className={cn(
        "font-mono font-semibold whitespace-nowrap tabular",
        muted ? "text-text-muted" : "text-text",
        className,
      )}
    >
      {text}
    </span>
  );
}

function SelectedDay({ date, settings, lookups }) {
  const day = useDay(date);
  const items = [...(day.data?.items ?? [])].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-[15px] font-bold text-text">
        {formatLocalDate(date, { locale: settings.locale, style: "long" })}
      </h2>
      {day.isLoading ? (
        <Spinner className="self-center py-6" />
      ) : day.isError ? (
        <ErrorBlock message="Could not load this day." onRetry={day.refetch} />
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-[14px] text-text-muted">No entries on this day.</p>
      ) : (
        items.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} lookups={lookups} settings={settings} />
        ))
      )}
      <Button as={Link} to="/add" variant="hairline">
        Add to this day
      </Button>
    </Card>
  );
}

export function MonthPage() {
  const settings = useSettings();
  const [params, setParams] = useSearchParams();
  const [picked, setPicked] = useState(null);

  const today = todayLocalDate(settings.tzid);
  const current = currentMonth(settings.tzid);
  const requested = params.get("m");
  const month =
    requested && MONTH_PATTERN.test(requested) && requested <= current ? requested : current;
  const isCurrent = month === current;
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
  const selected = picked?.startsWith(month) ? picked : isCurrent ? today : monthStart;
  const money = { currencyCode: settings.currencyCode, locale: settings.locale };
  const [showAll, setShowAll] = useState(false);

  const stats = useMonthStats(month);
  const lookups = useLookups();
  const list = useTransactions({ from: monthStart, to: monthEnd, limit: 50 });

  const monthName = formatMonth(month, { locale: settings.locale });
  const groups = groupByLocalDate(list.data?.items ?? []);
  const data = stats.data;
  const isEmpty =
    data &&
    data.incomeMinor === 0 &&
    data.expenseMinor === 0 &&
    list.isSuccess &&
    groups.length === 0;

  const categories = (data?.byCategory ?? []).map((row) => {
    const category = lookups.categoriesById.get(row.categoryId);
    return {
      ...row,
      id: row.categoryId,
      name: category?.name ?? "Category",
      icon: category?.icon ?? "other",
      tone: category?.color ?? "c3",
    };
  });
  const shown = showAll ? categories : categories.slice(0, COLLAPSED_COUNT);
  const search = (categoryId) => `/search?category=${categoryId}&from=${monthStart}&to=${monthEnd}`;

  function go(n) {
    setParams({ m: shiftMonth(month, n) }, { replace: true });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Month" phoneShortcuts={["search", "settings"]} />

      <div className="flex items-center gap-2">
        <IconButton icon="back" label="Previous month" onClick={() => go(-1)} />
        <p
          aria-live="polite"
          className="min-w-0 flex-1 text-center text-[17px] font-bold text-text tablet:flex-none tablet:px-4"
        >
          {monthName}
        </p>
        <IconButton icon="forward" label="Next month" disabled={isCurrent} onClick={() => go(1)} />
      </div>

      {stats.isError ? (
        <ErrorBlock message="Could not load this month." onRetry={stats.refetch} />
      ) : stats.isLoading ? (
        <Spinner className="self-center py-10" />
      ) : (
        <>
          <section aria-label="Month summary" className="desktop:hidden">
            <div className="flex flex-col gap-4 rounded-2xl surface-l2 p-5">
              <Tile label="Balance this month">
                <BalanceText
                  minor={data.balanceMinor}
                  money={money}
                  muted={isEmpty}
                  className="text-[clamp(20px,10cqi,32px)]"
                />
              </Tile>
              <div className="grid grid-cols-2 gap-3">
                <Tile label="Income" className="rounded-xl surface-l0 p-3">
                  <AmountText
                    minor={data.incomeMinor}
                    type={isEmpty ? undefined : "income"}
                    {...money}
                    className={cn(
                      "text-[clamp(11px,10cqi,18px)] whitespace-nowrap",
                      isEmpty && "text-text-muted",
                    )}
                  />
                </Tile>
                <Tile label="Expense" className="rounded-xl surface-l0 p-3">
                  <AmountText
                    minor={data.expenseMinor}
                    type={isEmpty ? undefined : "expense"}
                    {...money}
                    className={cn(
                      "text-[clamp(11px,10cqi,18px)] whitespace-nowrap",
                      isEmpty && "text-text-muted",
                    )}
                  />
                </Tile>
              </div>
              {data.investedMinor > 0 || data.withdrawnMinor > 0 ? (
                <>
                  <Divider />
                  <InvestingSummary data={data} money={money} />
                </>
              ) : null}
            </div>
          </section>

          <section
            aria-label="Month summary"
            className="hidden desktop:grid desktop:grid-cols-3 desktop:gap-4"
          >
            <Card className="min-w-0">
              <Tile label="Balance">
                <BalanceText
                  minor={data.balanceMinor}
                  money={money}
                  muted={isEmpty}
                  className="text-[24px]"
                />
              </Tile>
            </Card>
            <Card className="min-w-0">
              <Tile label="Income">
                <AmountText
                  minor={data.incomeMinor}
                  type={isEmpty ? undefined : "income"}
                  {...money}
                  className={cn("text-[24px] whitespace-nowrap", isEmpty && "text-text-muted")}
                />
              </Tile>
            </Card>
            <Card className="min-w-0">
              <Tile label="Expense">
                <AmountText
                  minor={data.expenseMinor}
                  type={isEmpty ? undefined : "expense"}
                  {...money}
                  className={cn("text-[24px] whitespace-nowrap", isEmpty && "text-text-muted")}
                />
              </Tile>
            </Card>
            {data.investedMinor > 0 || data.withdrawnMinor > 0 ? (
              <Card className="col-span-3 min-w-0">
                <InvestingSummary
                  data={data}
                  money={money}
                  className="desktop:grid desktop:grid-cols-3 desktop:gap-6"
                />
              </Card>
            ) : null}
          </section>

          {isEmpty ? (
            <EmptyState
              title={`Nothing in ${formatMonth(month, { locale: settings.locale }).split(" ")[0]} yet`}
              description="Your categories and payment modes carry over. Add the first income or expense to start the month."
              action={
                <Button as={Link} to="/add">
                  Add first entry
                </Button>
              }
            />
          ) : (
            <>
              <Card className="hidden desktop:block">
                <h2 className="mb-3 text-[15px] font-bold text-text">Spending by day</h2>
                <DailyBars
                  days={data.days}
                  selected={selected}
                  today={today}
                  onSelect={setPicked}
                  {...money}
                />
              </Card>

              <div className="grid gap-5 desktop:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="flex min-w-0 flex-col gap-5">
                  <Card className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-[15px] font-bold text-text">Spending by category</h2>
                      <Link
                        to="/lists?tab=expense"
                        state={{ backLabel: "Back to Month" }}
                        className="inline-flex min-h-11 items-center text-[14px] font-bold text-link"
                      >
                        Edit list
                      </Link>
                    </div>
                    {categories.length === 0 ? (
                      <p className="text-[14px] text-text-muted">No spending this month.</p>
                    ) : (
                      <>
                        <CategoryBar segments={categories} />
                        <ul className="flex flex-col">
                          {shown.map((row) => (
                            <li key={row.id}>
                              <Link
                                to={search(row.id)}
                                className="flex min-h-14 items-center gap-3 rounded-xl px-1 py-2 hover:bg-primary/5"
                              >
                                <IconTile icon={row.icon} tone={row.tone} />
                                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">
                                  {row.name}
                                </span>
                                <span className="shrink-0 text-[13px] text-text-muted tabular">
                                  {Math.round(row.pct * 10) / 10}%
                                </span>
                                <AmountText
                                  minor={row.amountMinor}
                                  type="expense"
                                  {...money}
                                  className="shrink-0 text-[15px] whitespace-nowrap"
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {categories.length > COLLAPSED_COUNT ? (
                          <Button
                            variant="hairline"
                            aria-expanded={showAll}
                            onClick={() => setShowAll((v) => !v)}
                          >
                            {showAll ? "Show fewer" : `Show all ${categories.length} categories`}
                          </Button>
                        ) : null}
                      </>
                    )}
                  </Card>

                  <Card className="flex flex-col gap-3">
                    <h2 className="text-[15px] font-bold text-text">Spent by account</h2>
                    {data.byAccount.length === 0 ? (
                      <p className="text-[14px] text-text-muted">No spending this month.</p>
                    ) : (
                      <ul className="grid grid-cols-2 gap-3">
                        {data.byAccount.map((row) => {
                          const account = lookups.accountsById.get(row.accountId);
                          return (
                            <li
                              key={row.accountId}
                              className="flex min-w-0 items-center gap-3 rounded-xl surface-l0 p-3"
                            >
                              <IconTile
                                icon={account?.icon ?? "wallet"}
                                tone={account?.color ?? "c3"}
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-[13px] text-text-muted">
                                  {account?.name ?? "Account"}
                                </span>
                                <AmountText
                                  minor={row.amountMinor}
                                  {...money}
                                  className="text-[14px] whitespace-nowrap"
                                />
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Card>

                  <section aria-label="Daily transactions" className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-[15px] font-bold text-text">Daily transactions</h2>
                      <Link
                        to="/daily"
                        className="inline-flex min-h-11 items-center text-[14px] font-bold text-link"
                      >
                        Open day view
                      </Link>
                    </div>
                    {list.isError ? (
                      <ErrorBlock message="Could not load entries." onRetry={list.refetch} />
                    ) : list.isLoading ? (
                      <Spinner className="self-center py-6" />
                    ) : (
                      <>
                        {groups.map((group) => (
                          <DateGroup
                            key={group.localDate}
                            group={group}
                            today={today}
                            lookups={lookups}
                            settings={settings}
                          />
                        ))}
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
                  </section>
                </div>

                <div className="hidden min-w-0 desktop:block">
                  <SelectedDay date={selected} settings={settings} lookups={lookups} />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
