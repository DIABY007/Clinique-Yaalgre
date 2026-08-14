import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// ── LISTER UTILISATEURS ──
export async function fetchUsers() {
  const { data, error } = await supabase
    .from("utilisateur")
    .select("id_utilisateur, nom, role, est_actif")
    .order("nom");

  if (error) throw error;
  return data ?? [];
}

// ── CRÉER UTILISATEUR ──
export async function createUser(input: {
  nom: string;
  role: string;
  code_pin_hash: string;
}) {
  const { data, error } = await supabase
    .from("utilisateur")
    .insert({
      nom: input.nom,
      role: input.role,
      code_pin_hash: input.code_pin_hash,
      est_actif: true,
    })
    .select("id_utilisateur, nom, role, est_actif")
    .single();

  if (error) throw error;
  return data;
}

// ── DÉSACTIVER / RÉACTIVER ──
export async function toggleUserStatus(id: string, actif: boolean) {
  const { error } = await supabase
    .from("utilisateur")
    .update({ est_actif: actif })
    .eq("id_utilisateur", id);

  if (error) throw error;
}