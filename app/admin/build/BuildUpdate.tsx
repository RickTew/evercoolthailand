// A point-in-time update under Rick's Proof: where the whole build is right
// now, in plain English. The counts come from the live status board, so there
// is no fixed total to drift on. Ported from the newnei build page.
export function BuildUpdate({
  live,
  building,
  planned,
  asOf,
}: {
  live: number;
  building: number;
  planned: number;
  asOf: string;
}) {
  const known = live + building + planned || 1;

  return (
    <div className="mb-4 rounded-2xl border border-ec-teal/25 bg-ec-teal/[0.05] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-bold text-ec-text">Where the build is now</div>
        {asOf && <div className="text-[11px] text-ec-text-muted">as of {asOf}</div>}
      </div>

      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-ec-bg ring-1 ring-ec-border">
        <div className="bg-green-500" style={{ width: `${(live / known) * 100}%` }} />
        <div className="bg-amber-500" style={{ width: `${(building / known) * 100}%` }} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ec-text-muted">
        <span>
          <b className="text-green-500">{live}</b> live
        </span>
        <span>
          <b className="text-amber-500">{building}</b> building
        </span>
        <span>
          <b>{planned}</b> planned
        </span>
        <span className="ml-auto font-semibold text-ec-text">most of the portal is live</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ec-text-muted">
        This did not start with an app. It started with building and hosting the Evercool
        websites the old way, then managing the hosting and the mailboxes for years. Then
        everything was rebuilt from zero: a new backend, a new public website with the
        quote builder in Thai and English, the EQ Tracker app, then the Service &amp;
        Maintenance app, and then both of those built AGAIN so they live inside this one
        portal with one login. Email was cut over from the old mailboxes to the new
        system with spam defense, and a full CRM now sits on top: shared inbox, one
        contact record, labels, saved replies, drafts. Every piece of that is in the log
        below, with every individual change inside it.
      </p>
    </div>
  );
}
