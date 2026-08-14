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
import { Phone, MessageCircle } from "lucide-react";

const STATUTS = ["PRELEVE", "ENVOYE", "RESULTAT_DISPONIBLE"] as const;

const LABELS: Record<string, string> = {
  PRELEVE: "Prélevé",
  ENVOYE: "Envoyé",
  RESULTAT_DISPONIBLE: "Disponible",
};

const COLORS: Record<string, string> = {
  PRELEVE: "bg-warning-alert/15 text-warning-alert",
  ENVOYE: "bg-info-notice/15 text-info-notice",
  RESULTAT_DISPONIBLE: "bg-success-valid/15 text-success-valid",
};

export default function ExamensPage() {
  const [examens, setExamens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const supabase = createClient();

  const fetchExamens = async () => {
    setLoading(true);
    try {
      // Récupérer les examens
      const { data, error } = await supabase
        .from("examen_laboratoire")
        .select("*, type_examen:type_examen(libelle)")
        .order("date_mise_a_jour", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Pour chaque examen, récupérer les infos patient via la consultation
      const enriched = await Promise.all(
        (data ?? []).map(async (exam: any) => {
          try {
            const { data: cons } = await supabase
              .from("consultation")
              .select("*, patient:patient(nom, prenom, telephone)")
              .eq("id_consultation", exam.id_consultation)
              .single();
            return {
              ...exam,
              patient_nom: (cons as any)?.patient?.nom ?? "",
              patient_prenom: (cons as any)?.patient?.prenom ?? "",
              patient_telephone: (cons as any)?.patient?.telephone ?? "",
            };
          } catch {
            return exam;
          }
        })
      );

      setExamens(enriched);
    } catch {
      showToast("Erreur chargement examens", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamens();
  }, []);

  const handleUpdateStatut = async (id: string, currentStatut: string) => {
    const currentIdx = STATUTS.indexOf(currentStatut as any);
    if (currentIdx >= STATUTS.length - 1) return;

    const newStatut = STATUTS[currentIdx + 1];
    setUpdating(id);

    try {
      const { error } = await supabase
        .from("examen_laboratoire")
        .update({
          statut: newStatut,
          date_mise_a_jour: new Date().toISOString(),
        })
        .eq("id_examen", id);

      if (error) throw error;

      showToast(`Statut mis à jour → ${LABELS[newStatut]}`, "success");
      fetchExamens();
    } catch {
      showToast("Erreur de mise à jour", "error");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <LoginWrapper>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
              <CardTitle className="truncate">Examens de Laboratoire</CardTitle>
              <Button variant="outline" size="sm" onClick={fetchExamens} className="shrink-0">
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : examens.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text-muted">Aucun examen enregistré</p>
              </div>
            ) : (
              <div className="space-y-2">
                {examens.map((exam) => (
                  <div
                    key={exam.id_examen}
                    className="flex items-center justify-between rounded-xl border border-border-divider bg-surface-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-main truncate">
                        {exam.type_examen?.libelle ?? "Examen"}
                      </p>
                      <p className="text-sm text-text-muted">
                        {exam.patient_prenom ?? ""} {exam.patient_nom ?? ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        className={`text-xs font-medium ${
                          COLORS[exam.statut] ?? ""
                        }`}
                      >
                        {LABELS[exam.statut] ?? exam.statut}
                      </Badge>

                      {exam.statut !== "RESULTAT_DISPONIBLE" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updating === exam.id_examen}
                          onClick={() =>
                            handleUpdateStatut(exam.id_examen, exam.statut)
                          }
                        >
                          {updating === exam.id_examen
                            ? "..."
                            : `→ ${
                                LABELS[
                                  STATUTS[
                                    STATUTS.indexOf(exam.statut as any) + 1
                                  ]
                                ]
                              }`}
                        </Button>
                      ) : exam.patient_telephone ? (
                        <div className="flex gap-1">
                          <a
                            href={`tel:${exam.patient_telephone.replace(/\s/g, "")}`}
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full"
                            >
                              <Phone className="size-4" />
                            </Button>
                          </a>
                          <a
                            href={`https://wa.me/${exam.patient_telephone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full text-green-600 hover:text-green-700"
                            >
                              <MessageCircle className="size-4" />
                            </Button>
                          </a>
                        </div>
                      ) : null}
                    </div>
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