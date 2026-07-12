"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameContactAction } from "@/app/admin/email/inbox/actions";

// Staff-editable contact name (R12). Inbound mail with no From name shows the
// email address; click the pencil to set the real name. Optimistic so it updates
// instantly, then reconciles when the server prop changes.
export function EditableContactName({
  contactId,
  fullName,
}: {
  contactId: string;
  fullName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fullName);
  const [name, setName] = useState(fullName);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Reconcile when the server prop changes: track the previous prop in state and
  // adjust during render (the React derived-state pattern) instead of in an effect.
  const [prevFullName, setPrevFullName] = useState(fullName);
  if (prevFullName !== fullName) {
    setPrevFullName(fullName);
    setName(fullName);
  }

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function save() {
    const next = value.trim();
    if (next === "" || next === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    setName(next); // optimistic
    setEditing(false);
    startTransition(async () => {
      await renameContactAction(contactId, next);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(name);
            setEditing(false);
          }
        }}
        className="w-full rounded-md border border-teal px-1.5 py-0.5 text-sm font-semibold text-ink outline-none"
        aria-label="Edit customer name"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(name);
        setEditing(true);
      }}
      title="Click to edit the customer's name"
      className={`group flex max-w-full items-center gap-1 text-left ${pending ? "opacity-70" : ""}`}
    >
      <span className="truncate text-sm font-semibold text-ink">{name}</span>
      <span aria-hidden className="shrink-0 text-[10px] text-muted opacity-0 transition group-hover:opacity-100">
        ✎
      </span>
    </button>
  );
}
