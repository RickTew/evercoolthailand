import { NextResponse } from "next/server";
import { createAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      lang?: string;
    };

    const { endpoint, keys, lang } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Get current user if signed in (optional - anonymous subscriptions allowed)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = createAdminClient();
    await admin.from("push_subscriptions").upsert({
      customer_id: user?.id ?? null,
      email: user?.email ?? null,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      lang: lang ?? "en",
    }, { onConflict: "endpoint" });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json() as { endpoint: string };
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    const admin = createAdminClient();
    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
