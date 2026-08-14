"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
import { fetchPatients, archivePatient } from "@/lib/supabase/patients";
import type { Patient } from "@/db/database";

const PAGE_SIZE = 20;

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on search change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  // Fetch patients
  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPatients(
        debouncedSearch || undefined,
        page,
        PAGE_SIZE
      );
      setPatients(result.data);
      setCount(result.count);
    } catch {
      showToast("Erreur de réseau : chargement impossible", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleArchive = async (id: string, nom: string) => {
    if (!confirm(`Archiver ${nom} ?`)) return;
    setArchiving(id);
    try {
      await archivePatient(id);
      showToast(`${nom} archivé`, "success");
      loadPatients();
    } catch {
      showToast("Erreur lors de l'archivage", "error");
    } finally {
      setArchiving(null);
    }
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
          <CardTitle className="truncate">Patients ({count})</CardTitle>
          <div className="flex gap-3 w-full sm:w-auto">
            <Input
              placeholder="Rechercher nom, prénom, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 sm:max-w-xs"
            />
            <Link href="/patients/new">
              <Button>+ Nouveau</Button>
            </Link>
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
        ) : patients.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-text-muted"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <p className="text-text-muted">
              {debouncedSearch
                ? "Aucun patient trouvé"
                : "Aucun patient enregistré"}
            </p>
            {!debouncedSearch && (
              <Link href="/patients/new">
                <Button variant="outline">Enregistrer un patient</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Patient list */}
            <div className="space-y-2">
              {patients.map((p) => (
                <div
                  key={p.id_patient}
                  className="flex items-center justify-between rounded-xl border border-border-divider bg-surface-card p-4 transition-colors hover:border-primary-forest/20"
                >
                  <Link
                    href={`/patients/${p.id_patient}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-medium text-text-main truncate">
                      {p.prenom} {p.nom}
                    </p>
                    <p className="text-sm text-text-muted">{p.telephone}</p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {new Date(p.date_creation).toLocaleDateString()}
                    </Badge>
                    <button
                      onClick={() => handleArchive(p.id_patient, `${p.prenom} ${p.nom}`)}
                      disabled={archiving === p.id_patient}
                      className="text-sm text-text-muted hover:text-error-danger transition-colors px-2 py-1
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-forest rounded"
                      title="Archiver"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="20" height="5" x="2" y="3" rx="1" />
                        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                        <path d="M10 12h4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-text-muted">
                  Page {page + 1} / {totalPages} ({count} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    ← Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}