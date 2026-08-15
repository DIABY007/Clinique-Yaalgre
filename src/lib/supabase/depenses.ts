import { getSupabase } from "./client-lazy";

const CATEGORIES = [
  "COTISATION_CLINIQUE",
  "COTISATION_MEDECIN",
  "ACHAT_ARTHESOUN",
  "AUTRE",
] as const;

export type CategorieDepense = (typeof CATEGORIES)[number];

export const CATEGORIES_LABELS: Record<CategorieDepense, string> = {
  COTISATION_CLINIQUE: "Cotisation clinique",
  COTISATION_MEDECIN: "Cotisation médecin",
  ACHAT_ARTHESOUN: "Achat Arthesoun",
  AUTRE: "Autre",
};

// ── LISTER ──
export async function fetchDepenses(page = 0, pageSize = 50) {
  const supabase = await getSupabase();
  const { data, count, error } = await supabase
    .from("depense")
    .select("*", { count: "exact" })
    .order("date_depense", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

// ── CRÉER ──
export async function createDepense(input: {
  id_utilisateur: string;
  categorie: CategorieDepense;
  montant: number;
  description_autre?: string;
}) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("depense")
    .insert({
      id_utilisateur: input.id_utilisateur,
      categorie: input.categorie,
      montant: input.montant,
      description_autre: input.description_autre ?? "",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── CATALOGUE DÉPENSES (dépenses récurrentes) ──
export async function fetchCatalogueDepenses() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("catalogue_depense")
    .select("*")
    .order("libelle");

  if (error) throw error;
  return data ?? [];
}

export async function createCatalogueDepense(input: {
  libelle: string;
  montant_defaut: number;
  id_utilisateur?: string | null;
}) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("catalogue_depense")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCatalogueDepense(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("catalogue_depense")
    .delete()
    .eq("id_catalogue_depense", id);

  if (error) throw error;
}

// ── DÉPENSES DU JOUR ──
export async function fetchDepensesDuJour() {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("depense")
    .select("*")
    .gte("date_depense", today)
    .lt("date_depense", today + "T23:59:59.999Z")
    .order("date_depense", { ascending: false });

  if (error) throw error;
  return data ?? [];
}