"use client";

import { useState, useEffect } from "react";
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
import Link from "next/link";
import {
  fetchDepenses,
  createDepense,
  fetchCatalogueDepenses,
  createCatalogueDepense,
  deleteCatalogueDepense,
  CATEGORIES_LABELS,
  type CategorieDepense,
} from "@/lib/supabase/depenses";

export default function DepensesPage() {
  const { user } = useAuth();
  const [depenses, setDepenses] = useState<any[]>([]);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [montant, setMontant] = useState("");
  const [categorie, setCategorie] = useState<CategorieDepense>("AUTRE");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // État pour le catalogue
  const [showCatalogueForm, setShowCatalogueForm] = useState(false);
  const [newCatLibelle, setNewCatLibelle] = useState("");
  const [newCatMontant, setNewCatMontant] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [depResult, cat] = await Promise.all([
        fetchDepenses(),
        fetchCatalogueDepenses(),
      ]);
      setDepenses(depResult.data);
      setCount(depResult.count);
      setCatalogue(cat);
    } catch {
      showToast("Erreur chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Sélection d'une dépense du catalogue → préremplit le formulaire
  const handleSelectCatalogue = (id: string) => {
    const item = catalogue.find((c: any) => c.id_catalogue_depense === id);
    if (!item) return;
    setCategorie("AUTRE");
    setMontant(String(Number(item.montant_defaut) || ""));
    setDescription(item.libelle);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      showToast("Montant invalide", "warning");
      return;
    }
    if (!user) {
      showToast("Utilisateur non connecté", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createDepense({
        id_utilisateur: user.id_utilisateur,
        categorie,
        montant: montantNum,
        description_autre: categorie === "AUTRE" ? description : undefined,
      });
      showToast("Dépense enregistrée", "success");
      setMontant("");
      setDescription("");
      setShowForm(false);
      load();
    } catch {
      showToast("Erreur création", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCatalogue = async () => {
    if (!newCatLibelle.trim()) {
      showToast("Libellé requis", "warning");
      return;
    }
    try {
      await createCatalogueDepense({
        libelle: newCatLibelle,
        montant_defaut: parseFloat(newCatMontant) || 0,
        id_utilisateur: user?.id_utilisateur,
      });
      showToast("Dépense récurrente créée", "success");
      setNewCatLibelle("");
      setNewCatMontant("");
      setShowCatalogueForm(false);
      load();
    } catch {
      showToast("Erreur création", "error");
    }
  };

  const handleDeleteCatalogue = async (id: string, libelle: string) => {
    if (!confirm(`Supprimer "${libelle}" du catalogue ?`)) return;
    try {
      await deleteCatalogueDepense(id);
      showToast("Supprimée", "success");
      load();
    } catch {
      showToast("Erreur suppression", "error");
    }
  };

  return (
    <LoginWrapper>
      <Navbar userName={user?.nom} userRole={user?.role} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
        {/* Header */}
        <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
          <h1 className="text-xl font-semibold text-text-main truncate">
            Dépenses ({count})
          </h1>
          <div className="flex gap-2 shrink-0">
            <Link href="/bilan">
              <Button variant="outline" size="sm">Bilan</Button>
            </Link>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Annuler" : "+ Nouvelle"}
            </Button>
          </div>
        </div>

        {/* Formulaire */}
        {showForm && (
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">Nouvelle dépense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Catalogue : dépenses récurrentes */}
              {catalogue.length > 0 && (
                <div className="space-y-2">
                  <Label>Dépenses récurrentes</Label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleSelectCatalogue(e.target.value);
                      e.target.value = "";
                    }}
                    className="w-full rounded-xl border border-border-divider bg-surface-card px-3 py-2.5 text-sm touch-manipulation"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      -- Sélectionner une dépense récurrente --
                    </option>
                    {catalogue.map((c: any) => (
                      <option key={c.id_catalogue_depense} value={c.id_catalogue_depense}>
                        {c.libelle}
                        {Number(c.montant_defaut) > 0 ? ` (${Number(c.montant_defaut).toLocaleString()} FCFA)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Catégorie</Label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as CategorieDepense)}
                  className="w-full rounded-xl border border-border-divider bg-surface-card px-3 py-2.5 text-sm touch-manipulation"
                >
                  {Object.entries(CATEGORIES_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {categorie === "AUTRE" && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Motif de la dépense..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Montant (FCFA)</Label>
                <Input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="5000"
                  min={1}
                />
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? "..." : "Enregistrer la dépense"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Gestion du catalogue */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
              <CardTitle className="text-lg truncate">Dépenses récurrentes</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowCatalogueForm(!showCatalogueForm)}>
                {showCatalogueForm ? "Annuler" : "+ Ajouter"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showCatalogueForm && (
              <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl border border-border-divider">
                <Input
                  placeholder="Libellé (ex: Eau)"
                  value={newCatLibelle}
                  onChange={(e) => setNewCatLibelle(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Montant par défaut"
                  value={newCatMontant}
                  onChange={(e) => setNewCatMontant(e.target.value)}
                  className="sm:w-40"
                />
                <Button onClick={handleCreateCatalogue} size="sm">Créer</Button>
              </div>
            )}

            {catalogue.length === 0 && !showCatalogueForm && (
              <p className="text-sm text-text-muted text-center py-4">
                Aucune dépense récurrente. Créez-en une pour gagner du temps !
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {catalogue.map((c: any) => (
                <div
                  key={c.id_catalogue_depense}
                  className="flex items-center gap-2 rounded-full border border-border-divider bg-surface-card px-3 py-1.5 text-sm"
                >
                  <span className="text-text-main font-medium">{c.libelle}</span>
                  {Number(c.montant_defaut) > 0 && (
                    <span className="text-text-muted">{Number(c.montant_defaut).toLocaleString()} FCFA</span>
                  )}
                  <button
                    onClick={() => handleDeleteCatalogue(c.id_catalogue_depense, c.libelle)}
                    className="text-text-muted hover:text-error-danger ml-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Liste des dépenses */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg truncate">Toutes les dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : depenses.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-text-muted">Aucune dépense enregistrée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {depenses.map((d: any) => (
                  <div
                    key={d.id_depense}
                    className={`flex items-center justify-between rounded-xl border p-4 ${
                      d.est_verrouille ? "border-muted opacity-60" : "border-border-divider"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORIES_LABELS[d.categorie as CategorieDepense] ?? d.categorie}
                        </Badge>
                        {d.est_verrouille && <span className="text-xs text-text-muted">Verrouillé</span>}
                      </div>
                      {d.description_autre && (
                        <p className="text-sm text-text-muted mt-1 truncate">{d.description_autre}</p>
                      )}
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(d.date_depense).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-error-danger shrink-0">
                      -{Number(d.montant).toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </LoginWrapper>
  );
}