/**
 * Client Supabase lazy — évite les erreurs build Vercel.
 * Le client n'est créé qu'à la première utilisation (runtime navigateur).
 */
let _supabase: Awaited<ReturnType<typeof createLazyClient>> | null = null;

async function createLazyClient() {
  const { createClient } = await import("@/utils/supabase/client");
  return createClient();
}

export async function getSupabase() {
  if (!_supabase) {
    _supabase = await createLazyClient();
  }
  return _supabase;
}