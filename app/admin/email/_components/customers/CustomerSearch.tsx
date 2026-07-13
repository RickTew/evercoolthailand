"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseSearchMode, SEARCH_MODES, type SearchMode } from "@/app/admin/email/_lib/inbox-url";

// Search box for the customer directory. Updates the ?q= / ?qmode= URL (debounced)
// so the server component re-runs the search. A scope picker (matching the inbox
// search) narrows to the contact's name/email, to message text, or searches
// everything. Submitting also works for a quick Enter.
export function CustomerSearch({
  initialQuery,
  initialMode = "all",
}: {
  initialQuery: string;
  initialMode?: SearchMode;
}) {
  const [value, setValue] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>(parseSearchMode(initialMode));
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const modeHint = SEARCH_MODES.find((m) => m.key === mode)?.hint ?? "";
  // Skip the very first run: on mount the value still equals the URL, so firing
  // a replace would be a no-op navigation that can interrupt other clicks (e.g.
  // bounce you straight back off a customer profile you just opened).
  const firstRun = useRef(true);
  // The debounced query timer captured `mode` when typing started; if the scope
  // then changes before it fires, the trailing timer would push the OLD scope and
  // wipe the new one. Read the latest scope from a ref so the debounce stays in
  // sync; the picker's onChange writes it (refs must not be written during render).
  const modeRef = useRef(mode);

  function go(q: string, m: SearchMode) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (m !== "all") params.set("qmode", m);
    const s = params.toString();
    startTransition(() => {
      router.replace(s ? `/admin/email/customers?${s}` : "/admin/email/customers");
    });
  }

  // Debounce: push the query to the URL ~300ms after typing stops.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => go(value.trim(), modeRef.current), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(value.trim(), mode);
      }}
      className="relative flex items-center gap-2"
    >
      <div className="relative flex-1">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder="Search by name, email, a note, or anything they wrote..."
          className="w-full rounded-lg border border-line bg-white px-4 py-2.5 pr-10 text-sm text-ink outline-none focus:border-teal"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
          {pending ? "..." : ""}
        </span>
      </div>
      {/* Search scope: narrow to name/email, message text, or search everything.
          Changing it re-runs the current query in the new scope. */}
      <select
        value={mode}
        onChange={(e) => {
          const m = e.target.value as SearchMode;
          setMode(m);
          modeRef.current = m;
          go(value.trim(), m);
        }}
        aria-label="Search scope"
        title={modeHint}
        className="shrink-0 cursor-pointer rounded-lg border border-line bg-white px-2.5 py-2.5 text-xs font-medium text-muted outline-none hover:text-ink focus:border-teal focus:text-ink"
      >
        {SEARCH_MODES.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>
    </form>
  );
}
