"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/lib/toast";
import {
  fetchPatient,
  archivePatient,
} from "@/lib/supabase/patients";
import type { Patient } from "@/db/database";

const STATUT_LABELS: Record<string, string> = {
  PRELEVE: "Prélevé",
  ENVOYE: "Envoyé",
  RESULTAT_DISPONIBLE: "Disponible",
};
const STATUT_COLORS: Record<string, string> = {
  PRELEVE: "bg-warning-alert/15 text-warning-alert",
  ENVOYE: "bg-info-notice/15 text-info-notice",
  RESULTAT_DISPONIBLE: "bg-success-valid/15 text-success-valid",
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPatient(id)
      .then(setPatient)
      .catch(() => showToast("Erreur de chargement", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleArchive = async () => {
    if (!patient) return;
    if (!confirm(`Archiver ${patient.prenom} ${patient.nom} ?`)) return;
    try {
      await archivePatient(id);
      showToast("Patient archivé", "success");
      router.push("/patients");
    } catch {
      showToast("Erreur lors de l'archivage", "error");
    }
  };

  return (
    <LoginWrapper>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
        <div className="flex flex-row flex-wrap items-center justify-between gap-2">
          <Button variant="outline" onClick={() => router.push("/patients")} className="w-fit">
            ← Liste des patients
          </Button>
          <Button onClick={() => router.push(`/consultations/new?patientId=${id}`)}>
            + Nouvelle consultation
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : !patient ? (
          <p className="text-text-muted">Patient introuvable</p>
        ) : (
          <div className="flex flex-col items-stretch gap-6">
            {/* Info patient */}
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-row flex-wrap items-start justify-between gap-2 w-full">
                  <div className="min-w-0">
                    <CardTitle className="text-xl truncate">
                      {patient.prenom} {patient.nom}
                    </CardTitle>
                    <p className="text-sm text-text-muted mt-1">{patient.telephone}</p>
                    <p className="text-xs text-text-muted mt-1">
                      Patient depuis le {new Date(patient.date_creation).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleArchive} className="text-error-danger shrink-0">
                    Archiver
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Historique des consultations */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  Historique médical ({patient.consultations?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!patient.consultations?.length ? (
                  <div className="py-8 text-center">
                    <p className="text-text-muted">Aucune consultation pour ce patient</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patient.consultations.map((c: any) => (
                      <Card key={c.id_consultation} className="w-full border-border-divider">
                        <CardHeader className="pb-2">
                          <div className="flex flex-row flex-wrap items-center justify-between gap-2">
                            <CardTitle className="text-base">
                              {new Date(c.date_heure).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {c.examens?.length ?? 0} examen(s)
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Diagnostic */}
                          <div>
                            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                              Diagnostic / Notes
                            </p>
                            <p className="text-sm text-text-main whitespace-pre-wrap">
                              {c.diagnostic || "Aucun diagnostic"}
                            </p>
                          </div>

                          {/* Ordonnances */}
                          {c.documents?.filter((d: any) => d.type_document === "ordonnance").length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                                Ordonnances
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {c.documents
                                  .filter((d: any) => d.type_document === "ordonnance")
                                  .map((d: any) => (
                                    <a
                                      key={d.id_document}
                                      href={d.chemin_image}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-border-divider px-3 py-1.5 text-sm text-primary-forest hover:bg-primary-forest/5 transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                      Voir l&apos;ordonnance
                                    </a>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Carnet */}
                          {c.documents?.filter((d: any) => d.type_document === "carnet").length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                                Carnet de santé
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {c.documents
                                  .filter((d: any) => d.type_document === "carnet")
                                  .map((d: any) => (
                                    <a
                                      key={d.id_document}
                                      href={d.chemin_image}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-border-divider px-3 py-1.5 text-sm text-primary-forest hover:bg-primary-forest/5 transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                      Voir le document
                                    </a>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Examens de laboratoire */}
                          {c.examens?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                                Examens de laboratoire
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {c.examens.map((e: any) => (
                                  <div
                                    key={e.id_examen}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border-divider px-3 py-1 text-xs"
                                  >
                                    <span className="text-text-main">
                                      {e.type_examen?.libelle ?? "Analyse"}
                                    </span>
                                    <Badge className={`${STATUT_COLORS[e.statut] ?? ""} text-[10px]`}>
                                      {STATUT_LABELS[e.statut] ?? e.statut}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
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