#!/usr/bin/env node
// Work-recording instrumentation (standing rule since 2026-07-15: every change
// gets logged with real work, time, and token numbers; estimates must be
// marked, token counts never invented).
//
// Two commands:
//   record   Hook mode. Reads the hook payload JSON from stdin, parses the
//            session transcript it points at, and upserts one row for the
//            session into .worklog/sessions.jsonl. Runs after every turn, so
//            the tally is always current even if the session dies abruptly.
//   report   Session-wrap mode. Prints per-session rows and day totals with
//            the real numbers, ready to paste into WORK-LOG.md.
//
// Token numbers come from the per-response usage blocks in the transcript.
// A response can appear several times in the file (once per content block),
// so usage is deduped by response id before summing. Subagent turns live in
// the same transcript and are counted; work delegated to other machines or
// cloud runs is not visible here and must be noted by hand.

import fs from "node:fs";
import path from "node:path";

const TZ = "Asia/Bangkok";
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const outDir = path.join(repoRoot, ".worklog");
const outFile = path.join(outDir, "sessions.jsonl");

function bangkokDate(iso) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function tally(transcriptPath) {
  const usageById = new Map();
  const models = new Set();
  let first = null;
  let last = null;
  let userTurns = 0;
  const raw = fs.readFileSync(transcriptPath, "utf8");
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.timestamp) {
      if (!first) first = o.timestamp;
      last = o.timestamp;
    }
    if (o.type === "user" && !o.isSidechain) userTurns++;
    if (o.type === "assistant" && o.message && o.message.usage && o.message.id) {
      usageById.set(o.message.id, o.message.usage);
      if (o.message.model) models.add(o.message.model);
    }
  }
  const t = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  for (const u of usageById.values()) {
    t.input += u.input_tokens || 0;
    t.output += u.output_tokens || 0;
    t.cacheRead += u.cache_read_input_tokens || 0;
    t.cacheWrite += u.cache_creation_input_tokens || 0;
  }
  const wallMinutes = first && last ? Math.round((new Date(last) - new Date(first)) / 60000) : 0;
  return {
    startedAt: first,
    endedAt: last,
    date: first ? bangkokDate(first) : null,
    wallMinutes,
    userTurns,
    apiCalls: usageById.size,
    models: [...models].sort(),
    tokens: { ...t, total: t.input + t.output + t.cacheRead + t.cacheWrite },
  };
}

function loadRows() {
  if (!fs.existsSync(outFile)) return [];
  return fs.readFileSync(outFile, "utf8").split("\n").filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function saveRows(rows) {
  fs.mkdirSync(outDir, { recursive: true });
  rows.sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  fs.writeFileSync(outFile, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
}

function record() {
  let input = "";
  process.stdin.on("data", (d) => (input += d));
  process.stdin.on("end", () => {
    try {
      const hook = JSON.parse(input);
      const transcriptPath = hook.transcript_path;
      const sessionId = hook.session_id;
      if (!transcriptPath || !sessionId || !fs.existsSync(transcriptPath)) process.exit(0);
      const row = { sessionId, ...tally(transcriptPath) };
      const rows = loadRows().filter((r) => r.sessionId !== sessionId);
      rows.push(row);
      saveRows(rows);
    } catch {
      // Recording must never break the session; stay silent and exit clean.
    }
    process.exit(0);
  });
}

function fmtK(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  return n >= 1000 ? Math.round(n / 1000) + "k" : String(n);
}

function fmtDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${String(m).padStart(2, "0")}m` : `${m}min`;
}

function report(args) {
  const all = args.includes("--all");
  const dateFlag = args.indexOf("--date");
  const today = bangkokDate(new Date().toISOString());
  const date = dateFlag >= 0 ? args[dateFlag + 1] : today;
  let rows = loadRows();
  if (!all) rows = rows.filter((r) => r.date === date);
  if (!rows.length) {
    console.log(all ? "No sessions recorded yet." : `No sessions recorded for ${date} (${TZ}).`);
    return;
  }
  const sum = { wallMinutes: 0, apiCalls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
  for (const r of rows) {
    const start = r.startedAt ? r.startedAt.slice(11, 16) : "?";
    const end = r.endedAt ? r.endedAt.slice(11, 16) : "?";
    console.log(
      `${r.date}  ${r.sessionId.slice(0, 8)}  ${start}-${end} UTC  ${fmtDuration(r.wallMinutes)}  ` +
      `${r.userTurns} turns, ${r.apiCalls} calls  out ${fmtK(r.tokens.output)}, in ${fmtK(r.tokens.input)}, ` +
      `cache r ${fmtK(r.tokens.cacheRead)} / w ${fmtK(r.tokens.cacheWrite)}  total ${fmtK(r.tokens.total)}`
    );
    sum.wallMinutes += r.wallMinutes;
    sum.apiCalls += r.apiCalls;
    sum.input += r.tokens.input;
    sum.output += r.tokens.output;
    sum.cacheRead += r.tokens.cacheRead;
    sum.cacheWrite += r.tokens.cacheWrite;
    sum.total += r.tokens.total;
  }
  console.log("");
  const label = all ? "all recorded sessions" : `${date} (${TZ} calendar day, times shown UTC)`;
  console.log(`Totals for ${label}: ${rows.length} session(s), ${fmtDuration(sum.wallMinutes)} wall clock (sessions may overlap), ${sum.apiCalls} API calls`);
  console.log(`Tokens: output ${fmtK(sum.output)}, fresh input ${fmtK(sum.input)}, cache read ${fmtK(sum.cacheRead)}, cache write ${fmtK(sum.cacheWrite)}, grand total ${fmtK(sum.total)}`);
  console.log("");
  console.log("WORK-LOG.md line (measured, not estimated):");
  console.log(`Duration: ${fmtDuration(sum.wallMinutes)} (measured wall clock). Tokens: ${fmtK(sum.total)} total (${fmtK(sum.output)} output + ${fmtK(sum.input)} fresh input + ${fmtK(sum.cacheRead + sum.cacheWrite)} cache), measured.`);
}

const cmd = process.argv[2];
if (cmd === "record") record();
else if (cmd === "report") report(process.argv.slice(3));
else {
  console.log("Usage: node scripts/worklog/worklog.mjs record|report [--date YYYY-MM-DD | --all]");
  process.exit(1);
}
