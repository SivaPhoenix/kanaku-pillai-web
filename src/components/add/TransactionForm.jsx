import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router";
import {
  ENTRY_SCOPES,
  FAVOURITE_SCOPES,
  RECURRENCE_SCOPES,
  useLedgerMutation,
} from "../../hooks/useLedger.js";
import { useSettings } from "../../hooks/useSettings.js";
import { useToast } from "../../hooks/useToast.js";
import { ApiError, fieldErrors } from "../../lib/api.js";
import { favouritesApi, transactionsApi } from "../../lib/ledger-api.js";
import { toLocalParts } from "../../lib/ledger-format.js";
import { parseAmountToMinor } from "../../lib/money.js";
import {
  NO_REPEAT,
  buildCreateBody,
  buildUpdateBody,
  createTransactionSchema,
  fieldsForType,
  instalmentsAllowed,
  minorToInput,
  repeatLabel,
} from "../../schemas/transaction.js";
import { Alert, Button, Chip, Icon, IconButton, Input, Segmented } from "../ui/index.js";
import { AccountChips } from "./AccountChips.jsx";
import { AmountField } from "./AmountField.jsx";
import { CategoryGrid } from "./CategoryGrid.jsx";
import { FavouritesSheet } from "./FavouritesSheet.jsx";
import { RepeatSheet } from "./RepeatSheet.jsx";

const TYPE_OPTIONS = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];
const TITLES = { income: "New income", expense: "New expense", transfer: "New transfer" };
const SAVE_LABELS = {
  income: "Save income",
  expense: "Save expense",
  transfer: "Save transfer",
};
// Body field names from the API mapped to form field names.
const FIELD_MAP = { amountMinor: "amount", occurredAt: "date", tzid: "date" };
const FORM_FIELDS = ["amount", "categoryId", "accountId", "toAccountId", "date", "time", "note"];

function txDefaults(tx) {
  const { localDate, localTime } = toLocalParts(tx.occurredAt, tx.tzid);
  return {
    type: tx.type,
    amount: "",
    categoryId: tx.categoryId ?? "",
    accountId: tx.accountId,
    toAccountId: tx.toAccountId ?? "",
    date: localDate,
    time: localTime,
    note: tx.note ?? "",
  };
}

