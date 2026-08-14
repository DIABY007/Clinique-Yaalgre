"use client";

import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { onlineManager as customOnlineManager } from "@/lib/online-manager";
import { SyncIndicator } from "@/components/ui/sync-indicator";
import { BottomNav } from "@/components/layout/bottom-nav";

// Connecter le OnlineManager de TanStack Query à notre gestionnaire
onlineManager.setEventListener((setOnline) => {
  return customOnlineManager.subscribe(setOnline);
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: (failureCount, error) => {
              // Ne pas réessayer les erreurs réseau
              const msg =
                error?.message?.toLowerCase() ?? "";
              if (
                msg.includes("fetch") ||
                msg.includes("network") ||
                msg.includes("networkerror")
              ) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            networkMode: "offlineFirst",
          },
          mutations: {
            networkMode: "offlineFirst",
          },
        },
      })
  );

  // Nettoyage
  useEffect(() => {
    return () => {
      customOnlineManager.destroy();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <BottomNav />
      <SyncIndicator />
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}