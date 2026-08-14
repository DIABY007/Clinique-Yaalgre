"use client";

import { useRouter } from "next/navigation";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { PatientForm } from "@/components/patients/patient-form";

export default function NewPatientPage() {
  const router = useRouter();

  return (
    <LoginWrapper>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <PatientForm onSuccess={() => { window.location.href = "/patients"; }} />
      </main>
    </LoginWrapper>
  );
}