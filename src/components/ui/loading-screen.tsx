"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "Chargement...",
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface-app">
      <div className="flex flex-col items-center gap-6">
        <div className="size-48 sm:size-64">
          <DotLottieReact
            src="/loading.lottie"
            autoplay
            loop
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <p className="text-base font-medium text-text-muted animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}