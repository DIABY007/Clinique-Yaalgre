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

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<
    (Patient & { consultations?: unknown[] }) | null
  >(null);
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
        <Button
          variant="outline"
          onClick={() => router.push("/patients")}
          className="w-fit"
        >
          ← Liste des patients
        </Button>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !patient ? (
          <p className="text-text-muted">Patient introuvable</p>
        ) : (
          <div className="flex flex-col items-stretch gap-6">
            {/* Info patient */}
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-row items-start justify-between gap-2 w-full">
                  <div className="min-w-0">
                    <CardTitle className="text-xl truncate">
                      {patient.prenom} {patient.nom}
                    </CardTitle>
                    <p className="text-sm text-text-muted mt-1">
                      {patient.telephone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge>
                      {new Date(patient.date_creation).toLocaleDateString()}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchive}
                      className="text-error-danger"
                    >
                      Archiver
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Historique des consultations */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  Consultations ({patient.consultations?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!patient.consultations ||
                patient.consultations.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-text-muted">
                      Aucune consultation pour ce patient
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() =>
                        router.push(
                          `/consultations/new?patientId=${patient.id_patient}`
                        )
                      }
                    >
                      Nouvelle consultation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patient.consultations.map((c: any) => (
                      <div
                        key={c.id_consultation}
                        className="rounded-xl border border-border-divider p-4"
                      >
                        <p className="font-medium text-text-main">
                          {new Date(c.date_heure).toLocaleString()}
                        </p>
                        <p className="text-sm text-text-muted mt-1">
                          {c.diagnostic || "Aucun diagnostic"}
                        </p>
                      </div>
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