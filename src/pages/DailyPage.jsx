import { useSearchParams } from "react-router";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { AmountText, EmptyState, IconButton } from "../components/ui/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { cn } from "../lib/cn.js";
import {
  addDays,
  formatDayLong,
  formatDayNumber,
  formatWeekdayShort,
  isSameDay,
  parseDayParam,
  todayInZone,
  toDayParam,
  weekDays,
} from "../lib/dates.js";

function Stat({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-text-muted-2">{label}</p>
      {children}
    </div>
  );
}

export function DailyPage() {
  const { user } = useAuth();
  const { currencyCode, locale, tzid, weekStart } = user.settings;
  const [params, setParams] = useSearchParams();

  const today = todayInZone(tzid);
  const requested = parseDayParam(params.get("d"));
  const day = requested && requested <= today ? requested : today;
  const isToday = isSameDay(day, today);
  const money = { currencyCode, locale };

  function select(date) {
    setParams({ d: toDayParam(date) }, { replace: true });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={formatDayLong(day, { locale })}
        subtitle={isToday ? "Today" : String(day.getUTCFullYear())}
        leading={
          <IconButton icon="back" label="Previous day" onClick={() => select(addDays(day, -1))} />
        }
        actions={
          <IconButton
            icon="forward"
            label="Next day"
            disabled={isToday}
            onClick={() => select(addDays(day, 1))}
          />
        }
      />

      {/* On narrow phones the strip bleeds slightly into the page padding so each day stays a 44px+ target. */}
      <div
        className="-mx-2 flex gap-0.5 rounded-2xl surface-l1 p-1 tablet:mx-0 tablet:gap-1 tablet:p-2"
        role="group"
        aria-label="Week"
      >
        {weekDays(day, weekStart).map((date) => {
          const selected = isSameDay(date, day);
          const future = date > today;
          return (
            <button
              key={toDayParam(date)}
              type="button"
              disabled={future}
              aria-pressed={selected}
              aria-label={formatDayLong(date, { locale })}
              onClick={() => select(date)}
              className={cn(
                "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-xl text-[13px]",
                selected ? "bg-primary font-bold text-on-primary" : "text-text",
                future && "cursor-not-allowed opacity-45",
              )}
            >
              <span className="text-[12px]">{formatWeekdayShort(date, { locale })}</span>
              <span className="text-[16px] font-semibold tabular">
                {formatDayNumber(date, { locale })}
              </span>
            </button>
          );
        })}
      </div>

      <section
        aria-label="Day summary"
        className="grid grid-cols-3 gap-3 rounded-2xl surface-l2 p-5"
      >
        <Stat label="In">
          <AmountText
            minor={0}
            {...money}
            className="text-[16px] whitespace-nowrap text-text-muted"
          />
        </Stat>
        <Stat label="Out">
          <AmountText
            minor={0}
            {...money}
            className="text-[16px] whitespace-nowrap text-text-muted"
          />
        </Stat>
        <Stat label="Entries">
          <p className="font-mono text-[16px] font-semibold text-text-muted tabular">0</p>
        </Stat>
      </section>

      <EmptyState
        title="No entries on this day"
        description="Entries you add for this day show here."
      />
    </div>
  );
}
