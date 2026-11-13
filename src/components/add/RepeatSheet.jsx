import { useState } from "react";
import { formatMoney } from "../../lib/money.js";
import { NO_REPEAT } from "../../schemas/transaction.js";
import { Button, Chip, Dialog, Input, Segmented } from "../ui/index.js";

const FREQS = [
  { value: "none", label: "Never" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];
const MONTHS = [3, 6, 9, 12];

// Repeat rule or credit-card instalments for a new entry. Edits a draft and applies it on Done.
export function RepeatSheet({
  open,
  onClose,
  repeat,
  onApply,
  instalmentsEnabled,
  amountMinor,
  money,
}) {
  const [draft, setDraft] = useState(repeat);
  const [tab, setTab] = useState(repeat.mode === "instalments" ? "instalments" : "repeat");

  const monthly =
    amountMinor > 0 ? formatMoney(Math.floor(amountMinor / draft.months), money) : null;
  const freqValue = draft.mode === "repeat" ? draft.freq : "none";

  function done() {
    if (tab === "instalments") {
      onApply(draft.mode === "instalments" ? draft : NO_REPEAT);
    } else {
      onApply(draft.mode === "instalments" ? NO_REPEAT : draft);
    }
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Repeat"
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              onApply(NO_REPEAT);
              onClose();
            }}
          >
            Clear
          </Button>
          <Button fullWidth onClick={done}>
            Done
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          aria-label="Repeat type"
          variant="tint"
          value={tab}
          onChange={setTab}
          options={[
            { value: "repeat", label: "Repeat" },
            { value: "instalments", label: "Instalments" },
          ]}
        />
        {tab === "repeat" ? (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Frequency">
              {FREQS.map((f) => (
                <Chip
                  key={f.value}
                  selected={freqValue === f.value}
                  onClick={() =>
                    setDraft(
                      f.value === "none" ? NO_REPEAT : { ...draft, mode: "repeat", freq: f.value },
                    )
                  }
                  className="min-h-11"
                >
                  {f.label}
                </Chip>
              ))}
            </div>
            {draft.mode === "repeat" ? (
              <Input
                type="date"
                label="Ends on (optional)"
                value={draft.endsOn}
                onChange={(e) => setDraft({ ...draft, endsOn: e.target.value })}
              />
            ) : null}
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Number of instalments">
              {MONTHS.map((m) => (
                <Chip
                  key={m}
                  disabled={!instalmentsEnabled}
                  selected={draft.mode === "instalments" && draft.months === m}
                  onClick={() => setDraft({ ...draft, mode: "instalments", months: m })}
                  className="min-h-11 disabled:opacity-50"
                >
                  {m}
                </Chip>
              ))}
            </div>
            {instalmentsEnabled ? (
              monthly && draft.mode === "instalments" ? (
                <p className="text-[14px] text-text-muted">
                  Per month: <span className="font-mono font-semibold text-text">{monthly}</span>
                </p>
              ) : null
            ) : (
              <p className="text-[14px] text-text-muted">
                Instalments work only for credit-card expenses.
              </p>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
