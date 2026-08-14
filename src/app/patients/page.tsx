"use client";

import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { PatientList } from "@/components/patients/patient-list";
import { useAuth } from "@/contexts/auth-context";

export default function PatientsPage() {
  const { user } = useAuth();
  return (
    <LoginWrapper>
      <Navbar userName={user?.nom} userRole={user?.role} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <PatientList />
      </main>
    </LoginWrapper>
  );
}