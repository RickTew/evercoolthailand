import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { portalPathAllowed } from "@/lib/portalTabs";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Check admin/staff profile — must exist and be active. portal_tabs comes
  // from this same row (migration 0009 is applied), so a database error leaves
  // profile null and bounces to login rather than silently dropping the
  // per-user tab restriction the way a separate best-effort query did.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, portal_tabs")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Tab gate: the role sets the widest reachable set, the per-user
  // profiles.portal_tabs list narrows it further. Anything else bounces to the
  // dashboard, so a typed URL cannot reach a tab the nav does not offer.
  if (profile.role !== "admin") {
    const portalTabs = profile.portal_tabs as string[] | null;
    if (!portalPathAllowed(pathname, profile.role, portalTabs)) {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = "/admin/dashboard";
      return NextResponse.redirect(dashUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
