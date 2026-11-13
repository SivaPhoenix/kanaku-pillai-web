import { useSearchParams } from "react-router";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { AmountText, Button, Card, EmptyState, IconButton } from "../components/ui/index.js";
import { useAuth } from "../hooks/useAuth.js";
import {
  addMonths,
  formatMonthYear,
  parseMonthParam,
  startOfMonth,
  todayInZone,
  toMonthParam,
} from "../lib/dates.js";

function Tile({ label, amountProps, className }) {
  return (
    <div className={className}>
      <p className="text-[13px] font-semibold text-text-muted-2">{label}</p>
      <AmountText
        minor={0}
        {...amountProps}
        className="text-[18px] whitespace-nowrap text-text-muted"
      />
    </div>
  );
}

export function MonthPage() {
  const { user } = useAuth();
  const { currencyCode, locale, tzid } = user.settings;
  const [params, setParams] = useSearchParams();

  const current = startOfMonth(todayInZone(tzid));
  const requested = parseMonthParam(params.get("m"));
  const month = requested && requested <= current ? requested : current;
  const isCurrent = toMonthParam(month) === toMonthParam(current);
  const label = formatMonthYear(month, { locale });
  const money = { currencyCode, locale };

  function go(n) {
    const next = addMonths(month, n);
    setParams({ m: toMonthParam(next) }, { replace: true });
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
          {label}
        </p>
        <IconButton icon="forward" label="Next month" disabled={isCurrent} onClick={() => go(1)} />
      </div>

      <section aria-label="Month summary" className="desktop:hidden">
        <div className="flex flex-col gap-4 rounded-2xl surface-l2 p-5">
          <div>
            <p className="text-[13px] font-semibold text-text-muted-2">Balance this month</p>
            <AmountText
              minor={0}
              {...money}
              className="text-[32px] whitespace-nowrap text-text-muted"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Tile
              label="Income"
              amountProps={money}
              className="min-w-0 rounded-xl surface-l0 p-3"
            />
            <Tile
              label="Expense"
              amountProps={money}
              className="min-w-0 rounded-xl surface-l0 p-3"
            />
          </div>
        </div>
      </section>

      <section
        aria-label="Month summary"
        className="hidden desktop:grid desktop:grid-cols-3 desktop:gap-4"
      >
        {["Balance", "Income", "Expense"].map((name) => (
          <Card key={name} className="min-w-0">
            <Tile label={name} amountProps={money} />
          </Card>
        ))}
      </section>

      <EmptyState
        title={`Nothing in ${formatMonthYear(month, { locale }).split(" ")[0]} yet`}
        description="Your categories and payment modes carry over. Add the first income or expense to start the month."
        action={
          <Button disabled title="Coming soon">
            Add first entry
          </Button>
        }
      />
    </div>
  );
}
