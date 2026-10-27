"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PinPad } from "@/components/auth/pin-pad";
import { useAuth } from "@/contexts/auth-context";
import { showToast } from "@/lib/toast";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { getAllUtilisateurs, seedDefaultUser, DEFAULT_USER } from "@/db/database";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPin, isSupabaseReady, user, isLoading } = useAuth();
  const [step, setStep] = useState<"select" | "pin">("select");
  const [selectedUser, setSelectedUser] = useState<{
    nom: string;
    role: string;
  } | null>(null);
  const [users, setUsers] = useState<{ nom: string; role: string }[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // Rediriger vers onboarding si pas fait (tolérant aux restrictions de stockage)
  useEffect(() => {
    try {
      const onboardingDone = typeof window !== "undefined" ? localStorage.getItem("onboarding_done") : null;
      if (!onboardingDone && !isLoading) {
        router.replace("/onboarding");
      }
    } catch {
      // Ignorer si localStorage est bloqué (mode privé / cookies désactivés)
    }
  }, [isLoading, router]);

  // Charger les utilisateurs immédiatement depuis la base locale (Dexie)
  // et recharger dès que Supabase a synchronisé les utilisateurs distants
  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      try {
        const u = await getAllUtilisateurs();
        if (mounted && u && u.length > 0) {
          setUsers(
            u.map((user) => ({
              nom: user.nom,
              role: user.role,
            }))
          );
        }
      } catch (err) {
        console.warn("Erreur chargement utilisateurs:", err);
        if (mounted) {
          setUsers([{ nom: DEFAULT_USER.nom, role: DEFAULT_USER.role }]);
        }
      }
    }

    loadUsers();
    return () => {
      mounted = false;
    };
  }, [isSupabaseReady]);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      showToast(`Bienvenue ${user.nom}`, "success");
      router.push("/");
    }
  }, [user, router]);

  const handleSelectUser = (nom: string, role: string) => {
    setSelectedUser({ nom, role });
    setStep("pin");
  };

  const handlePinComplete = async (pin: string) => {
    if (!selectedUser || isVerifying) return;
    setIsVerifying(true);

    try {
      const success = await loginWithPin(selectedUser.nom, pin);
      if (success) {
        showToast(`Bienvenue ${selectedUser.nom}`, "success");
        router.push("/");
      } else {
        showToast("Code PIN incorrect", "error");
        // Reset PIN pad state by toggling step
      }
    } catch {
      showToast("Erreur de connexion", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    setStep("select");
    setSelectedUser(null);
  };

  if (isLoading) {
    return <LoadingScreen message="Préparation..." />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-app px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo + Titre */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.png"
            alt="Clinique Yaalgre"
            width={160}
            height={53}
            className="h-14 w-auto"
            priority
          />
          <h1 className="text-xl font-semibold text-text-main">
            Clinique Yaalgre
          </h1>
        </div>

        {step === "select" && users.length > 0 && (
          <div className="space-y-4">
            <p className="text-center text-sm text-text-muted">
              Sélectionnez votre profil
            </p>
            <div className="space-y-2">
              {users.map((u) => (
                <button
                  key={u.nom}
                  onClick={() => handleSelectUser(u.nom, u.role)}
                  className="w-full rounded-xl border border-border-divider bg-surface-card
                             p-4 text-left transition-all duration-200
                             hover:border-primary-forest/30 hover:shadow-sm
                             active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-forest"
                >
                  <span className="block text-base font-medium text-text-main">
                    {u.nom}
                  </span>
                  <span className="block text-sm text-text-muted capitalize">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "select" && users.length === 0 && !isLoading && (
          <div className="text-center space-y-3">
            <p className="text-text-muted">
              Aucun utilisateur trouvé. Veuillez contacter l&apos;administrateur.
            </p>
          </div>
        )}

        {step === "pin" && selectedUser && (
          <div className="space-y-6">
            {/* Info utilisateur */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-sm text-primary-forest font-medium hover:underline
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-forest rounded"
              >
                ← Retour
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-text-main">
                  {selectedUser.nom}
                </p>
                <p className="text-xs text-text-muted capitalize">
                  {selectedUser.role}
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-text-muted">
                Entrez votre code PIN à 4 chiffres
              </p>
            </div>

            <PinPad
              onComplete={handlePinComplete}
              error={null}
            />

            {isVerifying && (
              <p className="text-center text-sm text-text-muted animate-pulse">
                Vérification...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}