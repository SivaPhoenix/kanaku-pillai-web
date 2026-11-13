import { Chip } from "../ui/index.js";

export function AccountChips({ label, accounts, value, onChange, error, tone = "primary" }) {
  return (
    <section aria-label={label} className="flex flex-col gap-2">
      <h2 className="text-[13px] font-semibold text-text-muted-2">{label}</h2>
      {accounts.length === 0 ? (
        <p className="text-[14px] text-text-muted">No accounts available.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {accounts.map((account) => (
            <Chip
              key={account.id}
              selected={account.id === value}
              tone={tone}
              onClick={() => onChange(account.id)}
              className="min-h-11"
            >
              {account.name}
              {account.last4 ? (
                <span className="font-mono text-[12px] text-text-muted">{`••${account.last4}`}</span>
              ) : null}
            </Chip>
          ))}
        </div>
      )}
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
    </section>
  );
}
