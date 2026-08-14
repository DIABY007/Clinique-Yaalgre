"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/navbar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { showToast } from "@/lib/toast";

export default function DesignSystemPage() {
  const [showLoading, setShowLoading] = useState(false);

  const simulateLoading = () => {
    setShowLoading(true);
    setTimeout(() => setShowLoading(false), 3000);
  };

  return (
    <>
      {showLoading && <LoadingScreen message="Action simulée en cours..." />}
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-12 px-4 py-8 sm:px-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-text-main">
    Design System — Clinique Yaalgre
          </h1>
          <p className="mt-1 text-base text-text-muted">
    Palette, composants et interactions
          </p>
        </div>

        {/* ── Couleurs ── */}
        <section>
          <h2 className="text-lg font-semibold text-text-main">Couleurs</h2>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {[
              { name: "Primary Forest", class: "bg-primary-forest" },
              { name: "Secondary Sage", class: "bg-secondary-sage" },
              { name: "Accent Terracotta", class: "bg-accent-terracotta" },
              { name: "Error Danger", class: "bg-error-danger" },
              { name: "Warning Alert", class: "bg-warning-alert" },
              { name: "Success Valid", class: "bg-success-valid" },
              { name: "Info Notice", class: "bg-info-notice" },
              { name: "Text Main", class: "bg-text-main" },
              { name: "Text Muted", class: "bg-text-muted" },
              { name: "Surface App", class: "bg-surface-app border" },
            ].map((color) => (
              <Card key={color.name} className="overflow-hidden">
                <div className={`h-16 ${color.class}`} />
                <CardContent className="p-2 text-center">
                  <span className="text-sm font-medium text-text-main">
                    {color.name}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Boutons ── */}
        <section>
          <h2 className="text-lg font-semibold text-text-main">Boutons</h2>
          <Separator className="my-3" />
          <div className="flex flex-wrap gap-3">
            <Button>Default (Primary)</Button>
            <Button variant="secondary">Secondary (Sage)</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* ── Badges ── */}
        <section>
          <h2 className="text-lg font-semibold text-text-main">Badges</h2>
          <Separator className="my-3" />
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        {/* ── Formulaire ── */}
        <section>
          <h2 className="text-lg font-semibold text-text-main">Formulaire</h2>
          <Separator className="my-3" />
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Exemple de saisie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du patient</Label>
                <Input id="name" placeholder="Saisir le nom..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" placeholder="70 00 00 00" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Skeleton ── */}
        <section>
          <h2 className="text-lg font-semibold text-text-main">Skeleton</h2>
          <Separator className="my-3" />
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </section>

        {/* ── Toasts ── */}
        <section>
          <h2 className="text-lg font-semibold text-text-main">Toasts</h2>
          <Separator className="my-3" />
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => showToast("Patient enregistré avec succès", "success")}
            >
              Toast Succès
            </Button>
            <Button
              variant="destructive"
              onClick={() => showToast("Erreur lors de l'enregistrement", "error")}
            >
              Toast Erreur
            </Button>
            <Button
              variant="secondary"
              onClick={() => showToast("Information mise à jour", "info")}
            >
              Toast Info
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                showToast("Stock bientôt épuisé", "warning", "Il reste 3 unités")
              }
            >
              Toast Avertissement
            </Button>
          </div>
        </section>

        {/* ── Loading Screen ── */}
        <section>
          <h2 className="text-lg font-semibold text-text-main">
    Écran de Chargement
          </h2>
          <Separator className="my-3" />
          <Button onClick={simulateLoading}>
            Afficher l&apos;écran de chargement (3s)
          </Button>
        </section>
      </main>
    </>
  );
}