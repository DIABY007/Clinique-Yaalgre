"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { getAllUtilisateurs, syncUtilisateurs, seedDefaultUser } from "@/db/database";
import { verifyPin } from "@/lib/crypto";
import type { Utilisateur } from "@/db/database";

// ── Types ──
interface AuthState {
  /** Niveau 1 : token Supabase actif */
  isSupabaseReady: boolean;
  /** Niveau 2 : utilisateur identifié par PIN */
  user: Utilisateur | null;
  /** Phase de chargement */
  isLoading: boolean;
  /** Message d'erreur */
  error: string | null;
  /** Nombre de tentatives PIN restantes */
  attemptsRemaining: number;
}

interface AuthContextType extends AuthState {
  loginWithPin: (nom: string, pin: string) => Promise<boolean>;
  logout: () => void;
  verifyAccess: () => boolean;
}

const initialState: AuthState = {
  isSupabaseReady: false,
  user: null,
  isLoading: true,
  error: null,
  attemptsRemaining: 5,
};

// ── Session PIN persistée dans sessionStorage ──
const SESSION_KEY = "clinique_session";

function saveSession(user: Utilisateur) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id_utilisateur: user.id_utilisateur, nom: user.nom, role: user.role, code_pin_hash: user.code_pin_hash, est_actif: user.est_actif })
    );
  } catch {}
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

function restoreSession(): Utilisateur | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Utilisateur;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──
export function AuthProvider({ children }: { children: ReactNode }) {
  // Restaurer la session PIN au montage (avant tout réseau)
  const [state, setState] = useState<AuthState>(() => {
    const saved = restoreSession();
    if (saved) {
      return { ...initialState, user: saved, isLoading: false, isSupabaseReady: true };
    }
    return initialState;
  });

  // Niveau 1 : connexion silencieuse Supabase (avec timeout)
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    const supabase = createClient();

    // Force ready after 4s even if Supabase hangs (mobile fallback)
    timeoutId = setTimeout(async () => {
      if (mounted) {
        await seedDefaultUser();
        setState((prev) => ({
          ...prev,
          isSupabaseReady: true,
          isLoading: false,
        }));
      }
    }, 4000);

    async function initSupabase() {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: "acceuil@clinique.com",
          password: "xDnNe551&&&",
        });

        if (error) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) {
            console.warn("Auth Supabase silencieuse:", error.message);
          }
        }

        if (mounted) {
          // Sync utilisateurs (timeout via Promise.race)
          try {
            const usersPromise = supabase
              .from("utilisateur")
              .select("id_utilisateur, nom, role, code_pin_hash, est_actif")
              .eq("est_actif", true);

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("sync timeout")), 3000)
            );

            const { data: users } = (await Promise.race([
              usersPromise,
              timeoutPromise,
            ])) as any;

            if (users && users.length > 0) {
              await syncUtilisateurs(users);
            }
          } catch {
            // Cache local utilisé en cas d'échec → seed fallback
            await seedDefaultUser();
          }

          clearTimeout(timeoutId);
          if (mounted) {
            setState((prev) => ({
              ...prev,
              isSupabaseReady: true,
              isLoading: false,
            }));
          }
        }
      } catch {
        clearTimeout(timeoutId);
        if (mounted) {
          await seedDefaultUser();
          setState((prev) => ({
            ...prev,
            isSupabaseReady: true,
            isLoading: false,
          }));
        }
      }
    }

    initSupabase();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Niveau 2 : authentification par PIN
  const loginWithPin = useCallback(
    async (nom: string, pin: string): Promise<boolean> => {
      if (state.attemptsRemaining <= 0) {
        setState((prev) => ({
          ...prev,
          error: "Trop de tentatives. Réessayez plus tard.",
        }));
        return false;
      }

      try {
        // Chercher l'utilisateur dans Dexie (IndexedDB locale)
        const users = await getAllUtilisateurs();

        const foundUser = users.find(
          (u) => u.nom.toLowerCase() === nom.toLowerCase() && u.est_actif
        );

        if (!foundUser) {
          setState((prev) => ({
            ...prev,
            error: "Utilisateur introuvable",
            attemptsRemaining: prev.attemptsRemaining - 1,
          }));
          return false;
        }

        // Vérifier le PIN
        const isValid = await verifyPin(
          pin,
          foundUser.nom,
          foundUser.code_pin_hash
        );

        if (isValid) {
          saveSession(foundUser);
          setState((prev) => ({
            ...prev,
            user: foundUser,
            error: null,
            isLoading: false,
            attemptsRemaining: 5,
          }));
          return true;
        } else {
          setState((prev) => ({
            ...prev,
            error: "Code PIN incorrect",
            attemptsRemaining: prev.attemptsRemaining - 1,
          }));
          return false;
        }
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Erreur de vérification",
          attemptsRemaining: prev.attemptsRemaining - 1,
        }));
        return false;
      }
    },
    [state.attemptsRemaining]
  );

  // Déconnexion (Niveau 2 uniquement)
  const logout = useCallback(() => {
    clearSession();
    setState((prev) => ({
      ...prev,
      user: null,
      error: null,
      attemptsRemaining: 5,
    }));
  }, []);

  // Vérification d'accès pour les actions critiques
  const verifyAccess = useCallback((): boolean => {
    return state.user !== null;
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginWithPin,
        logout,
        verifyAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}