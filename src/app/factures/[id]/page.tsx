"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchFacture,
  addPaiement,
  calculerResteAPayer,
} from "@/lib/supabase/factures";

export default function FactureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [facture, setFacture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [montant, setMontant] = useState("");
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchFacture(id);
      setFacture(data);
    } catch {
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const resteAPayer = facture
    ? calculerResteAPayer(
        facture.lignes ?? [],
        facture.paiements ?? []
      )
    : 0;

  const total = facture
    ? (facture.lignes ?? []).reduce(
        (s: number, l: any) => s + l.quantite * l.prix_unitaire_applique,
        0
      )
    : 0;

  const handlePaiement = async () => {
    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      showToast("Montant invalide", "warning");
      return;
    }
    if (montantNum > resteAPayer) {
      showToast("Montant supérieur au reste à payer", "warning");
      return;
    }
    if (!user) {
      showToast("Utilisateur non connecté", "error");
      return;
    }

    setPaying(true);
    try {
      await addPaiement({
        id_facture: id,
        montant_encaisse: montantNum,
        id_utilisateur: user.id_utilisateur,
      });
      showToast("Paiement enregistré", "success");
      setMontant("");
      load();
    } catch {
      showToast("Erreur paiement", "error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <LoginWrapper>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
        <Button variant="outline" onClick={() => router.push("/factures")} className="w-fit">
          ← Factures
        </Button>

        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : !facture ? (
          <p className="text-text-muted">Facture introuvable</p>
        ) : (
          <div className="flex flex-col items-stretch gap-6">
            {/* En-tête */}
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>
                      Facture du{" "}
                      {new Date(facture.date_facture).toLocaleDateString()}
                    </CardTitle>
                    <p className="text-sm text-text-muted">
                      Patient:{" "}
                      {facture.consultation?.patient?.prenom ?? ""}{" "}
                      {facture.consultation?.patient?.nom ?? "N/A"}
                    </p>
                  </div>
                  <p className="text-xl font-semibold text-primary-forest">
                    Total: {total.toLocaleString()} FCFA
                  </p>
                </div>
              </CardHeader>
            </Card>

            {/* Lignes */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">Lignes de facture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(facture.lignes ?? []).map((l: any) => (
                    <div
                      key={l.id_ligne}
                      className="flex justify-between rounded-lg border border-border-divider p-3"
                    >
                      <span className="text-text-main">
                        {l.id_acte ? "Acte" : "Produit"} × {l.quantite}
                      </span>
                      <span className="font-medium">
                        {(
                          l.quantite * l.prix_unitaire_applique
                        ).toLocaleString()}{" "}
                        FCFA
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Paiements */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  Paiements ({facture.paiements?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {(facture.paiements ?? []).map((p: any) => (
                    <div
                      key={p.id_paiement}
                      className={`flex justify-between rounded-lg border p-3 ${
                        p.est_verrouille
                          ? "border-muted opacity-60"
                          : "border-border-divider"
                      }`}
                    >
                      <span className="text-text-main">
                        {new Date(p.date_paiement).toLocaleString()}
                      </span>
                      <span className="font-medium">
                        {Number(p.montant_encaisse).toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>

                {/* Solde */}
                <div className="flex justify-between border-t border-border-divider pt-4">
                  <span className="font-semibold text-text-main">
                    Reste à payer
                  </span>
                  <span
                    className={`font-semibold ${
                      resteAPayer > 0 ? "text-error-danger" : "text-success-valid"
                    }`}
                  >
                    {resteAPayer.toLocaleString()} FCFA
                  </span>
                </div>

                {/* Ajout paiement */}
                {resteAPayer > 0 && (
                  <div className="flex gap-3 pt-2">
                    <Input
                      type="number"
                      placeholder="Montant..."
                      value={montant}
                      onChange={(e) => setMontant(e.target.value)}
                      max={resteAPayer}
                      className="max-w-[200px]"
                    />
                    <Button onClick={handlePaiement} disabled={paying}>
                      {paying ? "..." : "Ajouter un paiement"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </LoginWrapper>
  );
}