"use client";

import { useState, useEffect } from "react";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/contexts/auth-context";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import {
  fetchProduits,
  fetchStockDisponible,
  createProduit,
  createMouvement,
  checkStockAvantSortie,
} from "@/lib/supabase/stock";

const STOCK_ALERT_SEUIL = 10;

export default function StocksPage() {
  const { user } = useAuth();
  const [produits, setProduits] = useState<any[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    type_gestion: "MASSE" as "STRICT" | "MASSE",
    prix_unitaire: "",
    code_barre: "",
  });
  const [mouvement, setMouvement] = useState<{
    id_produit: string;
    quantite: string;
    type: "ENTREE" | "SORTIE";
  } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const p = await fetchProduits();
      const s = await fetchStockDisponible();
      setProduits(p);
      setStock(s);
    } catch {
      showToast("Erreur chargement stock", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateProduit = async () => {
    if (!form.nom || !form.prix_unitaire) {
      showToast("Champs obligatoires", "warning");
      return;
    }
    try {
      await createProduit({
        nom: form.nom,
        type_gestion: form.type_gestion,
        prix_unitaire: parseFloat(form.prix_unitaire),
        code_barre: form.code_barre || undefined,
      });
      showToast("Produit créé", "success");
      setForm({ nom: "", type_gestion: "MASSE", prix_unitaire: "", code_barre: "" });
      setShowForm(false);
      load();
    } catch {
      showToast("Erreur création", "error");
    }
  };

  const handleMouvement = async () => {
    if (!mouvement || !user) return;
    const qte = parseInt(mouvement.quantite);
    if (isNaN(qte) || qte <= 0) {
      showToast("Quantité invalide", "warning");
      return;
    }

    // Vérification stock STRICT avant sortie
    if (mouvement.type === "SORTIE") {
      const check = await checkStockAvantSortie(mouvement.id_produit, qte);
      if (!check.ok) {
        showToast(
          `Opération impossible : Stock insuffisant pour "${check.produit}" (Stock actuel : ${check.stockActuel})`,
          "error"
        );
        return;
      }
    }

    try {
      await createMouvement({
        id_produit: mouvement.id_produit,
        id_utilisateur: user.id_utilisateur,
        quantite: mouvement.type === "SORTIE" ? -qte : qte,
        type_mouvement: mouvement.type === "SORTIE" ? "SORTIE" : "ENTREE",
        motif_ajustement: mouvement.type === "ENTREE" ? "Entrée manuelle" : "Sortie manuelle",
      });
      showToast("Mouvement enregistré", "success");
      setMouvement(null);
      load();
    } catch {
      showToast("Erreur mouvement", "error");
    }
  };

  return (
    <LoginWrapper>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
        {/* Header */}
        <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
          <h1 className="text-xl font-semibold text-text-main truncate">Stock</h1>
          <Button onClick={() => setShowForm(!showForm)} className="shrink-0">
            {showForm ? "Annuler" : "+ Nouveau produit"}
          </Button>
        </div>

        {/* Nouveau produit */}
        {showForm && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">Nouveau produit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix unitaire *</Label>
                  <Input
                    type="number"
                    value={form.prix_unitaire}
                    onChange={(e) =>
                      setForm({ ...form, prix_unitaire: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code barre</Label>
                  <BarcodeScanner
                    value={form.code_barre}
                    onChange={(v) => setForm({ ...form, code_barre: v })}
                    placeholder="Scanner ou saisir..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gestion</Label>
                  <select
                    value={form.type_gestion}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type_gestion: e.target.value as "STRICT" | "MASSE",
                      })
                    }
                    className="w-full rounded-xl border border-border-divider bg-surface-card px-3 py-2 text-sm"
                  >
                    <option value="MASSE">MASSE</option>
                    <option value="STRICT">STRICT</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleCreateProduit}>Enregistrer</Button>
            </CardContent>
          </Card>
        )}

        {/* Liste des produits */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="truncate">Produits ({produits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : produits.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text-muted">Aucun produit</p>
              </div>
            ) : (
              <div className="space-y-2">
                {produits.map((p) => {
                  const qte = stock[p.id_produit] ?? 0;
                  const isLow = p.type_gestion === "STRICT" && qte < STOCK_ALERT_SEUIL;

                  return (
                    <div
                      key={p.id_produit}
                      className="flex items-center justify-between rounded-xl border border-border-divider bg-surface-card p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-main">
                            {p.nom}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {p.type_gestion}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted">
                          {Number(p.prix_unitaire).toLocaleString()} FCFA
                          {p.code_barre && ` • ${p.code_barre}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Stock */}
                        <div className="text-right">
                          <p
                            className={`text-lg font-semibold ${
                              isLow
                                ? "text-error-danger"
                                : qte > 0
                                ? "text-success-valid"
                                : "text-text-muted"
                            }`}
                          >
                            {qte}
                          </p>
                          {isLow && (
                            <p className="text-xs text-error-danger">
                              Stock bas!
                            </p>
                          )}
                        </div>

                        {/* Boutons mouvement */}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setMouvement({
                                id_produit: p.id_produit,
                                quantite: "",
                                type: "ENTREE",
                              })
                            }
                          >
                            + Entrée
                          </Button>
                          {qte > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setMouvement({
                                  id_produit: p.id_produit,
                                  quantite: "",
                                  type: "SORTIE",
                                })
                              }
                            >
                              - Sortie
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal mouvement */}
        {mouvement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {mouvement.type === "ENTREE" ? "Entrée" : "Sortie"} de stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    value={mouvement.quantite}
                    onChange={(e) =>
                      setMouvement({ ...mouvement, quantite: e.target.value })
                    }
                    min={1}
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleMouvement}>Valider</Button>
                  <Button
                    variant="outline"
                    onClick={() => setMouvement(null)}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </LoginWrapper>
  );
}