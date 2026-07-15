"use client";

import { useState } from "react";
import type { BuildLogEntry, BuildLogType } from "@/lib/dashboard/buildLog";

const TYPE_STYLE: Record<BuildLogType, string> = {
  feature: "bg-teal-500/15 text-teal-500",
  fix: "bg-amber-500/15 text-amber-500",
  content: "bg-purple-500/15 text-purple-400",
  infra: "bg-blue-500/15 text-blue-400",
  data: "bg-green-500/15 text-green-500",
  strategy: "bg-red-500/15 text-red-400",
};

// The build log as expandable rows. Each entry shows its headline; opening it
// reveals every individual edit, fix, and change, so the whole team can see
// what went into a thing that "just works". Ported from the newnei build page.
export function BuildLogList({ entries }: { entries: BuildLogEntry[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {entries.map((e, i) => {
        const isOpen = open.has(i);
        return (
          <div key={i} className="overflow-hidden rounded-2xl border border-ec-border bg-ec-card">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-ec-bg"
            >
              <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_STYLE[e.type]}`}>
                {e.type}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-bold text-ec-text">{e.title}</span>
                  <span className="text-[11px] text-ec-text-muted">
                    {e.date} &middot; ~{e.hours}h{typeof e.tokensK === "number" ? ` · ~${e.tokensK}k tok` : ""} &middot; {e.changes.length} change{e.changes.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-ec-text-muted">{e.summary}</div>
              </div>
              <svg
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="currentColor"
                aria-hidden
                className={`mt-1 shrink-0 text-ec-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                <path d="M5.5 7.5 10 12l4.5-4.5z" />
              </svg>
            </button>
            {isOpen && (
              <div className="border-t border-ec-border bg-ec-bg/60 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ec-text-muted">
                  Every change in this item
                </div>
                <ul className="mt-1.5 space-y-1">
                  {e.changes.map((c, j) => (
                    <li key={j} className="flex gap-2 text-xs leading-relaxed text-ec-text">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ec-teal" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
