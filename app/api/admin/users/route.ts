import { NextResponse } from "next/server";
import { createSupabaseServerClient, createAdminClient } from "@/lib/supabase/server";

// User management is open to admin AND manager (Rick, 15 Jul: Wanrawee hires
// and sets up new people). A manager's power stops at the admin tier: they can
// never create an admin, grant the admin role, or touch an admin's account.
// Server Actions/route handlers are public HTTP endpoints, so every rule is
// enforced here, not just hidden in the UI.
const KNOWN_ROLES = ["admin", "owner", "manager", "sales", "technician", "staff"] as const;
type KnownRole = (typeof KNOWN_ROLES)[number];

// The tier a manager may never create, grant, or touch. "owner" counts: it
// outranks manager just as "admin" does, so every admin-tier rule below tests
// membership of this set rather than the string "admin".
const ADMIN_TIER = ["admin", "owner"] as const;
function isAdminTier(role: string | null | undefined): boolean {
  return role != null && (ADMIN_TIER as readonly string[]).includes(role);
}

async function requireUserManager(): Promise<{ id: string; role: "admin" | "manager" } | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // is_active is re-checked here, not just in the proxy: the proxy only covers
  // /admin/* page routes, so a deactivated account holding a live session cookie
  // could otherwise still call this endpoint directly.
  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  if (profile?.is_active === false) return null;
  if (profile?.role !== "admin" && profile?.role !== "manager") return null;
  return { id: user.id, role: profile.role };
}

// The target's current role, for the manager-cannot-touch-admin-tier rule.
async function targetRole(id: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", id).maybeSingle();
  return data?.role ?? null;
}

// GET - list all staff profiles
export async function GET() {
  const caller = await requireUserManager();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, name, email, role, department, is_active, created_at, last_login")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - create a new user
export async function POST(request: Request) {
  const caller = await requireUserManager();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { name, email, password, role, department } = await request.json();
  if (!email || !password || !role) {
    return NextResponse.json({ error: "Email, password and role are required" }, { status: 400 });
  }
  // Only known roles may ever reach the database (the type is erased at runtime).
  if (!KNOWN_ROLES.includes(role as KnownRole)) {
    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  }
  if (caller.role === "manager" && isAdminTier(role)) {
    return NextResponse.json({ error: "Only an admin can create an admin or owner account." }, { status: 403 });
  }

  const admin = createAdminClient();

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Failed to create user" }, { status: 500 });
  }

  // Create profile
  const { error: profileError } = await admin.from("profiles").insert({
    id: authData.user.id,
    name,
    email,
    role,
    department: department || null,
    is_active: true,
  });

  if (profileError) {
    // Rollback auth user
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // New hire's mailbox, set up on the spot: when the login email is their
  // @evercoolthailand.com address, it becomes their confirmed personal address
  // and their starting CRM scope (own mailbox only, Inbox + Settings), matching
  // how the existing staff are set up. Receiving needs no provisioning (inbound
  // is domain-wide), and replies/Compose go out From this address. The CRM
  // access panel can widen it any time. Admins are never scoped, so skip them.
  const addr = String(email).trim().toLowerCase();
  if (role !== "admin" && /@evercoolthailand\.com$/.test(addr)) {
    await admin.from("support_staff_prefs").upsert({
      profile_id: authData.user.id,
      personal_address: addr,
      inbox_scope: "assigned",
      assigned_inboxes: [addr],
      care_sections: ["inbox", "settings"],
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true, id: authData.user.id });
}

// PATCH - update role / active status / department
export async function PATCH(request: Request) {
  const caller = await requireUserManager();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id, role, is_active, department, name } = await request.json();
  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
  if (role !== undefined && !KNOWN_ROLES.includes(role as KnownRole)) {
    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  }
  // Nobody changes their own role, admin included: self-promotion is the one
  // escalation no tier check can catch, since the caller already passes them all.
  if (role !== undefined && caller.id === id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 403 });
  }
  if (caller.role === "manager") {
    if (isAdminTier(role)) {
      return NextResponse.json({ error: "Only an admin can grant the admin or owner role." }, { status: 403 });
    }
    if (isAdminTier(await targetRole(id))) {
      return NextResponse.json({ error: "Only an admin can change an admin or owner account." }, { status: 403 });
    }
  }

  const admin = createAdminClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (role !== undefined) updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;
  if (department !== undefined) updates.department = department;
  if (name !== undefined) updates.name = name;

  const { error } = await admin.from("profiles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE - deactivate (soft delete) a user
export async function DELETE(request: Request) {
  const caller = await requireUserManager();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  // Prevent self-deletion
  if (caller.id === id) return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
  if (caller.role === "manager" && isAdminTier(await targetRole(id))) {
    return NextResponse.json({ error: "Only an admin can deactivate an admin or owner." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
