"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/contexts/auth-context";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import {
  fetchActes,
  fetchProducts,
  createFacture,
  fetchConsultationsWithoutFacture,
} from "@/lib/supabase/factures";

type LignePanier = {
  type: "acte" | "produit";
  id: string;
  libelle: string;
  prix_unitaire: number;
  quantite: number;
};

export default function NouvelleFacturePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [consultations, setConsultations] = useState<any[]>([]);
  const [actes, setActes] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<string>("");
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [tab, setTab] = useState<"acte" | "produit">("acte");
  const [productSearch, setProductSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cons, acts, prods] = await Promise.all([
        fetchConsultationsWithoutFacture(),
        fetchActes(),
        fetchProducts(),
      ]);
      setConsultations(cons);
      setActes(acts);
      setProduits(prods);
    } catch {
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ajouterAuPanier = (type: "acte" | "produit", id: string, libelle: string, prix: number) => {
    const existant = panier.find((l) => l.id === id && l.type === type);
    if (existant) {
      setPanier((p) =>
        p.map((l) =>
          l.id === id && l.type === type
            ? { ...l, quantite: l.quantite + 1 }
            : l
        )
      );
    } else {
      setPanier((p) => [...p, { type, id, libelle, prix_unitaire: prix, quantite: 1 }]);
    }
  };

  const supprimerLigne = (index: number) => {
    setPanier((p) => p.filter((_, i) => i !== index));
  };

  const totalPanier = panier.reduce((s, l) => s + l.prix_unitaire * l.quantite, 0);

  const handleSubmit = async () => {
    if (!selectedConsultation) {
      showToast("Sélectionnez une consultation", "warning");
      return;
    }
    if (panier.length === 0) {
      showToast("Ajoutez au moins une ligne", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const lignes = panier.map((l) => ({
        quantite: l.quantite,
        prix_unitaire_applique: l.prix_unitaire,
        ...(l.type === "acte" ? { id_acte: l.id } : { id_produit: l.id }),
      }));

      const idFacture = await createFacture({
        id_consultation: selectedConsultation,
        id_utilisateur: user?.id_utilisateur ?? "",
        lignes,
      });

      showToast("Facture créée avec succès", "success");
      router.push(`/factures/${idFacture}`);
    } catch (err: any) {
      showToast(err?.message || "Erreur création facture", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const consultationChoisie = consultations.find((c) => c.id_consultation === selectedConsultation);

  return (
    <LoginWrapper>
      <Navbar userName={user?.nom} userRole={user?.role} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
        {/* En-tête */}
        <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
          <h1 className="text-xl font-semibold text-text-main truncate">Nouvelle Facture</h1>
          <Button variant="outline" size="sm" onClick={() => router.push("/factures")} className="shrink-0">
            ← Liste
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <>
            {/* Étape 1 : Sélectionner la consultation */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">1. Consultation</CardTitle>
              </CardHeader>
              <CardContent>
                {consultations.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-text-muted">Aucune consultation sans facture</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/patients")}>
                      Créer une consultation →
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {consultations.map((c: any) => {
                      const isSelected = selectedConsultation === c.id_consultation;
                      return (
                        <button
                          key={c.id_consultation}
                          type="button"
                          onClick={() => setSelectedConsultation(c.id_consultation)}
                          className={`rounded-xl border px-4 py-3 text-left transition-colors min-w-0 ${
                            isSelected
                              ? "border-primary-forest bg-primary-forest/5 ring-2 ring-primary-forest/20"
                              : "border-border-divider hover:border-primary-forest/30"
                          }`}
                        >
                          <p className="font-medium text-sm text-text-main">
                            {c.patient?.prenom} {c.patient?.nom}
                          </p>
                          <p className="text-xs text-text-muted">
                            {new Date(c.date_heure).toLocaleDateString()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedConsultation && (
              <>
                {/* Étape 2 : Ajouter des lignes */}
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">2. Lignes de facture</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setTab("acte")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          tab === "acte"
                            ? "bg-primary-forest text-white"
                            : "bg-muted text-text-muted hover:bg-primary-forest/10"
                        }`}
                      >
                        Actes médicaux
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("produit")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          tab === "produit"
                            ? "bg-primary-forest text-white"
                            : "bg-muted text-text-muted hover:bg-primary-forest/10"
                        }`}
                      >
                        Produits
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Catalogue */}
                    {tab === "acte" ? (
                      <div className="flex flex-wrap gap-2">
                        {actes.map((a: any) => (
                          <button
                            key={a.id_acte}
                            type="button"
                            onClick={() => ajouterAuPanier("acte", a.id_acte, a.libelle, Number(a.prix_unitaire))}
                            className="rounded-lg border border-border-divider px-3 py-2 text-sm text-left hover:border-primary-forest/30 transition-colors touch-manipulation"
                          >
                            <p className="font-medium text-text-main">{a.libelle}</p>
                            <p className="text-xs text-text-muted">{Number(a.prix_unitaire).toLocaleString()} FCFA</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Produits STRICT → Scan Out obligatoire */}
                        {produits.filter((p: any) => p.type_gestion === "STRICT").length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                              STRICT — Scan Out requis
                            </p>
                            <BarcodeScanner
                              value={productSearch}
                              onChange={(v) => {
                                setProductSearch(v);
                                const found = produits.find(
                                  (p: any) => p.code_barre?.toLowerCase() === v.toLowerCase()
                                );
                                if (found && found.type_gestion === "STRICT") {
                                  ajouterAuPanier("produit", found.id_produit, found.nom, Number(found.prix_unitaire));
                                  setProductSearch("");
                                }
                              }}
                              placeholder="Scanner code-barres STRICT..."
                            />
                          </div>
                        )}

                        {/* Produits MASSE → sélection simple */}
                        {produits.filter((p: any) => p.type_gestion === "MASSE").length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                              MASSE — Ajout sans scan
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {produits
                                .filter((p: any) => p.type_gestion === "MASSE")
                                .map((p: any) => (
                                <button
                                  key={p.id_produit}
                                  type="button"
                                  onClick={() => ajouterAuPanier("produit", p.id_produit, p.nom, Number(p.prix_unitaire))}
                                  className="rounded-lg border border-border-divider px-3 py-2 text-sm text-left hover:border-primary-forest/30 transition-colors touch-manipulation"
                                >
                                  <p className="font-medium text-text-main">{p.nom}</p>
                                  <p className="text-xs text-text-muted">{Number(p.prix_unitaire).toLocaleString()} FCFA</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Panier */}
                    {panier.length > 0 && (
                      <div className="mt-6 border-t border-border-divider pt-4 space-y-2">
                        <p className="text-sm font-medium text-text-main">Panier :</p>
                        {panier.map((ligne, i) => (
                          <div
                            key={`${ligne.type}-${ligne.id}`}
                            className="flex items-center justify-between rounded-lg border border-border-divider p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-text-main truncate">
                                {ligne.libelle}
                              </p>
                              <p className="text-xs text-text-muted">
                                {ligne.quantite} × {ligne.prix_unitaire.toLocaleString()} FCFA
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-semibold text-primary-forest">
                                {(ligne.quantite * ligne.prix_unitaire).toLocaleString()} FCFA
                              </span>
                              <button
                                type="button"
                                onClick={() => supprimerLigne(i)}
                                className="text-xs text-error-danger hover:underline touch-manipulation"
                              >
                                Retirer
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Total */}
                        <div className="flex justify-between border-t border-border-divider pt-3">
                          <span className="font-semibold text-text-main">Total</span>
                          <span className="font-semibold text-primary-forest">
                            {totalPanier.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Valider */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || panier.length === 0}
                  className="w-full h-12 text-base"
                >
                  {submitting ? "Création..." : `Créer la facture (${totalPanier.toLocaleString()} FCFA)`}
                </Button>
              </>
            )}
          </>
        )}
      </main>
    </LoginWrapper>
  );
}