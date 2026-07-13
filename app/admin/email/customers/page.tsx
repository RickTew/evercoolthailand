import Link from "next/link";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { requireCareSection, getMyInboxScope } from "@/app/admin/email/_lib/sections.server";
import { localeLabel } from "@/app/admin/email/_lib/ui";
import { parseSearchMode } from "@/app/admin/email/_lib/inbox-url";
import { LocalTime } from "@/app/admin/email/_components/inbox/LocalTime";
import { CustomerSearch } from "@/app/admin/email/_components/customers/CustomerSearch";
import { SupportSubBar } from "@/app/admin/email/_components/SupportSubBar";

// Customer directory: search every contact by name/email/notes, or by anything
// they wrote in a message ("dig up past history"). Internal, gated like the inbox.
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; qmode?: string }>;
}) {
  // Care section gate: bounce anyone whose access doesn't include Customers to
  // their first allowed section (the admin layout already handled sign-in).
  await requireCareSection("contacts");

  const { q, qmode } = await searchParams;
  const query = (q ?? "").trim();
  // Search scope, the same distinction as the inbox: all / name+email / message text.
  const mode = parseSearchMode(qmode);
  const repo = await getRepo();
  // Per-staff inbox scope: an "assigned"-scoped staffer only sees the contacts who
  // have written to their inboxes (the same slice the inbox enforces). Admins and
  // "all"-scoped staff get null and see the whole directory. The manager's "shared"
  // scope ALSO gets null here (getMyInboxScope cannot express an exclusion):
  // contacts are company-wide, so v1 deliberately skips mirroring the inbox's
  // shared-scope exclusion for the directory.
  const inboxScope = await getMyInboxScope();
  const results = await repo.searchContacts(query, { inboxes: inboxScope, mode });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas">
      <SupportSubBar />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6">
        <CustomerSearch initialQuery={query} initialMode={mode} />

        <p className="mt-2 text-xs text-muted">
          {query === ""
            ? `All customers (${results.length}), A-Z. Type to search by name, email, notes or message text.`
            : `${results.length} ${results.length === 1 ? "match" : "matches"} for "${query}"${
                mode === "contact" ? " (name / email)" : mode === "text" ? " (message text)" : ""
              }.`}
        </p>

        <ul className="mt-4 space-y-2">
          {results.map((r) => (
            <li key={r.contact.id}>
              <Link
                href={`/admin/email/customers/${r.contact.id}`}
                className="block rounded-lg border border-line bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                      {r.contact.fullName.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{r.contact.fullName}</p>
                      <p className="truncate text-xs text-muted">{r.contact.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.segments.map((s) => (
                      <span
                        key={s.id}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: s.color }}
                      >
                        {s.name}
                      </span>
                    ))}
                    <span className="text-[11px] text-muted">
                      {r.threadCount} {r.threadCount === 1 ? "ticket" : "tickets"}
                    </span>
                  </div>
                </div>
                {r.matchedSnippet && (
                  <p className="mt-2 rounded-md bg-canvas px-2.5 py-1.5 text-[11px] text-muted">
                    &ldquo;{r.matchedSnippet}&rdquo;
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
                  <span>{localeLabel(r.contact.locale)}</span>
                  {r.lastContactAt && <span>Last contact <LocalTime iso={r.lastContactAt} /></span>}
                </div>
              </Link>
            </li>
          ))}
          {results.length === 0 && (
            <li className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
              No customers match that search.
            </li>
          )}
        </ul>
        </div>
      </main>
    </div>
  );
}
