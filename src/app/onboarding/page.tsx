"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const STEPS = [
  {
    title: "Bienvenue à la Clinique Yaalgre",
    description:
      "L'application de gestion complète pour votre clinique. Gérez les patients, les consultations, les examens et la facturation en toute simplicité.",
    icon: "🏥",
  },
  {
    title: "Sécurisé par code PIN",
    description:
      "Chaque utilisateur possède un code PIN personnel à 4 chiffres. L'application fonctionne même sans connexion internet — vos données sont stockées localement.",
    icon: "🔐",
  },
  {
    title: "Prêt à travailler",
    description:
      "Enregistrez un nouveau patient, commencez une consultation, ou consultez le tableau de bord. Tout est accessible depuis la barre de navigation.",
    icon: "🚀",
    cta: "Commencer",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const goToLogin = useCallback(() => {
    try {
      localStorage.setItem("onboarding_done", "true");
    } catch {}
    window.location.href = "/login";
  }, []);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      goToLogin();
    }
  }, [step, goToLogin]);

  const handleSkip = useCallback(() => {
    goToLogin();
  }, [goToLogin]);

  return (
    <div className="flex min-h-dvh flex-col bg-surface-app select-none" style={{ minHeight: "100dvh" }}>
      {/* Skip button */}
      <div className="flex justify-end px-4 pt-4">
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-medium text-text-muted active:text-text-main px-4 py-3 min-h-[44px] rounded-lg"
        >
          Passer
        </button>
      </div>

      {/* Content - takes remaining space */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-8 text-center max-w-sm">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/logo.png"
              alt="Clinique Yaalgre"
              width={140}
              height={47}
              className="h-14 w-auto"
              priority
            />
            <span className="text-5xl">{current.icon}</span>
          </div>

          <h1 className="text-2xl font-semibold text-text-main leading-tight">
            {current.title}
          </h1>

          <p className="text-base text-text-muted leading-relaxed">
            {current.description}
          </p>
        </div>
      </div>

      {/* Bottom controls - normal flow, no fixed */}
      <div className="border-t border-border-divider bg-surface-card px-6 py-5">
        <div className="mx-auto max-w-sm flex flex-col items-center gap-4">
          {/* Dots */}
          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-8 bg-primary-forest"
                    : "w-2 bg-border-divider"
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-12 text-base font-semibold rounded-xl text-white bg-primary-forest
                       active:bg-[#094436]
                       transition-colors duration-150
                       touch-manipulation"
          >
            {current.cta || "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}