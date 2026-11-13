import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLedgerMutation } from "../../hooks/useLedger.js";
import { ApiError } from "../../lib/api.js";
import { meApi } from "../../lib/ledger-api.js";
import { queryKeys } from "../../lib/query-keys.js";
import { Alert, Button, Spinner } from "../ui/index.js";

function browserOf(ua) {
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return null;
}

function osOf(ua) {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iOS/.test(ua)) return "iOS";
  if (/Mac OS/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return null;
}

// "Chrome on Windows" from a raw user agent; falls back to the platform name.
function shortenUserAgent(userAgent, platform) {
  if (!userAgent) return platform ?? "Unknown device";
  const browser = browserOf(userAgent);
  const os = osOf(userAgent);
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? userAgent.slice(0, 40);
}

function lastUsed(iso, locale) {
  try {
    return new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function SessionsList({ locale }) {
  const query = useQuery({ queryKey: queryKeys.sessions(), queryFn: meApi.sessions });
  const [error, setError] = useState(null);
  const revoke = useLedgerMutation((id) => meApi.revokeSession(id), {
    scopes: [queryKeys.sessions()],
  });

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }
  if (query.isError) {
    return (
      <Alert>
        <p>Couldn't load your devices.</p>
        <Button variant="ghost" onClick={() => query.refetch()}>
          Retry
        </Button>
      </Alert>
    );
  }
  const sessions = query.data ?? [];
  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert>{error}</Alert> : null}
      {sessions.length === 0 ? (
        <p className="text-[14px] text-text-muted">No devices are signed in.</p>
      ) : null}
      {sessions.map((session) => (
        <div key={session.id} className="flex items-center gap-3 rounded-xl surface-l0 p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-text">
              {shortenUserAgent(session.userAgent, session.platform)}
              {session.current ? (
                <span className="ml-2 text-[13px] font-bold text-income">This device</span>
              ) : null}
            </p>
            <p className="truncate text-[13px] text-text-muted">
              {session.platform} {"·"} last used {lastUsed(session.lastUsedAt, locale)}
            </p>
          </div>
          {!session.current ? (
            <Button
              variant="ghost"
              loading={revoke.isPending && revoke.variables === session.id}
              onClick={() => {
                setError(null);
                revoke.mutate(session.id, {
                  onError: (e) =>
                    setError(e instanceof ApiError ? e.message : "Couldn't sign that device out."),
                });
              }}
            >
              Sign out
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
