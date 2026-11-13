import { useSearchParams } from "react-router";
import { Donut } from "../components/charts/Donut.jsx";
import { RankedRow } from "../components/charts/RankedRow.jsx";
import { TrendBars } from "../components/charts/TrendBars.jsx";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  IconButton,
  Segmented,
  Spinner,
} from "../components/ui/index.js";
import { useLookups, usePeriodStats, useTrend } from "../hooks/useLedger.js";
import { useSettings } from "../hooks/useSettings.js";
import { cn } from "../lib/cn.js";
import {
  currentMonth,
  formatLocalDate,
  formatMonthShort,
  shiftDay,
  shiftMonth,
  todayLocalDate,
} from "../lib/ledger-format.js";
import { formatMoney } from "../lib/money.js";

const PERIODS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function weekStartOf(localDate, weekStart) {
  const dow = new Date(`${localDate}T12:00:00Z`).getUTCDay();
  const offset = weekStart === "sun" ? dow : (dow + 6) % 7;
  return shiftDay(localDate, -offset);
}

// First day of the period `n` steps from the one containing `ref`.
function periodStart(period, ref, n, weekStart) {
  if (period === "week") return shiftDay(weekStartOf(ref, weekStart), 7 * n);
  if (period === "month") return `${shiftMonth(ref.slice(0, 7), n)}-01`;
  return `${Number(ref.slice(0, 4)) + n}-01-01`;
}

function shiftRef(period, ref, n) {
  if (period === "week") return shiftDay(ref, 7 * n);
  if (period === "month") return `${shiftMonth(ref.slice(0, 7), n)}-01`;
  return `${Number(ref.slice(0, 4)) + n}-01-01`;
}

function periodLabel(period, ref, data, locale, weekStart) {
  if (period === "year") return ref.slice(0, 4);
  if (period === "month")
    return `${formatMonthShort(ref.slice(0, 7), { locale })} ${ref.slice(0, 4)}`;
  const from = data?.from ?? weekStartOf(ref, weekStart);
  const to = data?.to ?? shiftDay(from, 6);
  const day = (d) => String(Number(d.slice(8)));
  const month = (d) => formatMonthShort(d.slice(0, 7), { locale });
  const left = from.slice(0, 7) === to.slice(0, 7) ? day(from) : `${day(from)} ${month(from)}`;
  return `${left} – ${day(to)} ${month(to)}`;
}

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

function Delta({ row, type, money }) {
  const delta = row.amountMinor - row.previousAmountMinor;
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const good = type === "expense" ? delta < 0 : delta > 0;
  return (
    <span
      className={cn(
        "font-mono text-[14px] font-semibold whitespace-nowrap tabular",
        delta === 0 ? "text-text-muted" : good ? "text-success" : "text-expense",
      )}
    >
      {sign}
      {formatMoney(Math.abs(delta), money)}
    </span>
  );
}

