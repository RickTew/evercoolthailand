"use client";

import { useRouter } from "next/navigation";
import type { Tag } from "@/app/admin/email/_lib/types";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";

// Topic (R14) and Segment (R8) filters: pick one and the inbox narrows to tickets
// with that topic, or whose customer is in that segment. Combined with the
// "Select all" toggle this is how you act on "every client in segment X" or
// "every ticket about topic Y" at once. Navigates by query param, so it's
// shareable and stacks with the other filters.
export function TagFilters({
  current,
  topics,
  segments,
}: {
  current: InboxParams;
  topics: Tag[];
  segments: Tag[];
}) {
  const router = useRouter();
  if (topics.length === 0 && segments.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {topics.length > 0 && (
        <label className="flex items-center gap-1 text-xs text-muted">
          Topic
          <select
            value={current.topic ?? ""}
            onChange={(e) => router.push(buildInboxHref(current, { topic: e.target.value || null }))}
            className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-teal"
          >
            <option value="">Any</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {segments.length > 0 && (
        <label className="flex items-center gap-1 text-xs text-muted">
          Segment
          <select
            value={current.segment ?? ""}
            onChange={(e) => router.push(buildInboxHref(current, { segment: e.target.value || null }))}
            className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-teal"
          >
            <option value="">Any</option>
            {segments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
