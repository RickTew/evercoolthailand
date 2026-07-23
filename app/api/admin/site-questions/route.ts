import { NextResponse } from "next/server";
import { createAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_QUESTIONS } from "@/lib/dashboard/siteQuestions";

export const dynamic = "force-dynamic";

// Where staff answers are delivered; Rick implements them from there.
const ANSWERS_TO = "info@ricktew.com";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const answeredBy = typeof body?.answeredBy === "string" ? body.answeredBy.slice(0, 100) : "";
  const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};

  const answered = SITE_QUESTIONS.filter(
    (q) => typeof answers[q.id] === "string" && answers[q.id].trim() !== ""
  );
  if (!answeredBy.trim() || answered.length === 0) {
    return NextResponse.json({ error: "No answers provided" }, { status: 400 });
  }

  try {
    const { sendEmail, escapeHtml } = await import("@/lib/email/send");
    await sendEmail({
      to: ANSWERS_TO,
      subject: `Website questions: ${answered.length} answer${answered.length === 1 ? "" : "s"} from ${answeredBy}`,
      html: `
        <h2>Website question answers</h2>
        <p><strong>From:</strong> ${escapeHtml(answeredBy)} (${escapeHtml(user.email ?? "no email")})</p>
        ${answered
          .map(
            (q) => `
          <hr>
          <p><strong>[${escapeHtml(q.id)}]</strong> ${escapeHtml(q.en)}</p>
          <p style="background:#f8fafc;padding:12px;border-radius:8px;white-space:pre-wrap;">${escapeHtml(
            String(answers[q.id]).slice(0, 5000)
          )}</p>`
          )
          .join("")}
      `,
    });
  } catch (err) {
    console.error("Site questions email failed:", err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
