"use client";

import { useState, useCallback } from "react";
import { showToast } from "@/lib/toast";

interface PinPadProps {
  onComplete: (pin: string) => void;
  onError?: (message: string) => void;
  maxLength?: number;
  error?: string | null;
  attemptsRemaining?: number;
}

export function PinPad({
  onComplete,
  maxLength = 4,
  error: externalError,
  attemptsRemaining = 5,
}: PinPadProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDigit = useCallback(
    (digit: string) => {
      setError(null);
      if (pin.length >= maxLength) return;
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === maxLength) {
        setTimeout(() => {
          onComplete(newPin);
        }, 150);
      }
    },
    [pin, maxLength, onComplete]
  );

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setPin("");
    setError(null);
  }, []);

  const displayError = externalError || error;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Indicateur de code */}
      <div className="flex gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`size-4 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? "border-primary-forest bg-primary-forest scale-110"
                : "border-border-divider bg-surface-card"
            }`}
          />
        ))}
      </div>

      {/* Message d'erreur */}
      {displayError && (
        <p className="text-sm text-error-danger font-medium text-center animate-in fade-in">
          {displayError}
        </p>
      )}

      {/* Tentatives restantes */}
      {attemptsRemaining < 5 && attemptsRemaining > 0 && !displayError && (
        <p className="text-xs text-text-muted">
          Tentatives restantes : {attemptsRemaining}
        </p>
      )}

      {/* Pavé numérique */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="flex items-center justify-center h-16 text-xl font-semibold rounded-xl
                       bg-surface-card border border-border-divider text-text-main
                       active:scale-95 active:bg-primary-forest/5
                       transition-all duration-150 select-none
                       hover:border-primary-forest/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-forest"
            aria-label={`Chiffre ${digit}`}
          >
            {digit}
          </button>
        ))}

        {/* Bouton effacer */}
        <button
          onClick={handleClear}
          className="flex items-center justify-center h-16 text-sm font-medium rounded-xl
                     bg-surface-card border border-border-divider text-text-muted
                     active:scale-95 transition-all duration-150 select-none
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-forest"
          aria-label="Effacer"
        >
          Effacer
        </button>

        {/* Chiffre 0 */}
        <button
          onClick={() => handleDigit("0")}
          className="flex items-center justify-center h-16 text-xl font-semibold rounded-xl
                     bg-surface-card border border-border-divider text-text-main
                     active:scale-95 active:bg-primary-forest/5
                     transition-all duration-150 select-none
                     hover:border-primary-forest/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-forest"
          aria-label="Chiffre 0"
        >
          0
        </button>

        {/* Bouton retour */}
        <button
          onClick={handleDelete}
          className="flex items-center justify-center h-16 rounded-xl
                     bg-surface-card border border-border-divider text-text-muted
                     active:scale-95 transition-all duration-150 select-none
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-forest"
          aria-label="Supprimer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-delete"
          >
            <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
            <line x1="18" x2="12" y1="9" y2="15" />
            <line x1="12" x2="18" y1="9" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  );
}