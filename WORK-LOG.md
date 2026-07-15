# Work Log

Every working session on this project gets one entry: what was done, the
commits, the time spent, and the tokens used. Token and precise-time capture is
not instrumented yet (that recording system is the next session's build); until
then entries carry what git and the conversation can prove, and estimated
fields are marked as estimates.

Format per entry: date, session summary, table of changes (commit, time,
files/lines, what), duration, tokens, notes.

Each entry is also mirrored into lib/dashboard/buildLog.ts (newest first), which
feeds the staff-facing Build page at /admin/build (Rick's Proof in the Pudding).

---

## 2026-07-15 - Build page + Rick's Proof ported from newnei, full history researched

Session window: afternoon session (Asia/Bangkok). Trigger: Rick's request to
port the newnei Build page and Rick's Proof to the Evercool portal, populated
with ALL the old work (pre-app websites, hosting, both apps, consolidation).

Work:
- Researched the complete work history with three parallel agents: the 122
  commits of this repo, the 36 commits of eq-tracker, and the non-git record
  (WORK-LOG.md, plan docs, evercoolthailandbuild.rtf, reference/, memory,
  Resend/A2 Hosting facts). Merged, deduplicated and dated: 41 build entries,
  331 individual changes, ~185 estimated hours, from the 2023 WordPress site
  on A2 Hosting to today.
- lib/dashboard/buildLog.ts: the log data + BUILD_TODO (types ported from
  newnei; tokensK optional and only shown where actually logged, never
  invented).
- lib/dashboard/buildPlan.ts: Live board (12 sections mirroring the admin
  nav), Building (4), Planned (12), standing cards, layered stack, honest
  completion meter.
- app/admin/build/: page.tsx + Collapsible + BuildLogList + BuildUpdate,
  restyled to the ec-* palette. Nav gains a "Build" tab for all staff roles.
  Not reachable or linked from the public site (auth wall bounces to /login,
  verified).

Duration: estimate ~1h wall clock (no timer instrumentation yet).
Tokens: not fully recorded; the three research agents alone logged ~175k.
Verification state: tsc + eslint clean, next build green, /admin/build present
in the route list, anonymous request 307s to /login, public home 200s. NOT yet
verified: the page rendered in a signed-in staff session on the deployed site.

Also this session (infra, outside the repo):
- Hosting notification emails: the per-build failure email turned OFF in the
  hosting dashboard's notification settings (success emails were already off;
  in-dashboard notifications kept). Exact locations recorded privately.
- EQ Tracker retired from service: parity checklist passed (code folder = repo
  = deployed cdf68b9, data all in the shared database, settings are the shared
  credentials only, no schedules/domains/references), then the old deployment
  PAUSED via the hosting API. Old URL 503s, portal unaffected. Unpause is one
  API call (details recorded privately). Delete deferred; code kept for a
  possible future EQ tracker product.

Feedback round 1 (Rick, same day, from live screenshots; commit a976ccf):
removed the "Until truly done" meter (we do not know the true total), removed
the "Still to be done" board from Rick's Proof, removed the old-host
cancellation / EQ Tracker retirement / consolidation phase 2 tiles from
Planned, Rick's Proof intro made full width with the AI mention dropped, and
ALL stack/vendor names scrubbed from everything the page renders (hosting,
mail, database, framework providers described generically). STANDING RULE for
future log entries: no vendor or stack names in build-log text.

## 2026-07-15 - Staff launch-day feedback + Draft/Knowledge port

Session window: approx 11:05 - 12:30 (Asia/Bangkok). Trigger: Wanrawee's LINE
reports from first real CRM use, then Rick's report that the draft button and
knowledge base from newnei Care were missing.

| Commit | Pushed | Size | What |
| --- | --- | --- | --- |
| 5d743f3 | 11:18 | 4 files, +50/-12 | Outgoing email From line now carries the sender's name ("Name, EVERCOOL <addr>"; Compose uses a confirmed personal address when set). "Waiting" status relabeled "Waiting for customer" everywhere + guide wording. |
| 2bd5800 | 11:28 | 1 file, +31/-2 | Guide: bilingual "Who can see which email?" section (admin sees all, manager all company mail, staff their own address only; assignment does not override access). |
| bed3b05 | 11:56 | 16 files, +1154/-1 | Draft button + Knowledge tab ported from newnei Care (free template engine, EN+TH: retrieval with Thai substring + topic bridge, warm topic-aware openers, QC heuristics, learning loop send -> review queue -> promote to verified article). Test Lab + guide teach the flow. No schema change (tables existed since migration 0001). |

Also this session, outside the repo:
- Verified in prod data + live DNS: Resend inbound is a domain-wide catch-all
  (mail to typo/unknown/ex-staff addresses still lands in the CRM); staff scope
  confirmed per person in support_staff_prefs.
- Global Claude Code settings: allow rules for git add/commit/push (force push
  still prompts).

Duration: ~1h 25m wall clock across three tasks (estimate from message and
commit timestamps; no timer instrumentation yet).
Tokens: not recorded (instrumentation lands next session).
Verification state: tsc + eslint clean, next build green (--webpack), draft
engine exercised with EN/TH/holding/QC test cases via tsx. NOT yet verified on
the deployed site: From name on a real send, Draft button click-through,
Knowledge promote flow.
