# Work Log

Every working session on this project gets one entry: what was done, the
commits, the time spent, and the tokens used. Token and precise-time capture is
not instrumented yet (that recording system is the next session's build); until
then entries carry what git and the conversation can prove, and estimated
fields are marked as estimates.

Format per entry: date, session summary, table of changes (commit, time,
files/lines, what), duration, tokens, notes.

---

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
