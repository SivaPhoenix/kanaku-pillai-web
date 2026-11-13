import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { ApiError } from "../../lib/api.js";
import { meApi } from "../../lib/ledger-api.js";
import { Alert, Button, Dialog, Input } from "../ui/index.js";

export function DeleteAccountDialog({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const needsPassword = Boolean(user.authMethods?.includes("password"));
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const ready = confirm === "DELETE" && (!needsPassword || password.length > 0);

  async function submit(event) {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    setPasswordError(null);
    try {
      await meApi.deleteAccount({ confirm: "DELETE", ...(needsPassword ? { password } : {}) });
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError && e.status === 401 && e.code === "INVALID_CREDENTIALS") {
        setPasswordError("Password is incorrect");
      } else if (e instanceof ApiError && e.status === 429) {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else {
        setError(e instanceof ApiError ? e.message : "Couldn't delete the account. Try again.");
      }
      return;
    }
    try {
      await logout();
    } catch {
      // the session is already gone on the server, so a 401 here is expected
    }
    navigate("/auth/login", { replace: true });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Delete account"
      size="sm"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="delete-account-form"
            variant="danger-solid"
            fullWidth
            disabled={!ready}
            loading={busy}
          >
            Delete account
          </Button>
        </>
      }
    >
      <form
        id="delete-account-form"
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-4 pt-2"
      >
        <p className="text-[15px] text-text-muted">
          This permanently deletes your account and all your entries, accounts, categories and
          devices. It can't be undone.
        </p>
        {error ? <Alert>{error}</Alert> : null}
        <Input
          label="Type DELETE to confirm"
          autoComplete="off"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {needsPassword ? (
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            error={passwordError}
            onChange={(e) => setPassword(e.target.value)}
          />
        ) : null}
      </form>
    </Dialog>
  );
}
