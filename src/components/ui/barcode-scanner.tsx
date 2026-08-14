"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Barcode } from "lucide-react";

interface BarcodeScannerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function BarcodeScanner({
  value,
  onChange,
  placeholder = "Code-barres...",
  autoFocus = false,
}: BarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Nettoyage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Détection native (Chrome ≥ 83)
      if ("BarcodeDetector" in window) {
        detectorRef.current = new (window as any).BarcodeDetector({
          formats: [
            "qr_code",
            "ean_13",
            "ean_8",
            "code_128",
            "code_39",
            "upc_a",
            "upc_e",
            "codabar",
          ],
        });
        scanLoop();
      } else {
        // Fallback : pas de détection automatique, l'utilisateur tape manuellement
        setError("Scan auto non disponible, saisissez le code manuellement");
      }
    } catch {
      setError("Caméra non accessible");
      setScanning(false);
    }
  }, []);

  const scanLoop = useCallback(async () => {
    if (!detectorRef.current || !mountedRef.current) return;

    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      if (codes.length > 0 && mountedRef.current) {
        onChange(codes[0].rawValue);
        stopCamera();
        setOpen(false);
        return;
      }
    } catch {
      // Silencieux
    }

    if (mountedRef.current && scanning) {
      requestAnimationFrame(() => scanLoop());
    }
  }, [onChange, stopCamera, scanning]);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => startCamera(), 500);
  };

  const handleClose = () => {
    stopCamera();
    setOpen(false);
    setError(null);
  };

  return (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleOpen}
          title="Scanner un code-barres"
        >
          <Camera className="size-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scanner un code-barres</DialogTitle>
          </DialogHeader>

          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            {scanning && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="size-8 text-white/50 animate-pulse" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <p className="text-sm text-white/70 text-center">{error}</p>
              </div>
            )}

            {/* Guide overlay */}
            <div className="absolute inset-0 border-[3px] border-white/30 rounded-xl m-8" />
          </div>

          <p className="text-xs text-text-muted text-center">
            Placez le code-barres dans le cadre
          </p>

          <Button variant="outline" onClick={handleClose} className="w-full">
            Fermer
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}