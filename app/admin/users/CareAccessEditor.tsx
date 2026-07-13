"use client";

import { useEffect, useState, useTransition } from "react";
import {
  loadCareAccessAction,
  setUserCareAccessAction,
  resolveAddressRequestAction,
  type CareAccess,
} from "@/app/admin/users/actions";
import { EVERCOOL_INBOXES } from "@/app/admin/email/_lib/inboxes";
import { CARE_SECTIONS } from "@/app/admin/email/_lib/sections";

// "CRM access" panel under each user row (ported from newnei's
// CareAccessEditor): the checkbox options that decide which mailboxes and
// which CRM sections this staffer can open. Loaded on expand, saved as one
// patch. NOTE: role 'admin' bypasses all of this and always sees everything.

// Native <select> with the browser arrow replaced by our own chevron, inset
// from the edge (the default arrow sat flush against the rounded border and
// long labels ran into it).
function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="relative mt-1.5 block w-full max-w-sm">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-ec-border bg-ec-bg px-3 py-2 pr-10 text-sm text-ec-text focus:outline-none focus:border-ec-teal"
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ec-text-muted"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
      </svg>
    </span>
  );
}
export function CareAccessEditor({
  userId,
  userName,
  isAdminRole,
}: {
  userId: string;
  userName: string;
  isAdminRole: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [access, setAccess] = useState<CareAccess | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || access) return;
    startTransition(async () => {
      const res = await loadCareAccessAction(userId);
      if (res.ok && res.access) setAccess(res.access);
      else setError(res.error ?? "Could not load access.");
    });
  }, [open, access, userId]);

  function toggleInbox(address: string) {
    setAccess((a) =>
      a
        ? {
            ...a,
            assignedInboxes: a.assignedInboxes.includes(address)
              ? a.assignedInboxes.filter((x) => x !== address)
              : [...a.assignedInboxes, address],
          }
        : a,
    );
  }

  function toggleSection(key: string) {
    setAccess((a) =>
      a
        ? {
            ...a,
            careSections: a.careSections.includes(key)
              ? a.careSections.filter((x) => x !== key)
              : [...a.careSections, key],
          }
        : a,
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ec-text-muted hover:text-ec-teal border border-ec-border hover:border-ec-teal/40 rounded-lg px-2.5 py-1 transition-colors"
      >
        CRM access
      </button>
    );
  }

  const personalOptions = access?.personalAddress &&
    !EVERCOOL_INBOXES.some((i) => i.address === access.personalAddress)
      ? [{ address: access.personalAddress, label: "Personal" }]
      : [];

  return (
    <div className="w-full rounded-xl border border-ec-border bg-ec-bg p-4 text-left">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ec-text">CRM access: {userName}</p>
        <button onClick={() => setOpen(false)} className="text-xs text-ec-text-muted hover:text-ec-teal">
          Close
        </button>
      </div>

      {isAdminRole && (
        <p className="mt-2 text-[11px] text-ec-text-muted">
          This person is an admin, so they always see every mailbox and section. Change their role first to scope them.
        </p>
      )}

      {!access && !error && <p className="mt-3 text-xs text-ec-text-muted">Loading...</p>}

      {access && (
        <div className={`mt-3 flex flex-col gap-4 ${isAdminRole ? "pointer-events-none opacity-50" : ""}`}>
          {access.requestedAddress && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <p className="text-xs text-ec-text">
                Requests own address: <span className="font-mono">{access.requestedAddress}</span>
              </p>
              <div className="mt-1.5 flex gap-2">
                <button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await resolveAddressRequestAction(userId, true);
                      if (res.ok) {
                        setAccess(null); // reload with the confirmed address
                        setNotice("Address confirmed and assigned.");
                      } else setError(res.error ?? "Could not confirm.");
                    })
                  }
                  className="rounded-lg bg-ec-teal px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Confirm address
                </button>
                <button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await resolveAddressRequestAction(userId, false);
                      if (res.ok) setAccess((a) => (a ? { ...a, requestedAddress: null } : a));
                      else setError(res.error ?? "Could not decline.");
                    })
                  }
                  className="rounded-lg border border-ec-border px-2.5 py-1 text-xs font-semibold text-ec-text-muted disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-ec-text">Inbox visibility</p>
            <p className="text-[11px] text-ec-text-muted">
              Which Evercool mailboxes they see in the shared CRM queue.
            </p>
            <Select
              value={access.inboxScope}
              onChange={(v) => setAccess((a) => (a ? { ...a, inboxScope: v as CareAccess["inboxScope"] } : a))}
            >
              <option value="all">All inboxes</option>
              <option value="shared">All company mail</option>
              <option value="assigned">Only the ones I assign</option>
            </Select>
            {access.inboxScope === "shared" && (
              <p className="mt-1 text-[11px] text-ec-text-muted">
                Sees everything except other people&apos;s personal mailboxes.
              </p>
            )}
            {access.inboxScope === "assigned" && (
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {[...EVERCOOL_INBOXES, ...personalOptions].map((i) => (
                  <label key={i.address} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={access.assignedInboxes.includes(i.address)}
                      onChange={() => toggleInbox(i.address)}
                      className="h-3.5 w-3.5 accent-ec-teal"
                    />
                    <span className="text-xs text-ec-text">{i.label}</span>
                    <span className="font-mono text-[10px] text-ec-text-muted">{i.address}</span>
                  </label>
                ))}
                {access.assignedInboxes.length === 0 && (
                  <p className="col-span-full text-[11px] font-medium text-red-400">
                    Pick at least one, or they will see no mail.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-ec-text">CRM sections they can open</p>
            <Select
              value={access.careSections.length === 0 ? "all" : "some"}
              onChange={(v) =>
                setAccess((a) =>
                  a
                    ? {
                        ...a,
                        careSections: v === "all" ? [] : a.careSections.length ? a.careSections : ["inbox"],
                      }
                    : a,
                )
              }
            >
              <option value="all">All sections</option>
              <option value="some">Only selected</option>
            </Select>
            {access.careSections.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-3">
                {CARE_SECTIONS.map((s) => (
                  <label key={s.key} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={access.careSections.includes(s.key)}
                      onChange={() => toggleSection(s.key)}
                      className="h-3.5 w-3.5 accent-ec-teal"
                    />
                    <span className="text-xs text-ec-text">{s.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  setNotice(null);
                  const res = await setUserCareAccessAction(userId, {
                    inboxScope: access.inboxScope,
                    assignedInboxes: access.assignedInboxes,
                    careSections: access.careSections,
                  });
                  setNotice(res.ok ? "Access saved." : null);
                  if (!res.ok) setError(res.error ?? "Could not save.");
                })
              }
              className="rounded-xl bg-ec-teal px-4 py-2 text-xs font-semibold text-white hover:bg-ec-teal-light disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save access"}
            </button>
            {notice && <p className="text-[11px] font-medium text-green-400">{notice}</p>}
            {error && <p className="text-[11px] font-medium text-red-400">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
