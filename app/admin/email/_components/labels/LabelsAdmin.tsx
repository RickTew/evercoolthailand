"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Tag } from "@/app/admin/email/_lib/types";
import {
  createTagAction,
  renameTagAction,
  setTagColorAction,
  deleteTagAction,
} from "@/app/admin/email/labels/actions";

// Label color swatches: the brand palette first, then extra hues for variety so
// topics and segments are easy to tell apart at a glance.
const COLORS = [
  "#22416b", // navy
  "#178a8a", // teal
  "#2e8b4f", // green
  "#e8731c", // orange
  "#7a4a9c", // purple
  "#d64545", // red
  "#2f8fd6", // sky blue
  "#0fb5ae", // turquoise
  "#7cae3a", // lime
  "#e0a93b", // amber
  "#d6457f", // rose
  "#c2418a", // magenta
  "#5a4fcf", // indigo
  "#a6663c", // clay
  "#5b6b7a", // slate
  "#3aa6a0", // sea
  "#f2cd00", // bright yellow
  "#ff6f59", // coral
  "#0e7c66", // pine
  "#111827", // ink
];

function Section({
  kind,
  title,
  blurb,
  noun,
  tags,
}: {
  kind: "topic" | "segment";
  title: string;
  blurb: string;
  noun: string;
  tags: Tag[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function create() {
    if (name.trim() === "") return;
    setError("");
    startTransition(async () => {
      const res = await createTagAction(name, color, kind);
      if (!res.ok) {
        setError(res.error ?? "Could not create the label.");
        return;
      }
      setName("");
      router.refresh();
    });
  }

  function saveRename(id: string) {
    if (editName.trim() === "") return;
    startTransition(async () => {
      const res = await renameTagAction(id, editName);
      if (!res.ok) {
        setError(res.error ?? "Could not rename.");
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function recolor(id: string, c: string) {
    startTransition(async () => {
      await setTagColorAction(id, c);
      router.refresh();
    });
  }

  function remove(t: Tag) {
    if (!window.confirm(`Delete the ${noun} "${t.name}"? It will be removed from every ticket and contact that has it.`)) return;
    startTransition(async () => {
      await deleteTagAction(t.id);
      router.refresh();
    });
  }

  return (
    <section className={pending ? "opacity-70" : ""}>
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <p className="mt-0.5 text-xs text-muted">{blurb}</p>

      <ul className="mt-3 space-y-2">
        {tags.length === 0 && (
          <li className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-muted">
            No {noun}s yet. Create the first one below.
          </li>
        )}
        {tags.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-2"
          >
            <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
            {editingId === t.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-line px-2 py-1 text-xs text-ink outline-none focus:border-teal"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveRename(t.id)}
                  disabled={pending}
                  className="rounded-md border border-teal px-2 py-1 text-[11px] font-semibold text-teal hover:bg-teal/5 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-[11px] text-muted hover:text-ink"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{t.name}</span>
                <span className="flex max-w-[240px] flex-wrap items-center justify-end gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => recolor(t.id, c)}
                      title="Set color"
                      aria-label={`Set color ${c}`}
                      className={`h-3.5 w-3.5 rounded-full ${t.color === c ? "ring-2 ring-offset-1 ring-navy" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(t.id);
                    setEditName(t.name);
                  }}
                  className="text-[11px] font-medium text-navy hover:underline"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => remove(t)}
                  disabled={pending}
                  className="text-[11px] font-medium text-red hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Create */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
          placeholder={`New ${noun} name…`}
          className="min-w-0 flex-1 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink outline-none focus:border-teal"
        />
        <span className="flex max-w-[240px] flex-wrap items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Pick color ${c}`}
              className={`h-4 w-4 rounded-full ${color === c ? "ring-2 ring-offset-1 ring-navy" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </span>
        <button
          type="button"
          onClick={create}
          disabled={pending || name.trim() === ""}
          className="shrink-0 rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Add {noun}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red">{error}</p>}
    </section>
  );
}

export function LabelsAdmin({ topics, segments }: { topics: Tag[]; segments: Tag[] }) {
  return (
    <div className="space-y-8">
      <Section
        kind="topic"
        title="Topics"
        noun="topic"
        blurb="Topics tag a conversation by what it is about (billing, access, refund…). The agent auto-tags new arrivals when a topic name matches, and you can filter the inbox by them."
        tags={topics}
      />
      <Section
        kind="segment"
        title="Segments"
        noun="segment"
        blurb="Segments tag a customer (VIP, affiliate, beta…). They show on the contact and follow them across every conversation."
        tags={segments}
      />
    </div>
  );
}
