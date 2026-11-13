import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ACCOUNT_SCOPES, useLedgerMutation } from "../../hooks/useLedger.js";
import { useSettings } from "../../hooks/useSettings.js";
import { ApiError, fieldErrors } from "../../lib/api.js";
import { accountsApi } from "../../lib/ledger-api.js";
import {
  ACCOUNT_DEFAULTS,
  ACCOUNT_TYPES,
  accountSchema,
  minorToInputText,
  toAccountPayload,
} from "../../schemas/account.js";
import { ColorSwatches } from "../lists/ColorSwatches.jsx";
import { IconPicker } from "../lists/IconPicker.jsx";
import { Alert, Button, Chip, ConfirmDialog, Dialog, Input } from "../ui/index.js";
import { SelectField } from "./SelectField.jsx";

const DEFAULT_ICON = {
  bank: "bank",
  cash: "cash",
  credit_card: "card",
  debit_card: "card",
  investment: "trend",
};

const API_FIELD_TO_FORM = {
  openingBalanceMinor: "openingBalance",
  creditLimitMinor: "creditLimit",
};

function valuesFor(account, currencyCode) {
  if (!account) return ACCOUNT_DEFAULTS;
  const isCredit = account.type === "credit_card";
  return {
    name: account.name,
    type: account.type,
    icon: account.icon,
    color: account.color,
    last4: account.last4 ?? "",
    openingBalance: minorToInputText(account.openingBalanceMinor, currencyCode),
    linkedAccountId: account.linkedAccountId ?? "",
    creditLimit: isCredit ? minorToInputText(account.creditLimitMinor, currencyCode) : "",
    statementDay: account.statementDay ? String(account.statementDay) : "",
    dueDay: account.dueDay ? String(account.dueDay) : "",
  };
}

// Create or edit an account. `accounts` is the active list (for the debit-card bank link).
function AccountFormInner({ open, onClose, account, accounts }) {
  const { currencyCode } = useSettings();
  const editing = Boolean(account);
  const [formError, setFormError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: valuesFor(account, currencyCode),
  });

  const type = watch("type");
  const isCredit = type === "credit_card";
  const banks = accounts.filter((a) => a.type === "bank" && !a.archived);

  const done = () => onClose();
  const save = useLedgerMutation(
    (payload) => (editing ? accountsApi.update(account.id, payload) : accountsApi.create(payload)),
    { scopes: ACCOUNT_SCOPES, onSuccess: done },
  );
  const makeDefault = useLedgerMutation(() => accountsApi.makeDefault(account.id), {
    scopes: ACCOUNT_SCOPES,
    onSuccess: done,
  });
  const toggleArchive = useLedgerMutation(
    () => (account.archived ? accountsApi.unarchive(account.id) : accountsApi.archive(account.id)),
    { scopes: ACCOUNT_SCOPES, onSuccess: done },
  );
  const remove = useLedgerMutation(() => accountsApi.remove(account.id), {
    scopes: ACCOUNT_SCOPES,
    onSuccess: () => {
      setConfirmDelete(false);
      onClose();
    },
  });

  function showApiError(error, { fromDelete = false } = {}) {
    if (fromDelete) setConfirmDelete(false);
    if (error instanceof ApiError && error.code === "IN_USE") {
      setFormError("This account has entries — archive it instead.");
      return;
    }
    const mapped = fieldErrors(error);
    const keys = Object.keys(mapped);
    if (keys.length) {
      for (const key of keys) setError(API_FIELD_TO_FORM[key] ?? key, { message: mapped[key] });
      return;
    }
    setFormError(error instanceof ApiError ? error.message : "Something went wrong. Try again.");
  }

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    const result = toAccountPayload(values, currencyCode, { editing });
    if (result.errors) {
      for (const [field, message] of Object.entries(result.errors)) setError(field, { message });
      return;
    }
    save.mutate(result.payload, { onError: showApiError });
  });

  function changeType(next) {
    const previousIcon = DEFAULT_ICON[type];
    setValue("type", next, { shouldValidate: true });
    if (watch("icon") === previousIcon) setValue("icon", DEFAULT_ICON[next]);
  }

  const busy = save.isPending || makeDefault.isPending || toggleArchive.isPending;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={editing ? "Edit account" : "Add account"}
        size="md"
        footer={
          <Button type="submit" form="account-form" fullWidth loading={save.isPending}>
            {editing ? "Save" : "Add account"}
          </Button>
        }
      >
        <form
          id="account-form"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-4 pt-2 pb-2"
        >
          {formError ? <Alert>{formError}</Alert> : null}
          <Input
            label="Name"
            autoComplete="off"
            error={errors.name?.message}
            {...register("name")}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-[13px] font-semibold text-text-muted-2">Type</legend>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_TYPES.map((item) => (
                <Chip
                  key={item.value}
                  selected={type === item.value}
                  onClick={() => changeType(item.value)}
                >
                  {item.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-text-muted-2">Icon</span>
            <Controller
              control={control}
              name="icon"
              render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
            />
            {errors.icon ? <p className="text-[13px] text-danger">{errors.icon.message}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-text-muted-2">Colour</span>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <ColorSwatches value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {type === "debit_card" ? (
            <SelectField
              label="Linked bank"
              error={errors.linkedAccountId?.message}
              {...register("linkedAccountId")}
            >
              <option value="">Choose a bank account</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </SelectField>
          ) : null}

          <Input
            label="Last 4 digits (optional)"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            error={errors.last4?.message}
            {...register("last4")}
          />

          {type !== "debit_card" ? (
            <Input
              label={isCredit ? "Amount owed at start" : "Opening balance"}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              error={errors.openingBalance?.message}
              {...register("openingBalance")}
            />
          ) : null}

          {isCredit ? (
            <>
              <Input
                label="Credit limit"
                inputMode="decimal"
                autoComplete="off"
                error={errors.creditLimit?.message}
                {...register("creditLimit")}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Statement day"
                  inputMode="numeric"
                  placeholder="1-28"
                  error={errors.statementDay?.message}
                  {...register("statementDay")}
                />
                <Input
                  label="Due day"
                  inputMode="numeric"
                  placeholder="1-28"
                  error={errors.dueDay?.message}
                  {...register("dueDay")}
                />
              </div>
            </>
          ) : null}

          {editing ? (
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              {!account.isDefault && !account.archived ? (
                <Button
                  variant="secondary"
                  loading={makeDefault.isPending}
                  disabled={busy}
                  onClick={() => makeDefault.mutate(undefined, { onError: showApiError })}
                >
                  Make default
                </Button>
              ) : null}
              <Button
                variant="danger"
                loading={toggleArchive.isPending}
                disabled={busy}
                onClick={() => toggleArchive.mutate(undefined, { onError: showApiError })}
              >
                {account.archived ? "Unarchive" : "Archive"}
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </div>
          ) : null}
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          remove.mutate(undefined, { onError: (e) => showApiError(e, { fromDelete: true }) })
        }
        title="Delete this account?"
        description="This can't be undone. Accounts with entries can't be deleted; archive them instead."
        loading={remove.isPending}
      />
    </>
  );
}

// Remounts the form each time it opens so values and errors start fresh.
export function AccountForm({ open, onClose, account = null, accounts = [] }) {
  const key = open ? (account?.id ?? "new") : "closed";
  return (
    <AccountFormInner
      key={key}
      open={open}
      onClose={onClose}
      account={account}
      accounts={accounts}
    />
  );
}
