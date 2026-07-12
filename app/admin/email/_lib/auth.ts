import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TeamMember } from "@/app/admin/email/_lib/types";

// The Email module's view of the signed-in staffer, adapted from newnei's
// lib/auth. Evercool's admin gate (app/admin/layout.tsx: signed in + active
// profile) already ran before any Email page renders; this resolves who the
// person is for assignment/attribution and the admin flag.

export type SessionProfile = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
};

// Wrapped in React cache() so the auth round-trips run ONCE per request even
// though the sub-bar, the page gate, and the page body each ask for the session.
export const getSessionProfile = cache(async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.is_active) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    name: profile.name ?? null,
    role: profile.role ?? "staff",
  };
});

export interface CurrentUserContext {
  teamMember: TeamMember | null; // who you are, for assignment and attribution
  isAdmin: boolean;
  email: string | null;
}

// Resolves the active staff user from the session/profile. The admin layout
// gate guarantees an active profile exists before this runs; we keep the
// null-safe shape anyway.
export async function getCurrentUserContext(): Promise<CurrentUserContext> {
  const profile = await getSessionProfile();
  if (!profile) {
    return { teamMember: null, isAdmin: false, email: null };
  }
  return {
    teamMember: {
      id: profile.id,
      displayName: profile.name ?? profile.email ?? "Staff",
      role: profile.role,
    },
    isAdmin: profile.role === "admin",
    email: profile.email,
  };
}

// Newnei gated sensitive server actions on 2FA (AAL2) here. Evercool has no
// 2FA wall (yet), so this is a pass-through kept for call-site compatibility;
// wire it to a real check if 2FA is ever enabled.
export function staffActionAal2Ok(_session: SessionProfile): boolean {
  return true;
}

// Evercool's staff roles (profiles.role). Server actions must check role
// membership, not just "signed in": if a customer-facing login ever lands in
// profiles with a different role, it must not be able to mutate inbox data.
export const STAFF_ROLES = ["admin", "owner", "manager", "sales", "technician", "staff"] as const;

export function isStaffRole(role: string | null | undefined): boolean {
  return (STAFF_ROLES as readonly string[]).includes(role ?? "");
}

// Gate a staff-only page or server action. Server Actions are public HTTP
// endpoints, so authorization must live in the action itself, not only in the
// layout gate.
export async function requireStaff(): Promise<SessionProfile> {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (!isStaffRole(session.role)) redirect("/login");
  return session;
}
