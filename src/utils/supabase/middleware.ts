import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  // 1. Lire le cookie local (ne nécessite pas de réseau)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 2. Tentative de vérification serveur, avec tolérance offline
  try {
    const { error } = await supabase.auth.getUser();
    if (error) throw error;
  } catch (error: any) {
    // Si hors-ligne MAIS qu'une session locale existe : on tolère
    if (session && error?.message?.includes("fetch")) {
      // Session locale valide, on continue sans vérification serveur
    } else if (session && error?.message?.includes("NetworkError")) {
      // Même chose pour NetworkError
    } else {
      // Erreur réelle ou pas de session → redirection vers login (sauf routes publiques)
      const pathname = request.nextUrl.pathname;
      const isPublicRoute =
        pathname === "/login" ||
        pathname === "/onboarding" ||
        pathname === "/offline" ||
        pathname.startsWith("/api/health");

      if (!isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }
  }

  // 3. Protection du cache
  supabaseResponse.headers.set(
    "Cache-Control",
    "private, no-store"
  );

  return supabaseResponse;
}