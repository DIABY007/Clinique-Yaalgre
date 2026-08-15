import { getSupabase } from "./client-lazy";

// ── LISTE DES ACTES ──
export async function fetchActes() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("catalogue_acte")
    .select("*")
    .order("libelle");

  if (error) throw error;
  return data ?? [];
}

// ── LISTE DES PRODUITS ──
export async function fetchProducts() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("produit")
    .select("id_produit, nom, prix_unitaire, type_gestion, code_barre")
    .order("nom");

  if (error) throw error;
  return data ?? [];
}

// ── CONSULTATIONS SANS FACTURE ──
export async function fetchConsultationsWithoutFacture() {
  const supabase = await getSupabase();
  // 1. Récupérer les consultations
  const { data: consultations, error: consError } = await supabase
    .from("consultation")
    .select("id_consultation, date_heure, patient:patient(nom, prenom)")
    .order("date_heure", { ascending: false })
    .limit(50);

  if (consError) throw consError;
  if (!consultations?.length) return [];

  // 2. Récupérer les consultations qui ont déjà une facture
  const ids = consultations.map((c: any) => c.id_consultation);
  const { data: factures } = await supabase
    .from("facture")
    .select("id_consultation")
    .in("id_consultation", ids);

  const factureIds = new Set(factures?.map((f: any) => f.id_consultation) ?? []);

  // 3. Filtrer
  return consultations.filter((c: any) => !factureIds.has(c.id_consultation));
}

// ── VÉRIFICATION STOCK AVANT FACTURATION ──
async function checkStockProduit(
  produitId: string,
  quantite: number
): Promise<{ ok: boolean; stock: number; nom: string }> {
  const supabase = await getSupabase();
  // Récupérer le produit
  const { data: produit } = await supabase
    .from("produit")
    .select("nom, type_gestion")
    .eq("id_produit", produitId)
    .single();

  if (!produit) return { ok: false, stock: 0, nom: "Inconnu" };
  if (produit.type_gestion !== "STRICT") return { ok: true, stock: 999, nom: produit.nom };

  // Calculer stock STRICT
  const { data: mouvements } = await supabase
    .from("mouvement_stock")
    .select("quantite, type_mouvement")
    .eq("id_produit", produitId);

  let stock = 0;
  for (const m of mouvements ?? []) {
    stock += m.type_mouvement === "SORTIE" ? -Math.abs(Number(m.quantite)) : Number(m.quantite);
  }

  if (stock < quantite) {
    return { ok: false, stock: Math.max(0, stock), nom: produit.nom };
  }
  return { ok: true, stock, nom: produit.nom };
}

// ── CRÉER FACTURE AVEC LIGNES + VÉRIF STOCK ──
export async function createFacture(input: {
  id_consultation: string;
  id_utilisateur: string;
  lignes: Array<{
    quantite: number;
    prix_unitaire_applique: number;
    id_acte?: string | null;
    id_produit?: string | null;
  }>;
}): Promise<string> {
  const supabase = await getSupabase();
  // Vérifier stock pour chaque ligne produit (STRICT)
  for (const ligne of input.lignes) {
    if (ligne.id_produit) {
      const check = await checkStockProduit(ligne.id_produit, ligne.quantite);
      if (!check.ok) {
        throw new Error(
          `Stock insuffisant pour "${check.nom}" (stock: ${check.stock}, demandé: ${ligne.quantite})`
        );
      }
    }
  }

  // Créer la facture
  const { data: facture, error: factureError } = await supabase
    .from("facture")
    .insert({ id_consultation: input.id_consultation })
    .select("id_facture")
    .single();

  if (factureError) throw factureError;

  // Créer les lignes
  const lignes = input.lignes.map((l) => ({
    id_facture: facture.id_facture,
    ...l,
  }));

  const { error: lignesError } = await supabase
    .from("ligne_facture")
    .insert(lignes);

  if (lignesError) throw lignesError;

  // Créer les mouvements de stock SORTIE pour chaque ligne produit
  for (const ligne of input.lignes) {
    if (ligne.id_produit) {
      await supabase.from("mouvement_stock").insert({
        id_produit: ligne.id_produit,
        id_utilisateur: input.id_utilisateur,
        id_consultation: input.id_consultation,
        quantite: -ligne.quantite,
        type_mouvement: "SORTIE" as any,
        motif_ajustement: "Vente sur facture",
      });
    }
  }

  return facture.id_facture;
}

// ── AJOUTER UN PAIEMENT ──
export async function addPaiement(input: {
  id_facture: string;
  montant_encaisse: number;
  id_utilisateur: string;
}): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from("paiement").insert({
    id_facture: input.id_facture,
    montant_encaisse: input.montant_encaisse,
    id_utilisateur: input.id_utilisateur,
  });

  if (error) throw error;
}

// ── RÉCUPÉRER FACTURE AVEC DÉTAILS ──
export async function fetchFacture(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("facture")
    .select(
      "*, lignes:ligne_facture(*), paiements:paiement(*), consultation:consultation(id_patient, patient:patient(nom, prenom))"
    )
    .eq("id_facture", id)
    .single();

  if (error) throw error;
  return data;
}

// ── LISTE FACTURES ──
export async function fetchFactures(page = 0, pageSize = 20) {
  const supabase = await getSupabase();
  const { data, count, error } = await supabase
    .from("facture")
    .select("*, consultation:consultation(id_patient, patient:patient(nom, prenom))", {
      count: "exact",
    })
    .order("date_facture", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

// ── CALCULER RESTE À PAYER ──
export function calculerResteAPayer(
  lignes: { quantite: number; prix_unitaire_applique: number }[],
  paiements: { montant_encaisse: number }[]
): number {
  const total = lignes.reduce(
    (sum, l) => sum + l.quantite * l.prix_unitaire_applique,
    0
  );
  const encaisse = paiements.reduce((sum, p) => sum + Number(p.montant_encaisse), 0);
  return Math.max(0, total - encaisse);
}

// ── BILAN JOURNALIER ──
export async function getOrCreateBilan(): Promise<{ id_bilan: string }> {
  const supabase = await getSupabase();
  // Essayer de trouver le bilan du jour
  const { data: existing } = await supabase
    .from("bilan_journalier")
    .select("id_bilan")
    .eq("date_bilan", new Date().toISOString().split("T")[0])
    .single();

  if (existing) return existing;

  // Créer un nouveau bilan
  const { data: bilan, error } = await supabase
    .from("bilan_journalier")
    .insert({ date_bilan: new Date().toISOString().split("T")[0] })
    .select("id_bilan")
    .single();

  if (error) throw error;
  return bilan;
}

// ── CLÔTURER LE BILAN ──
export async function cloturerBilan(): Promise<void> {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split("T")[0];
  const bilan = await getOrCreateBilan();

  // Verrouiller paiements du jour
  await supabase
    .from("paiement")
    .update({ est_verrouille: true, id_bilan: bilan.id_bilan })
    .eq("est_verrouille", false)
    .gte("date_paiement", today)
    .lt("date_paiement", today + "T23:59:59.999Z");

  // Verrouiller depenses du jour
  await supabase
    .from("depense")
    .update({ est_verrouille: true, id_bilan: bilan.id_bilan })
    .eq("est_verrouille", false)
    .gte("date_depense", today)
    .lt("date_depense", today + "T23:59:59.999Z");
}