// The Add and Edit form (spec §7.7). `accounts` and `categories` include archived rows so an old entry still shows its own.
export function TransactionForm({ transaction, initial, accounts, categories }) {
  const isEdit = Boolean(transaction);
  const settings = useSettings();
  const { currencyCode, locale, tzid } = settings;
  const money = { currencyCode, locale };
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const schema = useMemo(() => createTransactionSchema(currencyCode), [currencyCode]);
  const [defaults] = useState(() => {
    if (transaction) {
      return {
        ...txDefaults(transaction),
        amount: minorToInput(transaction.amountMinor, currencyCode),
      };
    }
    const now = toLocalParts(new Date().toISOString(), tzid);
    const defaultAccount =
      accounts.find((a) => a.isDefault && !a.archived) ?? accounts.find((a) => !a.archived);
    return {
      type: "expense",
      amount: "",
      categoryId: "",
      accountId: defaultAccount?.id ?? "",
      toAccountId: "",
      date: now.localDate,
      time: now.localTime,
      note: "",
      ...initial,
    };
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitted },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaults });
  const values = watch();
  const { type } = values;

  const [repeat, setRepeat] = useState(NO_REPEAT);
  const [saveFavourite, setSaveFavourite] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [favouritesOpen, setFavouritesOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [initialKey] = useState(() => crypto.randomUUID());
  const keyRef = useRef({ key: initialKey, signature: null });

  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const pickable = (list, selected) =>
    list.filter((item) => !item.archived || item.id === selected);
  const kindCategories = pickable(
    categories.filter((c) => c.kind === type),
    values.categoryId,
  );
  const moneyAccounts = pickable(accounts, values.accountId);
  const transferAccounts = accounts.filter((a) => !a.archived && a.type !== "debit_card");
  const toAccounts = transferAccounts.filter((a) => a.id !== values.accountId);
  const amountMinor = parseAmountToMinor(values.amount, currencyCode) ?? 0;
  const canInstalment = instalmentsAllowed(type, accountsById.get(values.accountId));

  const scopes = [
    ...ENTRY_SCOPES,
    ...(repeat.mode === "repeat" ? RECURRENCE_SCOPES : []),
    ...(saveFavourite ? FAVOURITE_SCOPES : []),
  ];
  const createMutation = useLedgerMutation(
    async ({ body, favourite, key }) => {
      const tx = await transactionsApi.create(body, { idempotencyKey: key });
      let favouriteError = null;
      if (favourite) {
        try {
          await favouritesApi.create(favourite);
        } catch (error) {
          favouriteError = error;
        }
      }
      return { tx, favouriteError };
    },
    { scopes },
  );
  const updateMutation = useLedgerMutation(({ id, body }) => transactionsApi.update(id, body));
  const saving = createMutation.isPending || updateMutation.isPending;

  function set(name, value) {
    setValue(name, value, { shouldDirty: true, shouldValidate: isSubmitted });
  }

  function changeType(next) {
    if (next === type) return;
    const cleared = fieldsForType(values, next);
    const category = categoriesById.get(values.categoryId);
    if (category && category.kind !== next) cleared.categoryId = "";
    if (next === "transfer" && accountsById.get(values.accountId)?.type === "debit_card") {
      cleared.accountId = "";
    }
    if (cleared.toAccountId === cleared.accountId) cleared.toAccountId = "";
    for (const name of ["type", "categoryId", "accountId", "toAccountId"]) set(name, cleared[name]);
    if (next !== "expense" && repeat.mode === "instalments") setRepeat(NO_REPEAT);
  }

  function swapAccounts() {
    set("accountId", values.toAccountId);
    set("toAccountId", values.accountId);
  }

  function pickAccount(id) {
    set("accountId", id);
    if (repeat.mode === "instalments" && !instalmentsAllowed(type, accountsById.get(id))) {
      setRepeat(NO_REPEAT);
    }
  }

  function applyFavourite(fav) {
    const usable = (id, map) => (id && map.has(id) && !map.get(id).archived ? id : "");
    set("type", fav.type);
    set("amount", minorToInput(fav.amountMinor, currencyCode));
    set("note", fav.note ?? "");
    set("categoryId", fav.type === "transfer" ? "" : usable(fav.categoryId, categoriesById));
    set("accountId", usable(fav.accountId, accountsById) || values.accountId);
    set("toAccountId", fav.type === "transfer" ? usable(fav.toAccountId, accountsById) : "");
    setRepeat(NO_REPEAT);
    setFavouritesOpen(false);
  }

  function close() {
    if (location.key !== "default") navigate(-1);
    else navigate("/month");
  }

  function handleError(error) {
    if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
      const mapped = Object.entries(fieldErrors(error))
        .map(([name, message]) => [FIELD_MAP[name] ?? name, message])
        .filter(([name]) => FORM_FIELDS.includes(name));
      if (mapped.length > 0) {
        mapped.forEach(([name, message]) => setError(name, { message }));
        return;
      }
    }
    setFormError(error?.message ?? "Something went wrong. Try again.");
  }

  function favouriteBody(body) {
    const category = categoriesById.get(values.categoryId);
    const title =
      body.note || category?.name || (body.type === "transfer" ? "Transfer" : "Favourite");
    return {
      title: title.slice(0, 40),
      icon: category?.icon ?? (body.type === "transfer" ? "transfer" : "wallet"),
      type: body.type,
      amountMinor: body.amountMinor,
      categoryId: body.categoryId ?? null,
      accountId: body.accountId,
      toAccountId: body.toAccountId ?? null,
      note: body.note,
    };
  }

  async function onValid(formValues) {
    setFormError(null);
    try {
      if (isEdit) {
        const body = buildUpdateBody(formValues, transaction, { currencyCode });
        if (Object.keys(body).length > 0) {
          await updateMutation.mutateAsync({ id: transaction.id, body });
        }
        toast.show({ message: "Saved" });
        navigate(`/tx/${transaction.id}`, { replace: true });
        return;
      }
      const body = buildCreateBody(formValues, { currencyCode, tzid, repeat });
      // A changed body needs a fresh key, otherwise the server rejects the reuse.
      const signature = JSON.stringify(body);
      if (keyRef.current.signature !== null && keyRef.current.signature !== signature) {
        keyRef.current = { key: crypto.randomUUID(), signature };
      }
      keyRef.current.signature = signature;
      const { tx, favouriteError } = await createMutation.mutateAsync({
        body,
        favourite: saveFavourite ? favouriteBody(body) : null,
        key: keyRef.current.key,
      });
      toast.show({
        message: favouriteError ? `Saved. Favourite not added: ${favouriteError.message}` : "Saved",
      });
      navigate(`/daily?d=${tx.localDate}`, { replace: true });
    } catch (error) {
      handleError(error);
    }
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && !repeatOpen && !favouritesOpen) close();
  }

  const title = isEdit ? "Edit entry" : TITLES[type];

  return (
    <div onKeyDown={onKeyDown} className="mx-auto w-full max-w-[880px] desktop:max-w-[1080px]">
      <form
        noValidate
        onSubmit={handleSubmit(onValid)}
        className="flex flex-col gap-5 tablet:rounded-2xl tablet:surface-l2 tablet:p-6"
      >
        <header className="flex items-center gap-3">
          <IconButton icon="close" label="Close" onClick={close} />
          <h1 className="min-w-0 flex-1 text-[22px] font-bold text-text">{title}</h1>
          {isEdit ? null : (
            <Button variant="ghost" className="h-11" onClick={() => setFavouritesOpen(true)}>
              Favourites
            </Button>
          )}
        </header>

        {formError ? <Alert>{formError}</Alert> : null}

        {/* grid-cols-1 (minmax(0,1fr)): an implicit auto column would grow to the native date/time inputs' minimum
            width and push the whole form wider than a phone screen. */}
        <div className="grid grid-cols-1 gap-5 tablet:grid-cols-2 tablet:gap-8">
          <div className="flex flex-col gap-5">
            <Segmented
              aria-label="Entry type"
              options={TYPE_OPTIONS}
              value={type}
              onChange={changeType}
            />
            <AmountField
              type={type}
              currencyCode={currencyCode}
              locale={locale}
              error={errors.amount?.message}
              {...register("amount")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" label="Date" error={errors.date?.message} {...register("date")} />
              <Input type="time" label="Time" error={errors.time?.message} {...register("time")} />
            </div>
            {isEdit ? null : (
              <div>
                <Chip
                  selected={repeat.mode !== "none"}
                  onClick={() => setRepeatOpen(true)}
                  className="min-h-11"
                >
                  <Icon name="repeat" size={16} />
                  {repeatLabel(repeat)}
                </Chip>
              </div>
            )}
            <Input
              label="Note"
              maxLength={140}
              placeholder="Optional"
              error={errors.note?.message}
              {...register("note")}
            />
          </div>

          <div className="flex flex-col gap-5">
            {type === "transfer" ? (
              <div className="flex flex-col gap-4 rounded-2xl surface-l1 p-4">
                <AccountChips
                  label="FROM"
                  tone="transfer"
                  accounts={transferAccounts}
                  value={values.accountId}
                  error={errors.accountId?.message}
                  onChange={(id) => {
                    set("accountId", id);
                    if (id === values.toAccountId) set("toAccountId", "");
                  }}
                />
                <div className="flex justify-center">
                  <IconButton
                    icon="swap"
                    label="Swap accounts"
                    className="rounded-full"
                    onClick={swapAccounts}
                  />
                </div>
                <AccountChips
                  label="TO"
                  tone="transfer"
                  accounts={toAccounts}
                  value={values.toAccountId}
                  error={errors.toAccountId?.message}
                  onChange={(id) => set("toAccountId", id)}
                />
                <p className="text-[13px] text-text-muted">
                  Transfers move money between your accounts. They never count as income or expense.
                </p>
              </div>
            ) : (
              <>
                <CategoryGrid
                  kind={type}
                  categories={kindCategories}
                  value={values.categoryId}
                  error={errors.categoryId?.message}
                  onChange={(id) => set("categoryId", id)}
                />
                <AccountChips
                  label="ACCOUNT"
                  accounts={moneyAccounts}
                  value={values.accountId}
                  error={errors.accountId?.message}
                  onChange={pickAccount}
                />
              </>
            )}
          </div>
        </div>

        <footer className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-end">
          {isEdit ? null : (
            <Button
              variant="secondary"
              leftIcon="star"
              aria-pressed={saveFavourite}
              className={saveFavourite ? "border-[1.5px] border-primary" : undefined}
              onClick={() => setSaveFavourite(!saveFavourite)}
            >
              Save as favourite
            </Button>
          )}
          <Button type="submit" size="lg" loading={saving} className="tablet:min-w-56">
            {isEdit ? "Save changes" : SAVE_LABELS[type]}
          </Button>
        </footer>
      </form>

      {repeatOpen ? (
        <RepeatSheet
          open
          onClose={() => setRepeatOpen(false)}
          repeat={repeat}
          onApply={setRepeat}
          instalmentsEnabled={canInstalment}
          amountMinor={amountMinor}
          money={money}
        />
      ) : null}
      {favouritesOpen ? (
        <FavouritesSheet
          open
          onClose={() => setFavouritesOpen(false)}
          onPick={applyFavourite}
          categoriesById={categoriesById}
          money={money}
        />
      ) : null}
    </div>
  );
}
