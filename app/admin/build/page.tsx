import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LIVE_SECTIONS,
  BUILDING,
  PLANNED,
  STANDING_CARDS,
  buildCounts,
  buildLayers,
  buildStatus,
} from "@/lib/dashboard/buildPlan";
import { BUILD_LOG } from "@/lib/dashboard/buildLog";
import { BuildLogList } from "./BuildLogList";
import { BuildUpdate } from "./BuildUpdate";
import { Collapsible } from "./Collapsible";

export const metadata: Metadata = { title: "The Build | Evercool Portal" };
export const dynamic = "force-dynamic";

// Emoji per live section, so the board reads at a glance. Presentation only.
const SECTION_EMOJI: Record<string, string> = {
  "Public website": "🌐",
  CRM: "💬",
  Quotes: "🧾",
  Bookings: "📅",
  Customers: "👥",
  Projects: "🎯",
  Service: "🔧",
  Team: "🤝",
  Reports: "📈",
  Users: "🔑",
  "Website content": "🖼️",
  Dashboard: "📊",
};

// The build page: what exists, what it took, and the receipts. Staff only
// (behind the admin layout's auth wall); the public site never links here.
// Ported from the newnei build page, adapted to Evercool.
export default async function BuildPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const counts = buildCounts();
  const layers = buildLayers();
  const status = buildStatus();
  const totalHours = BUILD_LOG.reduce((s, e) => s + e.hours, 0);
  const loggedTokensK = BUILD_LOG.reduce((s, e) => s + (e.tokensK ?? 0), 0);
  const totalBuilds = BUILD_LOG.length;
  const totalEdits = BUILD_LOG.reduce((s, e) => s + e.changes.length, 0);

  return (
    <div className="space-y-6">
      {/* Hero: the true depth of the build in one line, computed from the real
          receipts (BUILD_LOG). A lot has been created. */}
      <div className="overflow-hidden rounded-3xl bg-ec-navy p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            🏗️
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">The build</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/80">
              Everything Evercool runs on today: the website, this portal, the CRM, and
              the email system. Built piece by piece, and here is the whole record of
              what that actually took.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/10 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-4xl font-bold leading-none tabular-nums sm:text-5xl">
              {totalEdits.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-white/85 sm:text-base">
              edits, fixes and changes shipped, across {totalBuilds} logged builds and ~
              {Math.round(totalHours)} hours (estimated).
            </span>
          </div>
          <p className="mt-2 text-xs text-white/60">
            It looks like a few minutes here and there. It was not. Here is the whole
            build at a glance, broadest at the top, drilling down to every individual
            change.
          </p>
        </div>

        {/* The layered stack: the same work seen at every altitude. */}
        <div className="mt-4 space-y-2">
          {layers.map((l) => {
            const nested = l.depth === 1;
            return (
              <div
                key={l.key}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  nested ? "ml-4 bg-white/[0.06] sm:ml-8" : "bg-white/10"
                }`}
              >
                {nested && (
                  <span className="-mr-1 select-none text-base text-white/40" aria-hidden>
                    ↳
                  </span>
                )}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                  {l.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold leading-none tabular-nums sm:text-[1.65rem]">
                      {l.count.toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold text-white/90">{l.unit}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-white/55">{l.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status at a glance: done, in flight, queued, and on the radar. */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { n: status.live, label: "live", dot: "bg-green-500", sub: "running today" },
            { n: status.building, label: "building", dot: "bg-amber-500", sub: "in flight" },
            { n: status.todo, label: "to do", dot: "bg-ec-teal", sub: "queued next" },
            { n: status.ideas, label: "ideas", dot: "bg-purple-400", sub: "on the radar" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 p-3.5">
              <div className="text-2xl font-bold leading-none tabular-nums">{s.n}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/70">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {s.label}
              </div>
              <div className="mt-0.5 text-[11px] text-white/45">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Where the build is: Live / Building / Planned, colour-blocked. */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-green-500/25 bg-green-500/[0.04] p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-green-500">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              Live
            </h2>
            <span className="text-xs font-semibold text-green-500">{counts.live} shipped</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LIVE_SECTIONS.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="group flex items-start gap-3 rounded-2xl border border-ec-border bg-ec-card p-4 transition hover:border-ec-teal/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ec-teal/10 text-lg">
                  {SECTION_EMOJI[s.name] ?? "✅"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ec-text">{s.name}</div>
                  <div className="mt-0.5 text-xs text-ec-text-muted">{s.what}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/[0.04] p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-500">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Building now
            </h2>
            <span className="text-xs font-semibold text-amber-500">{BUILDING.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BUILDING.map((b) => (
              <div key={b.name} className="flex items-start gap-3 rounded-2xl border border-ec-border bg-ec-card p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-lg">🔨</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ec-text">{b.name}</div>
                  <div className="mt-0.5 text-xs text-ec-text-muted">{b.gloss}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-ec-border bg-ec-bg/60 p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ec-text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-ec-text-muted/50" />
              Planned, that we know of
            </h2>
            <span className="text-xs font-semibold text-ec-text-muted">{PLANNED.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PLANNED.map((p) => (
              <div key={p.name} className="flex items-start gap-3 rounded-2xl border border-ec-border bg-ec-card p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ec-text-muted/10 text-lg">🗓️</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ec-text">{p.name}</div>
                  <div className="mt-0.5 text-xs text-ec-text-muted">{p.gloss}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rick's Proof in the Pudding: collapsed by default so the long log does
          not take up page space; opens with a click. */}
      <Collapsible title="Rick's Proof in the Pudding 🍮" right={`${BUILD_LOG.length} shipped`}>
        <p className="mb-3 text-sm text-ec-text-muted">
          The receipts. Every late night, every fix that finally made things work, in
          one place. The team does not see the hours behind a thing that &ldquo;just
          works&rdquo;, so here they are: from the original websites and years of
          hosting management, through the new foundations, the new website, EQ Tracker,
          Service &amp; Maintenance, the consolidation into one portal, the email
          cutover, and the CRM.
        </p>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-ec-border bg-ec-card p-4">
            <div className="text-xs text-ec-text-muted">Things shipped</div>
            <div className="text-xl font-bold text-ec-text">{BUILD_LOG.length}</div>
          </div>
          <div className="rounded-2xl border border-ec-border bg-ec-card p-4">
            <div className="text-xs text-ec-text-muted">Hours at it (est.)</div>
            <div className="text-xl font-bold text-ec-text">~{Math.round(totalHours)}h</div>
          </div>
          <div className="rounded-2xl border border-ec-border bg-ec-card p-4">
            <div className="text-xs text-ec-text-muted">Tokens (where logged)</div>
            <div className="text-xl font-bold text-ec-text">
              {loggedTokensK > 0 ? `~${(loggedTokensK / 1000).toFixed(1)}M` : "starts 15 Jul"}
            </div>
          </div>
        </div>

        <p className="mb-4 text-xs text-ec-text-muted">
          Estimated, and honest: per-session logging started 2026-07-15 (WORK-LOG.md).
          Everything earlier is reconstructed from the change histories of this portal
          and the EQ Tracker app, plus dated backfill for the pre-app era (the original
          websites and the old hosting years). Hours are estimates; token counts appear
          only where they were actually logged, never invented.
        </p>

        <BuildUpdate
          live={counts.live}
          building={counts.building}
          planned={counts.planned}
          asOf={BUILD_LOG[0]?.date ?? ""}
        />

        <p className="mb-3 text-xs text-ec-text-muted">
          What got built and fixed, newest first. Open any item to see every individual
          edit, fix, and change in it.
        </p>
        <BuildLogList entries={BUILD_LOG} />
      </Collapsible>

      {/* Standing cards */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-sm font-bold text-ec-text">Standing work</div>
          <div className="text-xs text-ec-text-muted">cross-cutting, every build</div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STANDING_CARDS.map((s) => (
            <div key={s.name} className="rounded-2xl border border-ec-border bg-ec-card p-4">
              <div className="text-sm font-bold text-ec-text">{s.name}</div>
              <div className="mt-0.5 text-xs text-ec-text-muted">{s.gloss}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-ec-text-muted">
        The goal is one connected system for Evercool: website, portal, CRM and email in
        one place. The Live list above mirrors the admin nav, so it stays current as
        sections ship.
      </p>
    </div>
  );
}
