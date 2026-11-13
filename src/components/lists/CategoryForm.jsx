import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { CATEGORY_SCOPES, useLedgerMutation } from "../../hooks/useLedger.js";
import { ApiError, fieldErrors } from "../../lib/api.js";
import { categoriesApi } from "../../lib/ledger-api.js";
import { categorySchema } from "../../schemas/category.js";
import { Alert, Button, ConfirmDialog, Dialog, Input } from "../ui/index.js";
import { ColorSwatches } from "./ColorSwatches.jsx";
import { IconPicker } from "./IconPicker.jsx";

const DEFAULTS = { name: "", icon: "other", color: "c1" };

function valuesFor(category) {
  return category ? { name: category.name, icon: category.icon, color: category.color } : DEFAULTS;
}

// Create (category null, kind given) or edit a category.
function CategoryFormInner({ open, onClose, category, kind }) {
  const editing = Boolean(category);
  const [formError, setFormError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(categorySchema), defaultValues: valuesFor(category) });

  const done = () => onClose();
  const save = useLedgerMutation(
    (values) =>
      editing
        ? categoriesApi.update(category.id, values)
        : categoriesApi.create({ kind, ...values }),
    { scopes: CATEGORY_SCOPES, onSuccess: done },
  );
  const toggleArchive = useLedgerMutation(
    () =>
      category.archived ? categoriesApi.unarchive(category.id) : categoriesApi.archive(category.id),
    { scopes: CATEGORY_SCOPES, onSuccess: done },
  );
  const remove = useLedgerMutation(() => categoriesApi.remove(category.id), {
    scopes: CATEGORY_SCOPES,
    onSuccess: () => {
      setConfirmDelete(false);
      onClose();
    },
  });

  function showApiError(error, { fromDelete = false } = {}) {
    if (fromDelete) setConfirmDelete(false);
    if (error instanceof ApiError && error.code === "IN_USE") {
      setFormError("This category has entries — archive it instead.");
      return;
    }
    const mapped = fieldErrors(error);
    if (Object.keys(mapped).length) {
      for (const [key, message] of Object.entries(mapped)) setError(key, { message });
      return;
    }
    setFormError(error instanceof ApiError ? error.message : "Something went wrong. Try again.");
  }

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    save.mutate(values, { onError: showApiError });
  });

  const busy = save.isPending || toggleArchive.isPending;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={editing ? "Edit category" : `Add ${kind} category`}
        footer={
          <Button type="submit" form="category-form" fullWidth loading={save.isPending}>
            Save
          </Button>
        }
      >
        <form
          id="category-form"
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
          {editing ? (
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <p className="text-[13px] text-text-muted">
                Archiving hides it from new entries; past entries keep their category. Delete is
                only offered when nothing uses it.
              </p>
              <Button
                variant="danger"
                loading={toggleArchive.isPending}
                disabled={busy}
                onClick={() => toggleArchive.mutate(undefined, { onError: showApiError })}
              >
                {category.archived ? "Unarchive" : "Archive"}
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
        title="Delete this category?"
        description="This can't be undone. Categories used by entries can't be deleted; archive them instead."
        loading={remove.isPending}
      />
    </>
  );
}

// Remounts the form each time it opens so values and errors start fresh.
export function CategoryForm({ open, onClose, category = null, kind }) {
  const key = open ? (category?.id ?? "new") : "closed";
  return (
    <CategoryFormInner key={key} open={open} onClose={onClose} category={category} kind={kind} />
  );
}
