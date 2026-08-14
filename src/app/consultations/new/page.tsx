"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { ConsultationForm } from "@/components/consultations/consultation-form";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuth } from "@/contexts/auth-context";

function NewConsultationContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";
  const router = useRouter();
  const { user } = useAuth();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
      {!patientId ? (
        <div className="text-center py-12">
          <p className="text-text-muted mb-4">
            Veuillez sélectionner un patient d&apos;abord
          </p>
          <button
            onClick={() => router.push("/patients")}
            className="text-primary-forest font-medium hover:underline"
          >
            Aller à la liste des patients →
          </button>
        </div>
      ) : (
        <ConsultationForm
          patientId={patientId}
          userId={user?.id_utilisateur ?? ""}
        />
      )}
    </main>
  );
}

export default function NewConsultationPage() {
  return (
    <LoginWrapper>
      <Navbar />
      <Suspense fallback={<LoadingScreen message="Chargement..." />}>
        <NewConsultationContent />
      </Suspense>
    </LoginWrapper>
  );
}