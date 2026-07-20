import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Infrastructure health alarm. Born from the July 2026 outage: a malformed
// database key silently broke every server-side query for four days because
// pages looked fine (cached) and failing queries rendered as "empty". This
// endpoint exercises the REAL failure paths with the REAL keys, uncached, and
// emails Rick when one breaks. A Vercel Cron calls it every 10 minutes (see
// vercel.json); it is also safe to hit by hand or from an uptime monitor.
//
// Alert cooldown without a database: the alert email is sent with a Resend
// idempotency key derived from the current 3-hour window, so a continuous
// outage produces at most one email per 3 hours (Resend dedupes repeat sends
// with the same key), and the cooldown survives even when the database is the
// thing that is down. Resend's key is independent of the database key, which
// is exactly why the alarm still fires for a database outage.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALERT_TO = "info@ricktew.com";

type CheckResult = { ok: boolean; error?: string };

async function checkServiceKey(): Promise<CheckResult> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { error } = await db
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkAnonKey(): Promise<CheckResult> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    // RLS may return zero rows to anon; only a rejected key errors here.
    const { error } = await db
      .from("services")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkResendKey(): Promise<CheckResult> {
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `Resend API returned ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET() {
  const [dbService, dbAnon, resendKey] = await Promise.all([
    checkServiceKey(),
    checkAnonKey(),
    checkResendKey(),
  ]);
  const checks = { dbService, dbAnon, resendKey };
  const ok = dbService.ok && dbAnon.ok && resendKey.ok;

  if (!ok) {
    const failed = Object.entries(checks)
      .filter(([, c]) => !c.ok)
      .map(([name, c]) => `${name}: ${c.error ?? "failed"}`);
    console.error("[health] FAILING:", failed.join(" | "));

    // One alert per 3-hour window (idempotency key = the window).
    const now = new Date();
    const windowKey = `${now.toISOString().slice(0, 10)}-w${Math.floor(now.getUTCHours() / 3)}`;
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send(
        {
          from: "Evercool Thailand <hello@evercoolthailand.com>",
          to: ALERT_TO,
          subject: `ALERT: evercoolthailand.com health check failing (${failed.length} check${failed.length > 1 ? "s" : ""})`,
          text: [
            `The evercoolthailand.com health check is FAILING as of ${now.toISOString()}.`,
            "",
            ...failed.map((f) => `- ${f}`),
            "",
            "What this means: if dbService is failing, the CRM inbox, inbound email,",
            "and the public site's database content are all broken (same key).",
            "Check https://evercoolthailand.com/api/health for live status.",
            "You will get at most one of these emails every 3 hours while it stays down.",
          ].join("\n"),
        },
        { idempotencyKey: `health-alert-${windowKey}` },
      );
    } catch (err) {
      // Resend itself down or key dead: nothing left to alert with; the
      // console.error above still lands in Vercel's runtime error view.
      console.error("[health] could not send alert email:", err);
    }
  }

  return NextResponse.json(
    { ok, checks, at: new Date().toISOString() },
    { status: ok ? 200 : 503 },
  );
}
