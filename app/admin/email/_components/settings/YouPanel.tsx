"use client";

import { useState, useTransition } from "react";
import {
  setMySignatureAction,
  setMyRestoreSessionAction,
  requestMyAddressAction,
  cancelMyAddressRequestAction,
} from "@/app/admin/email/settings/actions";
import type { StaffPrefs } from "@/app/admin/email/_lib/types";

// The "You" panel (ported from newnei Care Settings): the signed-in staffer's
// own preferences. Access (which inboxes/sections you see) is READ-ONLY here;
// an admin sets it in the Users console's CRM access panel.
export function YouPanel({
  prefs,
  isAdmin,
  scopeSummary,
}: {
  prefs: StaffPrefs;
  isAdmin: boolean;
  // Human-readable description of this person's inbox visibility, resolved
  // server-side so the wording always matches the real enforcement.
  scopeSummary: string;
}) {
  const [signature, setSignature] = useState(prefs.signature);
  const [restore, setRestore] = useState(prefs.restoreSession);
  const [requested, setRequested] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">You</h2>
      <p className="mt-0.5 text-xs text-muted">Your own preferences. Only you see these.</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink">Signature</label>
          <p className="text-[11px] text-muted">Prefilled at the bottom of your replies.</p>
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm text-ink focus:border-teal focus:outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setNotice(null);
                await setMySignatureAction(signature);
                setNotice("Signature saved.");
              })
            }
            className="mt-1.5 rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
          >
            Save signature
          </button>
        </div>

        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={restore}
            onChange={(e) => {
              const on = e.target.checked;
              setRestore(on);
              startTransition(async () => {
                await setMyRestoreSessionAction(on);
              });
            }}
            className="mt-0.5 h-4 w-4 accent-teal"
          />
          <span>
            <span className="block text-xs font-semibold text-ink">Pick up where you left off</span>
            <span className="block text-[11px] text-muted">
              Reopen your last inbox view and filters when you come back.
            </span>
          </span>
        </label>

        <div className="rounded-md border border-line bg-canvas/50 px-3 py-2.5">
          <p className="text-xs font-semibold text-ink">Your access</p>
          <p className="mt-0.5 text-[11px] text-muted">{scopeSummary} An admin sets this in the Users console.</p>
        </div>

        {!isAdmin && (
          <div>
            <label className="block text-xs font-semibold text-ink">Your own @evercoolthailand.com address</label>
            {prefs.personalAddress ? (
              <p className="mt-0.5 text-[11px] text-muted">
                Confirmed: <span className="font-mono">{prefs.personalAddress}</span>
              </p>
            ) : prefs.requestedAddress ? (
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <span>
                  Requested: <span className="font-mono">{prefs.requestedAddress}</span> (waiting for an admin)
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await cancelMyAddressRequestAction();
                      setNotice("Request cancelled.");
                    })
                  }
                  className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-muted hover:bg-canvas disabled:opacity-50"
                >
                  Cancel request
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  value={requested}
                  onChange={(e) => setRequested(e.target.value)}
                  placeholder="yourname"
                  className="w-40 rounded-md border border-line px-2 py-1.5 text-sm text-ink focus:border-teal focus:outline-none"
                />
                <span className="text-xs text-muted">@evercoolthailand.com</span>
                <button
                  type="button"
                  disabled={pending || !requested.trim()}
                  onClick={() =>
                    startTransition(async () => {
                      setError(null);
                      setNotice(null);
                      const res = await requestMyAddressAction(requested);
                      if (!res.ok) setError(res.error ?? "Could not request that address.");
                      else setNotice("Request sent to the admin.");
                    })
                  }
                  className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
                >
                  Request
                </button>
              </div>
            )}
          </div>
        )}

        {notice && <p className="text-[11px] font-medium text-green">{notice}</p>}
        {error && <p className="text-[11px] font-medium text-red">{error}</p>}
      </div>
    </section>
  );
}
