import { Link, useSearchParams } from "react-router";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { TransactionRow } from "../components/transaction/TransactionRow.jsx";
import {
  Alert,
  AmountText,
  Button,
  EmptyState,
  IconButton,
  Spinner,
} from "../components/ui/index.js";
import { useDay, useLookups, useMonthStats } from "../hooks/useLedger.js";
import { useSettings } from "../hooks/useSettings.js";
import { cn } from "../lib/cn.js";
import { formatLocalDate, shiftDay, todayLocalDate } from "../lib/ledger-format.js";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dayOfWeek(localDate) {
  return new Date(`${localDate}T12:00:00Z`).getUTCDay();
}

// Seven local dates containing `localDate`, starting on the user's week start.
function weekOf(localDate, weekStart) {
  const dow = dayOfWeek(localDate);
  const offset = weekStart === "sun" ? dow : (dow + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => shiftDay(localDate, i - offset));
}

function Stat({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-text-muted-2">{label}</p>
      {children}
    </div>
  );
}

export function DailyPage() {
  const settings = useSettings();
  const { locale, tzid, weekStart } = settings;
  const [params, setParams] = useSearchParams();

  const today = todayLocalDate(tzid);
  const requested = params.get("d");
  const day = requested && DAY_PATTERN.test(requested) && requested <= today ? requested : today;
  const isToday = day === today;
  const money = { currencyCode: settings.currencyCode, locale };

  const week = weekOf(day, weekStart);
  const firstMonth = week[0].slice(0, 7);
  const lastMonth = week[6].slice(0, 7);
  const monthA = useMonthStats(firstMonth);
  const monthB = useMonthStats(lastMonth);
  const withEntries = new Set(
    [...(monthA.data?.days ?? []), ...(monthB.data?.days ?? [])]
      .filter((d) => d.expenseMinor > 0 || d.incomeMinor > 0)
      .map((d) => d.localDate),
  );

  const dayQuery = useDay(day);
  const lookups = useLookups();
  const items = [...(dayQuery.data?.items ?? [])].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );

  function select(date) {
    setParams({ d: date }, { replace: true });
  }

  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={formatLocalDate(day, { locale, style: "long" })}
        subtitle={isToday ? "Today" : day.slice(0, 4)}
        leading={
          <IconButton icon="back" label="Previous day" onClick={() => select(shiftDay(day, -1))} />
        }
        actions={
          <IconButton
            icon="forward"
            label="Next day"
            disabled={isToday}
            onClick={() => select(shiftDay(day, 1))}
          />
        }
      />

      {/* On narrow phones the strip bleeds slightly into the page padding so each day stays a 44px+ target. */}
      <div
        className="-mx-2 flex gap-0.5 rounded-2xl surface-l1 p-1 tablet:mx-0 tablet:gap-1 tablet:p-2"
        role="group"
        aria-label="Week"
      >
        {week.map((date) => {
          const selected = date === day;
          const future = date > today;
          const has = withEntries.has(date);
          return (
            <button
              key={date}
              type="button"
              disabled={future}
              aria-pressed={selected}
              aria-label={`${formatLocalDate(date, { locale, style: "long" })}${has ? ", has entries" : ""}`}
              onClick={() => select(date)}
              className={cn(
                "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-xl text-[13px]",
                selected ? "bg-primary font-bold text-on-primary" : "text-text",
                future && "cursor-not-allowed opacity-45",
              )}
            >
              <span className="text-[12px]">{weekday.format(new Date(`${date}T12:00:00Z`))}</span>
              <span className="text-[16px] font-semibold tabular">{Number(date.slice(8))}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 size-1 rounded-full",
                  has ? (selected ? "bg-on-primary" : "bg-primary") : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      {dayQuery.isError ? (
        <Alert>
          <p>Could not load this day.</p>
          <Button variant="ghost" className="mt-1 h-11 px-0" onClick={() => dayQuery.refetch()}>
            Retry
          </Button>
        </Alert>
      ) : dayQuery.isLoading ? (
        <Spinner className="self-center py-10" />
      ) : (
        <>
          <section
            aria-label="Day summary"
            className="grid grid-cols-3 gap-3 rounded-2xl surface-l2 p-5"
          >
            <Stat label="In">
              <AmountText
                minor={dayQuery.data.inMinor}
                type={dayQuery.data.inMinor > 0 ? "income" : undefined}
                {...money}
                className={cn(
                  "text-[16px] whitespace-nowrap",
                  dayQuery.data.inMinor === 0 && "text-text-muted",
                )}
              />
            </Stat>
            <Stat label="Out">
              <AmountText
                minor={dayQuery.data.outMinor}
                type={dayQuery.data.outMinor > 0 ? "expense" : undefined}
                {...money}
                className={cn(
                  "text-[16px] whitespace-nowrap",
                  dayQuery.data.outMinor === 0 && "text-text-muted",
                )}
              />
            </Stat>
            <Stat label="Entries">
              <p className="font-mono text-[16px] font-semibold text-text tabular">
                {dayQuery.data.count}
              </p>
            </Stat>
          </section>

          {items.length === 0 ? (
            <EmptyState
              title="No entries on this day"
              description="Entries you add for this day show here."
              action={
                <Button as={Link} to="/add">
                  Add entry
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} lookups={lookups} settings={settings} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
