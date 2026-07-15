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

  // Check admin/staff profile — must exist and be active
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Per-user portal-tab restriction (profiles.portal_tabs): a person whose
  // list is set can only open the ticked tabs; everything else bounces to the
  // dashboard. Queried separately and best-effort so the portal keeps working
  // if the column does not exist yet (migration 0009 pending): an error here
  // simply means "no restriction".
  if (profile.role !== "admin") {
    const { data: tabsRow, error: tabsError } = await supabase
      .from("profiles")
      .select("portal_tabs")
      .eq("id", user.id)
      .maybeSingle();
    const portalTabs = tabsError ? null : (tabsRow?.portal_tabs as string[] | null);
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
