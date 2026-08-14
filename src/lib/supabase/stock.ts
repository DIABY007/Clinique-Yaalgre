import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// ── VÉRIFICATION STOCK (pour les sorties) ──
export async function checkStockAvantSortie(
  produitId: string,
  quantiteDemandee: number
): Promise<{ ok: boolean; stockActuel: number; produit: string }> {
  // Récupérer le produit
  const { data: produit } = await supabase
    .from("produit")
    .select("nom, type_gestion")
    .eq("id_produit", produitId)
    .single();

  // Si gestion MASSE, pas de vérification
  if (!produit || produit.type_gestion !== "STRICT") {
    return { ok: true, stockActuel: 999, produit: produit?.nom ?? "" };
  }

  // Calculer le stock disponible
  const { data: mouvements } = await supabase
    .from("mouvement_stock")
    .select("quantite, type_mouvement")
    .eq("id_produit", produitId);

  let stockActuel = 0;
  for (const m of mouvements ?? []) {
    const qte = Number(m.quantite);
    stockActuel += m.type_mouvement === "SORTIE" ? -Math.abs(qte) : qte;
  }

  if (stockActuel < quantiteDemandee) {
    return {
      ok: false,
      stockActuel: Math.max(0, stockActuel),
      produit: produit.nom,
    };
  }

  return { ok: true, stockActuel, produit: produit.nom };
}

// ── LISTE PRODUITS ──
export async function fetchProduits() {
  const { data, error } = await supabase
    .from("produit")
    .select("*")
    .order("nom");

  if (error) throw error;
  return data ?? [];
}

// ── STOCK DISPONIBLE (calculé via les mouvements) ──
export async function fetchStockDisponible(produitId?: string) {
  let query = supabase
    .from("mouvement_stock")
    .select("id_produit, quantite, type_mouvement");

  if (produitId) {
    query = query.eq("id_produit", produitId);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Agréger par produit
  const stock: Record<string, number> = {};
  for (const m of data ?? []) {
    if (!stock[m.id_produit]) stock[m.id_produit] = 0;
    const qte = Number(m.quantite);
    stock[m.id_produit] += m.type_mouvement === "SORTIE" ? -Math.abs(qte) : qte;
  }

  return stock;
}

// ── CRÉER PRODUIT ──
export async function createProduit(input: {
  nom: string;
  type_gestion: "STRICT" | "MASSE";
  prix_unitaire: number;
  code_barre?: string;
}) {
  const { data, error } = await supabase
    .from("produit")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── MOUVEMENT DE STOCK ──
export async function createMouvement(input: {
  id_produit: string;
  id_utilisateur: string;
  quantite: number;
  type_mouvement: "ENTREE" | "SORTIE" | "AJUSTEMENT_NEGATIF";
  motif_ajustement?: string;
  id_consultation?: string;
}) {
  const { data, error } = await supabase
    .from("mouvement_stock")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── HISTORIQUE MOUVEMENTS D'UN PRODUIT ──
export async function fetchMouvements(produitId: string) {
  const { data, error } = await supabase
    .from("mouvement_stock")
    .select("*")
    .eq("id_produit", produitId)
    .order("date_mouvement", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

// ── ALERTE STOCK BAS ──
export async function checkStockAlerte(seuil = 10) {
  const produits = await fetchProduits();
  const stock = await fetchStockDisponible();

  return produits
    .filter((p) => (stock[p.id_produit] ?? 0) < seuil)
    .map((p) => ({
      ...p,
      stock_actuel: stock[p.id_produit] ?? 0,
    }));
}