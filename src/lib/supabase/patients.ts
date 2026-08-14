import { createClient } from "@/utils/supabase/client";
import type { Patient } from "@/db/database";

const supabase = createClient();

// ── LIST ──
export async function fetchPatients(
  search?: string,
  page: number = 0,
  pageSize: number = 20
): Promise<{ data: Patient[]; count: number }> {
  let query = supabase
    .from("patient")
    .select("*", { count: "exact" })
    .eq("est_archive", false)
    .order("date_creation", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (search) {
    query = query.or(
      `nom.ilike.%${search}%,prenom.ilike.%${search}%,telephone.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

// ── CREATE (Supabase direct uniquement) ──
export async function createPatient(input: {
  nom: string;
  prenom: string;
  telephone: string;
}): Promise<Patient> {
  const { data, error } = await supabase
    .from("patient")
    .insert({
      nom: input.nom,
      prenom: input.prenom,
      telephone: input.telephone,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── UPDATE ──
export async function updatePatient(
  id: string,
  input: Partial<{
    nom: string;
    prenom: string;
    telephone: string;
    est_archive: boolean;
  }>
): Promise<Patient> {
  const { data, error } = await supabase
    .from("patient")
    .update(input)
    .eq("id_patient", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── ARCHIVE (soft delete) ──
export async function archivePatient(id: string): Promise<void> {
  const { error } = await supabase
    .from("patient")
    .update({ est_archive: true })
    .eq("id_patient", id);

  if (error) throw error;
}

// ── GET ONE ──
export async function fetchPatient(
  id: string
): Promise<Patient & { consultations?: unknown[] }> {
  const { data, error } = await supabase
    .from("patient")
    .select("*, consultations:consultation(*)")
    .eq("id_patient", id)
    .single();

  if (error) throw error;
  return data;
}