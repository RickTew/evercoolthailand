import { NextResponse } from "next/server";
import { createSupabaseServerClient, createAdminClient } from "@/lib/supabase/server";

// POST - staff sends a message to admin
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { message } = await request.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("staff_messages").insert({
    sender_id: user.id,
    sender_name: profile?.name ?? user.email,
    sender_role: profile?.role ?? "staff",
    message: message.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// GET - admin fetches all staff messages
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("staff_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH - admin marks message as read
export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json();
  const admin = createAdminClient();
  await admin.from("staff_messages").update({ is_read: true }).eq("id", id);
  return NextResponse.json({ success: true });
}
