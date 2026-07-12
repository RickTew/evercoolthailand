import type { ThreadDetail } from "@/app/admin/email/_lib/types";
import { localeLabel } from "@/app/admin/email/_lib/ui";

// Compact one-line contact context, used where there is no full contact panel
// (the Top dash view). Shows language, consent, and tags inline.
export function ContactSummary({ detail }: { detail: ThreadDetail }) {
  const { contact, tags } = detail;
  const consent = contact.unsubscribedAt
    ? { label: "Unsubscribed", cls: "text-red" }
    : contact.consentEmail
      ? { label: "Email consent on", cls: "text-green" }
      : { label: "No email consent", cls: "text-muted" };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-white px-5 py-2 text-xs">
      <span className="font-semibold text-ink">{contact.fullName}</span>
      <span className="text-muted">{contact.email}</span>
      <span className="text-muted">{localeLabel(contact.locale)}</span>
      <span className={`font-medium ${consent.cls}`}>{consent.label}</span>
      <div className="flex flex-wrap items-center gap-1">
        {tags.map((t) => (
          <span
            key={t.id}
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: t.color }}
          >
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}
