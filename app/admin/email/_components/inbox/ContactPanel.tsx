import Link from "next/link";
import type { ReactNode } from "react";
import type { Tag, ThreadDetail } from "@/app/admin/email/_lib/types";
import { STATUS_META, localeLabel } from "@/app/admin/email/_lib/ui";
import { LocalTime } from "@/app/admin/email/_components/inbox/LocalTime";
import { TagEditor } from "@/app/admin/email/_components/inbox/TagEditor";
import { ThreadTagEditor } from "@/app/admin/email/_components/inbox/ThreadTagEditor";
import { ThreadNotes } from "@/app/admin/email/_components/inbox/ThreadNotes";
import { EditableContactName } from "@/app/admin/email/_components/inbox/EditableContactName";

export function ContactPanel({
  detail,
  allTags,
  threadHref,
}: {
  detail: ThreadDetail;
  allTags: Tag[];
  threadHref: (id: string) => string;
}) {
  const { thread, contact, tags, threadTags, notes, contactHistory } = detail;
  const segmentTags = allTags.filter((t) => t.kind === "segment");
  const consent = contact.unsubscribedAt
    ? { label: "Unsubscribed", cls: "text-red" }
    : contact.consentEmail
      ? { label: "Email consent on", cls: "text-green" }
      : { label: "No email consent", cls: "text-muted" };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
          {contact.fullName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <EditableContactName contactId={contact.id} fullName={contact.fullName} />
          <p className="truncate text-xs text-muted">{contact.email}</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-line bg-canvas/60 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            This ticket
          </p>
          {thread.reference && (
            <span className="rounded bg-navy/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-navy">
              {thread.reference}
            </span>
          )}
        </div>
        <p className="mt-2 mb-1 text-[10px] font-medium uppercase tracking-wide text-muted">
          Topic
        </p>
        <ThreadTagEditor threadId={thread.id} current={threadTags} allTags={allTags} />
        <p className="mt-3 mb-1 text-[10px] font-medium uppercase tracking-wide text-muted">
          Internal notes
        </p>
        <ThreadNotes threadId={thread.id} notes={notes} />
      </div>

      <dl className="mt-4 space-y-2 text-xs">
        <Row label="Language" value={localeLabel(contact.locale)} />
        <div className="flex items-center justify-between">
          <dt className="text-muted">Consent</dt>
          <dd className={`font-medium ${consent.cls}`}>{consent.label}</dd>
        </div>
        {contact.consentSource && <Row label="Source" value={contact.consentSource} />}
        {contact.consentUpdatedAt && (
          <Row label="Consent date" value={<LocalTime iso={contact.consentUpdatedAt} />} />
        )}
      </dl>

      {contact.notes && (
        <div className="mt-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Notes
          </p>
          <p className="rounded-md bg-canvas p-2 text-xs text-ink">{contact.notes}</p>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Segments
        </p>
        <TagEditor contactId={contact.id} current={tags} allTags={segmentTags} />
      </div>

      <div className="mt-5">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Support history ({contactHistory.length})
        </p>
        {contactHistory.length === 0 ? (
          <p className="text-xs text-muted">No other conversations.</p>
        ) : (
          <ul className="space-y-1.5">
            {contactHistory.map((t) => {
              const meta = STATUS_META[t.status];
              return (
                <li key={t.id}>
                  <Link
                    href={threadHref(t.id)}
                    className="block rounded-md border border-line px-2.5 py-2 hover:bg-canvas"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-navy">{t.subject}</span>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                    </div>
                    <LocalTime iso={t.lastMessageAt} className="text-[10px] text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
