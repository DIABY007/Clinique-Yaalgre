"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
import { createConsultation, fetchExamTypes, saveDocumentRecord, prescribeExam } from "@/lib/supabase/consultations";
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
  const [files, setFiles] = useState<File[]>([]);
  const [examTypes, setExamTypes] = useState<
    { id_type_examen: string; libelle: string }[]
  >([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [conversionInfo, setConversionInfo] = useState<
    { name: string; saved: number }[]
  >([]);

  useEffect(() => {
    fetchExamTypes()
      .then(setExamTypes)
      .catch(() => showToast("Erreur chargement examens", "error"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      showToast("Patient non sélectionné", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Créer la consultation
      const consultation = await createConsultation({
        id_patient: patientId,
        id_utilisateur: userId,
        diagnostic,
      });

      const cId = consultation.id_consultation;

      // 2. Uploader les documents (conversion WebP)
      for (const file of files) {
        try {
          const result = await convertToWebP(file);

          // Upload WebP vers Supabase
          const url = await uploadDocumentWebP(
            result.blob,
            result.webpName,
            cId
          );

          // Enregistrer le document dans la table document_importe
          await saveDocumentRecord({
            id_consultation: cId,
            type_document: "image",
            chemin_image: url,
          });

          const savedKB = Math.round(
            (result.originalSize - result.webpSize) / 1024
          );
          setConversionInfo((prev) => [
            ...prev,
            { name: result.originalName, saved: savedKB },
          ]);
        } catch (err) {
          console.error("WebP conversion error:", err);
          showToast(
            `Erreur conversion ${file.name}, fichier ignoré`,
            "warning"
          );
        }
      }

      // 3. Prescrire les examens sélectionnés
      for (const typeId of selectedExams) {
        await prescribeExam({
          id_consultation: cId,
          id_type_examen: typeId,
        });
      }

      showToast("Consultation créée avec succès", "success");
      onSuccess?.();
      router.push(`/patients/${patientId}`);
      router.refresh();
    } catch {
      showToast("Erreur lors de la création", "error");
    } finally {
      setLoading(false);
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

          {/* Upload documents avec conversion WebP */}
          <div className="space-y-2">
            <Label>Documents (images) — conversion WebP automatique</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            {files.length > 0 && (
              <p className="text-xs text-text-muted">
                {files.length} fichier(s) sélectionné(s) — seront convertis en
                WebP
              </p>
            )}
            {conversionInfo.length > 0 && (
              <div className="space-y-1">
                {conversionInfo.map((info, i) => (
                  <p key={i} className="text-xs text-success-valid">
                    ✓ {info.name} : {info.saved} Ko économisés
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Prescription d'examens */}
          {examTypes.length > 0 && (
            <div className="space-y-2">
              <Label>Examens de laboratoire</Label>
              <div className="flex flex-wrap gap-2">
                {examTypes.map((exam) => (
                  <button
                    key={exam.id_type_examen}
                    type="button"
                    onClick={() => toggleExam(exam.id_type_examen)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors
                      ${
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
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}