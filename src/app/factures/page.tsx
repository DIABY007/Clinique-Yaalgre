"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/lib/toast";
import { fetchFactures } from "@/lib/supabase/factures";

export default function FacturesPage() {
  const [factures, setFactures] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data, count: c } = await fetchFactures(page);
      setFactures(data);
      setCount(c);
    } catch {
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  return (
    <LoginWrapper>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 flex flex-col items-stretch gap-6">
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
              <CardTitle className="truncate">Factures ({count})</CardTitle>
              <div className="flex gap-2 shrink-0">
                <Link href="/factures/nouvelle">
                  <Button size="sm">+ Nouvelle</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={load}>
                  Actualiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : factures.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text-muted">Aucune facture</p>
              </div>
            ) : (
              <div className="space-y-2">
                {factures.map((f: any) => (
                  <Link
                    key={f.id_facture}
                    href={`/factures/${f.id_facture}`}
                    className="flex items-center justify-between rounded-xl border border-border-divider bg-surface-card p-4 hover:border-primary-forest/20 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-text-main">
                        {f.consultation?.patient?.prenom ?? ""}{" "}
                        {f.consultation?.patient?.nom ?? "N/A"}
                      </p>
                      <p className="text-sm text-text-muted">
                        {new Date(f.date_facture).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {f.paiements?.length ?? 0} paiement(s)
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </LoginWrapper>
  );
}