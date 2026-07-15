"use client";

import { useState } from "react";

// A section that opens with a click, so a long body (like the full build log)
// does not take up page space by default. Ported from the newnei build page.
export function Collapsible({
  title,
  right,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-ec-border bg-ec-card px-4 py-3 text-left transition hover:border-ec-teal/30"
      >
        <span className="flex items-center gap-2">
          <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            fill="currentColor"
            aria-hidden
            className={`shrink-0 text-ec-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M5.5 7.5 10 12l4.5-4.5z" />
          </svg>
          <span className="text-base font-bold text-ec-text">{title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-ec-text-muted">
          {right}
          <span className="text-ec-teal">{open ? "Hide" : "Show"}</span>
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
