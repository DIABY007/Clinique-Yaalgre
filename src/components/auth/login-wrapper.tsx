"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface LoginWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper qui protège les routes nécessitant une authentification.
 * Redirige vers /login si l'utilisateur n'est pas connecté.
 * Timeout de sécurité : si l'auth bloque, on force après 6s.
 */
export function LoginWrapper({ children }: LoginWrapperProps) {
  const router = useRouter();
  const { user, isLoading, isSupabaseReady } = useAuth();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;

    if (isSupabaseReady && !user) {
      redirected.current = true;
      // Try router.replace first, fallback to full URL after 500ms
      router.replace("/login");
      const fallback = setTimeout(() => {
        if (!redirected.current) return;
        window.location.href = "/login";
      }, 500);
      return () => clearTimeout(fallback);
    }
  }, [user, isSupabaseReady, router]);

  // Force redirect après 6s quoi qu'il arrive (mobile fallback)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        redirected.current = true;
        window.location.href = "/login";
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [user]);

  if (isLoading && !isSupabaseReady) {
    return <LoadingScreen message="Vérification..." />;
  }

  if (!user) {
    return <LoadingScreen message="Redirection..." />;
  }

  return <>{children}</>;
}