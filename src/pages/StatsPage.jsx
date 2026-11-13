import { useSearchParams } from "react-router";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Card, EmptyState, IconButton, Segmented } from "../components/ui/index.js";
import { useAuth } from "../hooks/useAuth.js";
import {
  addDays,
  addMonths,
  formatDayShort,
  parseDayParam,
  startOfMonth,
  todayInZone,
  toDayParam,
  weekDays,
} from "../lib/dates.js";

const PERIODS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expenses" },
];

function periodStart(period, date, weekStart) {
  if (period === "week") return weekDays(date, weekStart)[0];
  if (period === "month") return startOfMonth(date);
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 12));
}

function shift(period, date, n) {
  if (period === "week") return addDays(date, 7 * n);
  if (period === "month") return addMonths(date, n);
  return addMonths(date, 12 * n);
}

function periodLabel(period, date, weekStart, locale) {
  if (period === "year") return String(date.getUTCFullYear());
  if (period === "month") {
    const [month, year] = [
      new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(date),
      date.getUTCFullYear(),
    ];
    return `${month} ${year}`;
  }
  const days = weekDays(date, weekStart);
  const short = (d) => formatDayShort(d, { locale }).split(", ")[1];
  return `${short(days[0])} – ${short(days[6])}`;
}

export function StatsPage() {
  const { user } = useAuth();
  const { locale, tzid, weekStart } = user.settings;
  const [params, setParams] = useSearchParams();

  const period = PERIODS.some((p) => p.value === params.get("period"))
    ? params.get("period")
    : "month";
  const type = params.get("type") === "income" ? "income" : "expense";
  const today = todayInZone(tzid);
  const parsed = parseDayParam(params.get("ref"));
  const ref = parsed && parsed <= today ? parsed : today;

  const nextStart = periodStart(period, shift(period, ref, 1), weekStart);
  const canGoNext = nextStart <= today;

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

  function go(n) {
    update({ ref: toDayParam(shift(period, ref, n)) });
  }

  const noun = type === "income" ? "income" : "expenses";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Stats" />

      <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-2">
          <IconButton icon="back" label="Previous period" onClick={() => go(-1)} />
          <p
            aria-live="polite"
            className="min-w-0 flex-1 text-center text-[17px] font-bold whitespace-nowrap text-text tablet:flex-none tablet:px-4"
          >
            {periodLabel(period, ref, weekStart, locale)}
          </p>
          <IconButton
            icon="forward"
            label="Next period"
            disabled={!canGoNext}
            onClick={() => go(1)}
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
        options={TYPES}
        value={type}
        onChange={(value) => update({ type: value })}
      />

      <Card>
        <EmptyState title={`No ${noun} in this period`} className="py-10" />
        <p className="text-center text-[13px] text-text-muted">
          Excludes transfers between your accounts.
        </p>
      </Card>
    </div>
  );
}
