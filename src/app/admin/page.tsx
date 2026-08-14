"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/lib/toast";
import { PinPad } from "@/components/auth/pin-pad";
import { hashPinSync } from "@/lib/crypto";
import { fetchUsers, createUser, toggleUserStatus } from "@/lib/supabase/admin";
import Image from "next/image";

const ADMIN_PIN = "1955";

type AdminStep = "login" | "dashboard";

export default function AdminPage() {
  const router = useRouter();
  const [step, setStep] = useState<AdminStep>("login");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire création
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("medecin");
  const [pinUser, setPinUser] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const u = await fetchUsers();
      setUsers(u);
    } catch {
      showToast("Erreur chargement utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (pin === ADMIN_PIN) {
      showToast("Accès admin autorisé", "success");
      setStep("dashboard");
      loadUsers();
    } else {
      showToast("Code PIN admin incorrect", "error");
    }
  };

  const handleCreateUser = async () => {
    if (!nom.trim() || !pinUser.trim()) {
      showToast("Nom et PIN requis", "warning");
      return;
    }
    if (pinUser.length < 4) {
      showToast("Le PIN doit faire au moins 4 chiffres", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const hash = hashPinSync(pinUser, nom);
      await createUser({ nom: nom.trim(), role, code_pin_hash: hash });
      showToast(`Utilisateur "${nom}" créé avec le PIN ${pinUser}`, "success");
      setNom("");
      setPinUser("");
      loadUsers();
    } catch (err: any) {
      showToast(err?.message || "Erreur création", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleUserStatus(id, !current);
      showToast(`Statut mis à jour`, "success");
      loadUsers();
    } catch {
      showToast("Erreur", "error");
    }
  };

  if (step === "login") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-app px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/logo.png"
              alt="Clinique Yaalgre"
              width={140}
              height={47}
              className="h-14 w-auto"
              priority
            />
            <h1 className="text-xl font-semibold text-text-main">
              Administration
            </h1>
            <p className="text-sm text-text-muted text-center">
              Entrez le code PIN administrateur
            </p>
          </div>
          <PinPad onComplete={handlePinComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-app">
      <header className="sticky top-0 z-50 border-b border-border-divider bg-surface-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Clinique Yaalgre"
              width={80}
              height={27}
              className="h-8 w-auto"
            />
            <span className="text-sm font-medium text-text-main">Admin</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              Accueil
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("login");
                setUsers([]);
              }}
            >
              Quitter
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
        {/* Créer un utilisateur */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Nouvel utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Dr Diallo"
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-border-divider bg-surface-card px-3 py-2.5 text-sm"
                >
                  <option value="medecin">Médecin</option>
                  <option value="infirmier">Infirmier</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="administrateur">Administrateur</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Code PIN (min 4 chiffres)</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={pinUser}
                  onChange={(e) => setPinUser(e.target.value.replace(/\D/g, ""))}
                  placeholder="1234"
                  maxLength={6}
                />
              </div>
            </div>
            <Button onClick={handleCreateUser} disabled={submitting}>
              {submitting ? "Création..." : "Créer l'utilisateur"}
            </Button>
          </CardContent>
        </Card>

        {/* Liste des utilisateurs */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Utilisateurs ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-text-muted text-center py-6">Aucun utilisateur</p>
            ) : (
              <div className="space-y-2">
                {users.map((u: any) => (
                  <div
                    key={u.id_utilisateur}
                    className="flex items-center justify-between rounded-xl border border-border-divider p-4"
                  >
                    <div>
                      <p className="font-medium text-text-main">{u.nom}</p>
                      <p className="text-sm text-text-muted capitalize">{u.role}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={u.est_actif ? "default" : "secondary"}>
                        {u.est_actif ? "Actif" : "Inactif"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(u.id_utilisateur, u.est_actif)}
                      >
                        {u.est_actif ? "Désactiver" : "Réactiver"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}