export function StatsPage() {
  const settings = useSettings();
  const { locale, tzid, weekStart } = settings;
  const money = { currencyCode: settings.currencyCode, locale };
  const [params, setParams] = useSearchParams();

  const period = PERIODS.some((p) => p.value === params.get("period"))
    ? params.get("period")
    : "month";
  const type = params.get("type") === "income" ? "income" : "expense";
  const today = todayLocalDate(tzid);
  const requested = params.get("ref");
  const ref = requested && DAY_PATTERN.test(requested) && requested <= today ? requested : today;
  const canGoNext = periodStart(period, ref, 1, weekStart) <= today;

  const income = usePeriodStats({ period, ref, type: "income" });
  const expense = usePeriodStats({ period, ref, type: "expense" });
  const active = type === "income" ? income : expense;
  const data = active.data;
  const lookups = useLookups();
  const trend = useTrend({ months: 12, type });

  function update(changes) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => next.set(key, value));
        return next;
      },
      { replace: true },
    );
  }

  const types = [
    {
      value: "income",
      label: income.data ? `Income ${formatMoney(income.data.totalMinor, money)}` : "Income",
    },
    {
      value: "expense",
      label: expense.data ? `Expenses ${formatMoney(expense.data.totalMinor, money)}` : "Expenses",
    },
  ];

  const rows = (data?.byCategory ?? [])
    .filter((row) => row.amountMinor > 0 || row.previousAmountMinor > 0)
    .map((row) => {
      const category = lookups.categoriesById.get(row.categoryId);
      return {
        ...row,
        id: row.categoryId,
        label: category?.name ?? "Category",
        tone: category?.color ?? "c3",
      };
    })
    .sort((a, b) => b.amountMinor - a.amountMinor);
  const ranked = rows.filter((row) => row.amountMinor > 0);
  const largest = ranked[0]?.amountMinor ?? 0;
  const noun = type === "income" ? "income" : "expenses";
  const typeSign = type === "income" ? "income" : "expense";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Stats" />

      <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-2">
          <IconButton
            icon="back"
            label="Previous period"
            onClick={() => update({ ref: shiftRef(period, ref, -1) })}
          />
          <p
            aria-live="polite"
            className="min-w-0 flex-1 text-center text-[17px] font-bold whitespace-nowrap text-text tablet:flex-none tablet:px-4"
          >
            {periodLabel(period, ref, data, locale, weekStart)}
          </p>
          <IconButton
            icon="forward"
            label="Next period"
            disabled={!canGoNext}
            onClick={() => update({ ref: shiftRef(period, ref, 1) })}
          />
        </div>
        <Segmented
          aria-label="Period"
          options={PERIODS}
          value={period}
          onChange={(value) => update({ period: value })}
          className="tablet:w-72"
        />
      </div>

      <Segmented
        aria-label="Type"
        variant="tint"
        options={types}
        value={type}
        onChange={(value) => update({ type: value })}
      />

      <Card className="flex flex-col gap-5">
        {active.isError ? (
          <ErrorBlock message="Could not load these stats." onRetry={active.refetch} />
        ) : active.isLoading ? (
          <Spinner className="self-center py-10" />
        ) : ranked.length === 0 ? (
          <EmptyState title={`No ${noun} in this period`} className="py-10" />
        ) : (
          <div className="flex flex-col items-center gap-6 desktop:flex-row desktop:items-center desktop:gap-10">
            <Donut
              title={type === "income" ? "Income by category" : "Spending by category"}
              segments={ranked.map((r) => ({
                id: r.id,
                label: r.label,
                tone: r.tone,
                amountMinor: r.amountMinor,
                pct: r.pct,
              }))}
              centreLabel={type === "income" ? "Earned" : "Spent"}
              centreValue={formatMoney(data.totalMinor, money)}
            />
            <ul className="flex w-full min-w-0 flex-1 flex-col">
              {ranked.map((r) => (
                <li key={r.id}>
                  <RankedRow
                    to={`/search?category=${r.id}&from=${data.from}&to=${data.to}`}
                    name={r.label}
                    pct={r.pct}
                    amountMinor={r.amountMinor}
                    tone={r.tone}
                    barPct={largest > 0 ? (r.amountMinor / largest) * 100 : 0}
                    type={typeSign}
                    {...money}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-center text-[13px] text-text-muted">
          Excludes transfers between your accounts.
        </p>
      </Card>

      <Card className="hidden desktop:block">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-bold text-text">Last months</h2>
          {trend.data ? (
            <p className="text-[13px] text-text-muted">
              Average {formatMoney(trend.data.averageMinor, money)} a month
            </p>
          ) : null}
        </div>
        {trend.isError ? (
          <ErrorBlock message="Could not load the trend." onRetry={trend.refetch} />
        ) : trend.isLoading ? (
          <Spinner className="py-10" />
        ) : (
          <TrendBars points={trend.data.points} currentMonth={currentMonth(tzid)} {...money} />
        )}
      </Card>

      {rows.length > 0 ? (
        <Card className="hidden large:block">
          <h2 className="mb-3 text-[15px] font-bold text-text">vs previous period</h2>
          <ul className="flex flex-col">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex min-h-11 items-center justify-between gap-3 border-b border-line py-2 last:border-b-0"
              >
                <span className="min-w-0 truncate text-[15px] text-text">{row.label}</span>
                <Delta row={row} type={type} money={money} />
              </li>
            ))}
          </ul>
          {data?.previousFrom ? (
            <p className="mt-3 text-[13px] text-text-muted">
              Compared with {formatLocalDate(data.previousFrom, { locale, style: "full" })} to{" "}
              {formatLocalDate(data.previousTo, { locale, style: "full" })}.
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
