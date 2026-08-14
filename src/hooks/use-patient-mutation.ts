"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPatient } from "@/lib/supabase/patients";
import { showToast } from "@/lib/toast";

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      showToast("Patient enregistré avec succès", "success");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: () => {
      showToast("Erreur de réseau : Création impossible", "error");
    },
    networkMode: "offlineFirst",
  });
}