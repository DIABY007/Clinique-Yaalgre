"use client";

import { useState, Component, type ReactNode } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LoadingScreenProps {
  message?: string;
}

class LottieErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("Lottie error caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function LoadingScreen({
  message = "Chargement...",
}: LoadingScreenProps) {
  const [loadError, setLoadError] = useState(false);

  const fallbackSpinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="size-12 rounded-full border-4 border-primary-forest/20 border-t-primary-forest animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface-app">
      <div className="flex flex-col items-center gap-6">
        <div className="size-48 sm:size-64 flex items-center justify-center">
          <LottieErrorBoundary fallback={fallbackSpinner}>
            {!loadError ? (
              <DotLottieReact
                src="/loading.lottie"
                autoplay
                loop
                style={{ width: "100%", height: "100%" }}
                dotLottieRefCallback={(dotLottie) => {
                  if (dotLottie) {
                    dotLottie.addEventListener("loadError", () => setLoadError(true));
                  }
                }}
              />
            ) : (
              fallbackSpinner
            )}
          </LottieErrorBoundary>
        </div>
        <p className="text-base font-medium text-text-muted animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}