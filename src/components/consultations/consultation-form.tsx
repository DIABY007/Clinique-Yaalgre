"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import {
  createConsultation,
  fetchExamTypes,
  saveDocumentRecord,
  prescribeExam,
} from "@/lib/supabase/consultations";
import { convertToWebP, uploadDocumentWebP } from "@/lib/webp-converter";

interface ConsultationFormProps {
  patientId: string;
  userId: string;
  onSuccess?: () => void;
}

export function ConsultationForm({
  patientId,
  userId,
  onSuccess,
}: ConsultationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState("");
  const [ordonnanceFiles, setOrdonnanceFiles] = useState<File[]>([]);
  const [carnetFiles, setCarnetFiles] = useState<File[]>([]);
  const [examTypes, setExamTypes] = useState<
    { id_type_examen: string; libelle: string }[]
  >([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchExamTypes()
      .then(setExamTypes)
      .catch(() => showToast("Erreur chargement examens", "error"));
  }, []);

  const uploadFiles = useCallback(
    async (
      cId: string,
      files: File[],
      typeDoc: "ordonnance" | "carnet",
      label: string
    ) => {
      for (const file of files) {
        try {
          const result = await convertToWebP(file);
          const url = await uploadDocumentWebP(result.blob, result.webpName, cId);
          await saveDocumentRecord({
            id_consultation: cId,
            type_document: typeDoc,
            chemin_image: url,
          });
          const savedKB = Math.round((result.originalSize - result.webpSize) / 1024);
          showToast(`${label} : ${result.originalName} (${savedKB} Ko économisés)`, "success");
        } catch (err) {
          console.error(`Erreur ${label}:`, err);
          showToast(`Erreur conversion ${file.name} (${label})`, "warning");
        }
      }
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      showToast("Patient non sélectionné", "error");
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      const consultation = await createConsultation({
        id_patient: patientId,
        id_utilisateur: userId,
        diagnostic,
      });

      const cId = consultation.id_consultation;

      // Upload ordonnances
      await uploadFiles(cId, ordonnanceFiles, "ordonnance", "Ordonnance");

      // Upload carnets
      await uploadFiles(cId, carnetFiles, "carnet", "Carnet");

      // Prescrire les examens
      for (const typeId of selectedExams) {
        await prescribeExam({ id_consultation: cId, id_type_examen: typeId });
      }

      showToast("Consultation créée avec succès", "success");
      onSuccess?.();
      router.push(`/patients/${patientId}`);
      router.refresh();
    } catch {
      showToast("Erreur lors de la création", "error");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const toggleExam = (id: string) => {
    setSelectedExams((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nouvelle Consultation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Diagnostic */}
          <div className="space-y-2">
            <Label htmlFor="diagnostic">Diagnostic / Notes</Label>
            <textarea
              id="diagnostic"
              value={diagnostic}
              onChange={(e) => setDiagnostic(e.target.value)}
              className="flex min-h-[100px] w-full rounded-xl border border-border-divider bg-surface-card px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-forest"
              placeholder="Observations, diagnostic..."
            />
          </div>

          {/* Upload Ordonnance */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-text-main">
              📋 Ordonnance
            </Label>
            <p className="text-xs text-text-muted">
              Prescription médicale, médicaments, traitements
            </p>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setOrdonnanceFiles(Array.from(e.target.files ?? []))
              }
            />
            {ordonnanceFiles.length > 0 && (
              <p className="text-xs text-text-muted">
                {ordonnanceFiles.length} fichier(s) — seront convertis en WebP
              </p>
            )}
          </div>

          {/* Upload Carnet */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-text-main">
              📓 Carnet de santé
            </Label>
            <p className="text-xs text-text-muted">
              Analyses, résultats, documents du carnet de santé
            </p>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setCarnetFiles(Array.from(e.target.files ?? []))
              }
            />
            {carnetFiles.length > 0 && (
              <p className="text-xs text-text-muted">
                {carnetFiles.length} fichier(s) — seront convertis en WebP
              </p>
            )}
          </div>

          {/* Prescription examens */}
          {examTypes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-base font-semibold text-text-main">
                🔬 Examens de laboratoire
              </Label>
              <div className="flex flex-wrap gap-2">
                {examTypes.map((exam) => (
                  <button
                    key={exam.id_type_examen}
                    type="button"
                    onClick={() => toggleExam(exam.id_type_examen)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedExams.includes(exam.id_type_examen)
                        ? "bg-primary-forest text-white"
                        : "bg-muted text-text-main hover:bg-primary-forest/10"
                    }`}
                  >
                    {exam.libelle}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer la consultation"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}