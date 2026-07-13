import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { requireCareSection, getMyInboxScope } from "@/app/admin/email/_lib/sections.server";
import type { ReactNode } from "react";
import { STATUS_META, localeLabel } from "@/app/admin/email/_lib/ui";
import { LocalTime } from "@/app/admin/email/_components/inbox/LocalTime";
import { SupportSubBar } from "@/app/admin/email/_components/SupportSubBar";

// Full customer profile: who they are + their whole support history, the single
// place to "dig up" everything about a person before replying.
export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Care section gate: same rule as the directory (the admin layout already
  // handled sign-in).
  await requireCareSection("contacts");

  const { id } = await params;
  const repo = await getRepo();
  // Per-staff inbox scope: an "assigned"-scoped staffer can't open a contact
  // outside their inboxes by URL (getContactDetail returns null for one), so it
  // 404s like any missing contact. Admins, "all"-scoped and "shared"-scoped staff
  // pass null and can open anyone: contacts are company-wide, so v1 deliberately
  // skips mirroring the inbox's shared-scope exclusion here.
  const inboxScope = await getMyInboxScope();
  const profile = await repo.getContactDetail(id, { inboxes: inboxScope });
  if (!profile) notFound();
  const { contact, segments, threads, openCount, lastContactAt } = profile;

  const consent = contact.unsubscribedAt
    ? { label: "Unsubscribed", cls: "text-red" }
    : contact.consentEmail
      ? { label: "Email consent on", cls: "text-green" }
      : { label: "No email consent", cls: "text-muted" };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas">
      <SupportSubBar
        title="Customer"
        right={
          <Link
            href="/admin/email/customers"
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-white"
          >
            Back to search
          </Link>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-xl font-bold text-white">
            {contact.fullName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink">{contact.fullName}</h2>
            <p className="truncate text-sm text-muted">{contact.email}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {segments.map((s) => (
                <span
                  key={s.id}
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Tickets" value={String(threads.length)} />
          <Stat label="Open now" value={String(openCount)} />
          <Stat label="Last contact" value={lastContactAt ? <LocalTime iso={lastContactAt} dateOnly /> : "-"} />
        </div>

        {/* Details */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Details</p>
            <dl className="space-y-1.5 text-xs">
              <Row label="Language" value={localeLabel(contact.locale)} />
              <div className="flex items-center justify-between">
                <dt className="text-muted">Consent</dt>
                <dd className={`font-medium ${consent.cls}`}>{consent.label}</dd>
              </div>
              {contact.consentSource && <Row label="Source" value={contact.consentSource} />}
              {contact.consentUpdatedAt && (
                <Row label="Consent date" value={<LocalTime iso={contact.consentUpdatedAt} />} />
              )}
              <Row label="First seen" value={<LocalTime iso={contact.createdAt} />} />
            </dl>
            {contact.notes && (
              <p className="mt-3 rounded-md bg-canvas p-2 text-xs text-ink">{contact.notes}</p>
            )}
          </div>

          {/* Parked seam: booking/quote records arrive once the CRM contact is
              linked to the site's bookings and quotes tables. */}
          <div className="rounded-lg border border-dashed border-line bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Bookings &amp; quotes
            </p>
            <p className="text-xs text-muted">
              Service bookings and quotes will appear here once they are linked to
              the contact record. For now, check the Bookings and Quotes admin
              pages directly.
            </p>
          </div>
        </div>

        {/* Support history */}
        <div className="mt-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Support history ({threads.length})
          </p>
          {threads.length === 0 ? (
            <p className="text-sm text-muted">No conversations yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {threads.map((t) => {
                const meta = STATUS_META[t.status];
                return (
                  <li key={t.id}>
                    <Link
                      href={`/admin/email/inbox?thread=${t.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2.5 hover:bg-canvas"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {t.reference && (
                          <span className="shrink-0 font-mono text-[10px] font-semibold text-muted">
                            {t.reference}
                          </span>
                        )}
                        <span className="truncate text-sm font-medium text-navy">{t.subject}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <LocalTime iso={t.lastMessageAt} className="text-[10px] text-muted" />
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} title={meta.label} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3 text-center">
      <div className="text-lg font-bold text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
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
