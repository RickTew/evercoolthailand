"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildInboxHref,
  parseSearchMode,
  SEARCH_MODES,
  type InboxParams,
  type SearchMode,
} from "@/app/admin/email/_lib/inbox-url";

// Free-text inbox search (N1). A plain form that navigates by setting ?q=, so the
// list stays server-rendered and the result is shareable. Submitting drops the
// open thread so the list re-selects the first match. A scope picker (Raphael's
// request) narrows the search to the sender's name/email, to the message text,
// or searches everything. Focus shortcuts: "/" and Cmd/Ctrl+K.
export function InboxSearch({ current }: { current: InboxParams }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  // Initialized from the URL; the parent keys this component on current.q, so a
  // navigation that changes ?q= remounts it with the new value (no sync effect).
  const [value, setValue] = useState(current.q ?? "");
  const mode = parseSearchMode(current.qmode);
  const modeHint = SEARCH_MODES.find((m) => m.key === mode)?.hint ?? "";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (cmdK || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function submit(next: string, nextMode: SearchMode = mode) {
    const trimmed = next.trim();
    router.push(
      buildInboxHref(current, {
        q: trimmed || null,
        qmode: nextMode === "all" ? null : nextMode,
        thread: null,
      }),
    );
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      className="flex min-w-0 items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1 focus-within:border-teal"
    >
      <span aria-hidden className="text-xs text-muted">
        ⌕
      </span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search name, email, subject, N-#…"
        aria-label="Search the inbox"
        className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
      />
      {/* Search scope: narrow to name/email, message text, or search everything.
          Changing it re-runs the current query in the new scope. */}
      <select
        value={mode}
        onChange={(e) => submit(value, e.target.value as SearchMode)}
        aria-label="Search scope"
        title={modeHint}
        className="shrink-0 cursor-pointer rounded border-0 bg-transparent text-[11px] font-medium text-muted outline-none hover:text-ink focus:text-ink"
      >
        {SEARCH_MODES.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            submit("");
          }}
          aria-label="Clear search"
          className="text-xs text-muted hover:text-ink"
        >
          ✕
        </button>
      )}
    </form>
  );
}
