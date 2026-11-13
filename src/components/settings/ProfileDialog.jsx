import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { ApiError } from "../../lib/api.js";
import { meApi } from "../../lib/ledger-api.js";
import { Alert, Button, Dialog, Input } from "../ui/index.js";

function ProfileDialogInner({ open, onClose }) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80) return setError("Enter a name up to 80 characters");
    setSaving(true);
    setError(null);
    try {
      await meApi.updateProfile({ name: trimmed });
      await refreshUser();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit profile"
      size="sm"
      footer={
        <Button type="submit" form="profile-form" fullWidth loading={saving}>
          Save
        </Button>
      }
    >
      <form id="profile-form" onSubmit={submit} noValidate className="flex flex-col gap-4 pt-2">
        {error ? <Alert>{error}</Alert> : null}
        <Input
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </form>
    </Dialog>
  );
}

// Remounts each time it opens so the name field starts from the current profile.
export function ProfileDialog({ open, onClose }) {
  return <ProfileDialogInner key={open ? "open" : "closed"} open={open} onClose={onClose} />;
}
