"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  return (
    <LoginWrapper>
      <DashboardHome />
    </LoginWrapper>
  );
}

function DashboardHome() {
  const { user, logout } = useAuth();
  const supabase = createClient();
  const [counts, setCounts] = useState({
    patients: 0,
    consultations: 0,
    factures: 0,
    examensEnAttente: 0,
  });

  useEffect(() => {
    Promise.all([
      supabase.from("patient").select("*", { count: "exact", head: true }).eq("est_archive", false),
      supabase.from("consultation").select("*", { count: "exact", head: true }),
      supabase.from("facture").select("*", { count: "exact", head: true }),
      supabase.from("examen_laboratoire").select("*", { count: "exact", head: true }).neq("statut", "RESULTAT_DISPONIBLE"),
    ]).then(([p, c, f, e]) => {
      setCounts({
        patients: p.count ?? 0,
        consultations: c.count ?? 0,
        factures: f.count ?? 0,
        examensEnAttente: e.count ?? 0,
      });
    });
  }, []);

  return (
    <>
      <Navbar userName={user?.nom} userRole={user?.role} />
      <main className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6 pb-24 md:pb-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-main">
            Bonjour, {user?.nom?.split(" ")[0] ?? "Docteur"} 👋
          </h1>
          <p className="text-text-muted mt-1">Tableau de bord</p>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link href="/patients"
            className="rounded-xl border border-border-divider bg-surface-card p-5 transition-all hover:border-primary-forest/30 hover:shadow-sm active:scale-[0.98]">
            <p className="text-3xl font-bold text-primary-forest">{counts.patients}</p>
            <p className="text-sm text-text-muted mt-1">Patients</p>
          </Link>
          <Link href="/examens"
            className="rounded-xl border border-border-divider bg-surface-card p-5 transition-all hover:border-primary-forest/30 hover:shadow-sm active:scale-[0.98]">
            <p className="text-3xl font-bold text-accent-terracotta">{counts.examensEnAttente}</p>
            <p className="text-sm text-text-muted mt-1">Examens en attente</p>
          </Link>
          <Link href="/factures"
            className="rounded-xl border border-border-divider bg-surface-card p-5 transition-all hover:border-primary-forest/30 hover:shadow-sm active:scale-[0.98]">
            <p className="text-3xl font-bold text-secondary-sage">{counts.factures}</p>
            <p className="text-sm text-text-muted mt-1">Factures</p>
          </Link>
          <Link href="/patients/new"
            className="rounded-xl border border-border-divider bg-surface-card p-5 transition-all hover:border-primary-forest/30 hover:shadow-sm active:scale-[0.98]">
            <p className="text-3xl font-bold text-info-notice">{counts.consultations}</p>
            <p className="text-sm text-text-muted mt-1">Consultations</p>
          </Link>
        </div>

        {/* Quick actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text-main mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/patients/new">
              <Button className="w-full h-14 text-sm">➕ Patient</Button>
            </Link>
            <Link href="/patients">
              <Button variant="secondary" className="w-full h-14 text-sm">
                👥 Liste patients
              </Button>
            </Link>
            <Link href="/bilan">
              <Button variant="outline" className="w-full h-14 text-sm">
                📊 Bilan du jour
              </Button>
            </Link>
            <Link href="/stocks">
              <Button variant="outline" className="w-full h-14 text-sm">
                📦 Stock
              </Button>
            </Link>
            <Link href="/depenses">
              <Button variant="outline" className="w-full h-14 text-sm">
                💸 Dépenses
              </Button>
            </Link>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-12 text-center">
          <button
            onClick={logout}
            className="text-sm text-text-muted hover:text-error-danger transition-colors px-4 py-2
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-forest rounded-lg"
          >
            Se déconnecter
          </button>
        </div>
      </main>
      <BottomNav />
    </>
  );
}