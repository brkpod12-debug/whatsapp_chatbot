import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts`.
 *
 * Two jobs, both only for the desk: refresh the Supabase session cookie (a
 * Server Component render cannot write cookies, so without this the owner is
 * silently logged out when the access token expires), and bounce anonymous
 * requests to the login page.
 *
 * The matcher deliberately excludes everything else. The public marketing site
 * is statically prerendered and must not pay for this.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalidates against Supabase and rotates the cookie. Do not
  // swap it for getSession(), which trusts whatever the cookie claims.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && pathname.startsWith("/desk")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (user && pathname === "/login") {
    const desk = request.nextUrl.clone();
    desk.pathname = "/desk";
    desk.search = "";
    return NextResponse.redirect(desk);
  }

  return response;
}

export const config = {
  matcher: ["/desk/:path*", "/login"],
};
