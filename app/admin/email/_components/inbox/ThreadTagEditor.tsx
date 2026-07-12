"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Tag } from "@/app/admin/email/_lib/types";
import { toggleThreadTagAction } from "@/app/admin/email/inbox/actions";

// Edits the TOPIC tags carried on one ticket (Billing, Refund, ...). The contact
// TagEditor handles the person-level segments; this is the conversation's topic.
export function ThreadTagEditor({
  threadId,
  current,
  allTags,
}: {
  threadId: string;
  current: Tag[];
  allTags: Tag[];
}) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  const topicTags = allTags.filter((t) => t.kind === "topic");
  const currentIds = new Set(current.map((t) => t.id));
  const available = topicTags.filter((t) => !currentIds.has(t.id));

  function toggle(tagId: string, add: boolean) {
    startTransition(async () => {
      await toggleThreadTagAction(threadId, tagId, add);
      router.refresh();
      setAdding(false);
    });
  }

  return (
    <div className={pending ? "opacity-60" : ""}>
      <div className="flex flex-wrap items-center gap-1.5">
        {current.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
            style={{ backgroundColor: t.color }}
          >
            {t.name}
            <button
              type="button"
              onClick={() => toggle(t.id, false)}
              disabled={pending}
              className="ml-0.5 leading-none opacity-80 hover:opacity-100"
              aria-label={`Remove ${t.name}`}
            >
              &times;
            </button>
          </span>
        ))}
        {current.length === 0 && (
          <span className="text-xs text-muted">No topic yet.</span>
        )}
        {available.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-full border border-dashed border-line px-2 py-0.5 text-[11px] font-medium text-muted hover:border-teal hover:text-teal"
          >
            + Topic
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {available.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id, true)}
              disabled={pending}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white opacity-90 hover:opacity-100"
              style={{ backgroundColor: t.color }}
            >
              + {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
