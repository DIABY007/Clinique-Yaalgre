"use client";

import { useState, useEffect } from "react";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/lib/toast";
import { createClient } from "@/utils/supabase/client";
import { getOrCreateBilan, cloturerBilan } from "@/lib/supabase/factures";

export default function BilanPage() {
  const supabase = createClient();
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth()); // 0-indexed
  const [annee, setAnnee] = useState(now.getFullYear());

  const [bilan, setBilan] = useState<any>(null);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [depenses, setDepenses] = useState<any[]>([]);
  const [bilansMois, setBilansMois] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMois, setLoadingMois] = useState(true);
  const [closing, setClosing] = useState(false);

  const loadJour = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const b = await getOrCreateBilan();
      setBilan(b);

      const { data: p } = await supabase
        .from("paiement")
        .select("*")
        .gte("date_paiement", today)
        .lt("date_paiement", today + "T23:59:59.999Z")
        .order("date_paiement");
      setPaiements(p ?? []);

      const { data: d } = await supabase
        .from("depense")
        .select("*")
        .gte("date_depense", today)
        .lt("date_depense", today + "T23:59:59.999Z")
        .order("date_depense");
      setDepenses(d ?? []);
    } catch {
      showToast("Erreur chargement bilan", "error");
    }
  };

  const loadMois = async (m: number, a: number) => {
    setLoadingMois(true);
    try {
      const debut = `${a}-${String(m + 1).padStart(2, "0")}-01`;
      const finMois = new Date(a, m + 1, 0).getDate();
      const fin = `${a}-${String(m + 1).padStart(2, "0")}-${finMois}`;

      const { data } = await supabase
        .from("bilan_journalier")
        .select("*")
        .gte("date_bilan", debut)
        .lte("date_bilan", fin)
        .order("date_bilan", { ascending: false });

      setBilansMois(data ?? []);
    } catch {
      // Silencieux
    } finally {
      setLoadingMois(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadJour(), loadMois(mois, annee)]).finally(() =>
      setLoading(false)
    );
  }, []);

  useEffect(() => {
    loadMois(mois, annee);
  }, [mois, annee]);

  const handleCloture = async () => {
    if (!confirm("Clôturer la journée ? Les transactions seront verrouillées."))
      return;
    setClosing(true);
    try {
      await cloturerBilan();
      showToast("Bilan clôturé avec succès", "success");
      loadJour();
    } catch {
      showToast("Erreur lors de la clôture", "error");
    } finally {
      setClosing(false);
    }
  };

  // Agrégations du mois
  const aggRecettes = bilansMois.reduce(
    (s, b) => s + Number(b.total_recettes),
    0
  );
  const aggDepenses = bilansMois.reduce(
    (s, b) => s + Number(b.total_depenses),
    0
  );
  const aggSolde = bilansMois.reduce((s, b) => s + Number(b.solde_net), 0);

  // Totaux du jour
  const totalRecettes = paiements.reduce((s, p) => s + Number(p.montant_encaisse), 0);
  const totalDepenses = depenses.reduce((s, d) => s + Number(d.montant), 0);
  const solde = totalRecettes - totalDepenses;
  const locked = paiements.some((p) => p.est_verrouille);

  const nomMois = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  const prevMois = () => {
    if (mois === 0) {
      setMois(11);
      setAnnee((a) => a - 1);
    } else {
      setMois((m) => m - 1);
    }
  };

  const nextMois = () => {
    if (mois === 11) {
      setMois(0);
      setAnnee((a) => a + 1);
    } else {
      setMois((m) => m + 1);
    }
  };

  return (
    <LoginWrapper>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
        {/* Filtre mois */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
              <CardTitle className="truncate">Rapport mensuel</CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={prevMois}>
                  ←
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {nomMois[mois]} {annee}
                </span>
                <Button variant="outline" size="sm" onClick={nextMois}>
                  →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingMois ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border-divider p-4">
                  <p className="text-xs text-text-muted">Recettes</p>
                  <p className="text-xl font-semibold text-success-valid">
                    {aggRecettes.toLocaleString()} FCFA
                  </p>
                </div>
                <div className="rounded-xl border border-border-divider p-4">
                  <p className="text-xs text-text-muted">Dépenses</p>
                  <p className="text-xl font-semibold text-error-danger">
                    {aggDepenses.toLocaleString()} FCFA
                  </p>
                </div>
                <div className="rounded-xl border border-border-divider p-4">
                  <p className="text-xs text-text-muted">Solde net</p>
                  <p
                    className={`text-xl font-semibold ${
                      aggSolde >= 0 ? "text-success-valid" : "text-error-danger"
                    }`}
                  >
                    {aggSolde.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bilan du jour */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
              <CardTitle className="truncate">
                Aujourd&apos;hui —{" "}
                {new Date().toLocaleDateString("fr-FR")}
              </CardTitle>
              {!locked && (
                <Button
                  onClick={handleCloture}
                  disabled={closing}
                  variant={closing ? "outline" : "default"}
                  className="shrink-0"
                >
                  {closing ? "Clôture..." : "Clôturer la journée"}
                </Button>
              )}
              {locked && (
                <Badge className="bg-success-valid/15 text-success-valid shrink-0">
                  Verrouillé
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="w-full">
            <CardContent className="p-6">
              <p className="text-sm text-text-muted">Recettes</p>
              <p className="text-2xl font-semibold text-success-valid">
                {totalRecettes.toLocaleString()} FCFA
              </p>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardContent className="p-6">
              <p className="text-sm text-text-muted">Dépenses</p>
              <p className="text-2xl font-semibold text-error-danger">
                {totalDepenses.toLocaleString()} FCFA
              </p>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardContent className="p-6">
              <p className="text-sm text-text-muted">Solde net</p>
              <p
                className={`text-2xl font-semibold ${
                  solde >= 0 ? "text-success-valid" : "text-error-danger"
                }`}
              >
                {solde.toLocaleString()} FCFA
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">
              Paiements ({paiements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paiements.length === 0 ? (
              <p className="text-text-muted">Aucun paiement aujourd'hui</p>
            ) : (
              <div className="space-y-2">
                {paiements.map((p: any) => (
                  <div
                    key={p.id_paiement}
                    className={`flex justify-between rounded-lg border p-3 ${
                      p.est_verrouille
                        ? "border-muted opacity-60"
                        : "border-border-divider"
                    }`}
                  >
                    <span className="text-text-main">
                      {new Date(p.date_paiement).toLocaleTimeString()}
                    </span>
                    <span className="font-medium">
                      {Number(p.montant_encaisse).toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
              <CardTitle className="text-lg">
                Dépenses ({depenses.length})
              </CardTitle>
              <a
                href="/depenses"
                className="text-sm text-primary-forest font-medium hover:underline shrink-0"
              >
                Gérer →
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {depenses.length === 0 ? (
              <p className="text-text-muted">Aucune dépense aujourd'hui</p>
            ) : (
              <div className="space-y-2">
                {depenses.map((d: any) => (
                  <div
                    key={d.id_depense}
                    className={`flex justify-between rounded-lg border p-3 ${
                      d.est_verrouille
                        ? "border-muted opacity-60"
                        : "border-border-divider"
                    }`}
                  >
                    <div>
                      <span className="text-text-main">{d.categorie}</span>
                      {d.description_autre && (
                        <p className="text-xs text-text-muted">
                          {d.description_autre}
                        </p>
                      )}
                    </div>
                    <span className="font-medium">
                      {Number(d.montant).toLocaleString()} FCFA
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