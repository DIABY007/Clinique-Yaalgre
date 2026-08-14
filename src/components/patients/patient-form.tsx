"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreatePatient } from "@/hooks/use-patient-mutation";

interface PatientFormProps {
  onSuccess?: () => void;
}

export function PatientForm({ onSuccess }: PatientFormProps) {
  const { mutateAsync: createPatient, isPending: loading } = useCreatePatient();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nom.trim() || !form.prenom.trim() || !form.telephone.trim()) {
      return;
    }

    try {
      await createPatient(form);
      setForm({ nom: "", prenom: "", telephone: "" });
      onSuccess?.();
    } catch {
      // Les toasts sont déjà gérés par le hook
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nouveau Patient</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">
                Nom <span className="text-error-danger">*</span>
              </Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom du patient"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">
                Prénom <span className="text-error-danger">*</span>
              </Label>
              <Input
                id="prenom"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                placeholder="Prénom du patient"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telephone">
              Téléphone <span className="text-error-danger">*</span>
            </Label>
            <Input
              id="telephone"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              placeholder="70 00 00 00"
              type="tel"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm({ nom: "", prenom: "", telephone: "" })}
            >
              Réinitialiser
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}