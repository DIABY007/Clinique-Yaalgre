import { getSupabase } from "./client-lazy";
import type { Patient } from "@/db/database";

// ── LIST ──
export async function fetchPatients(
  search?: string,
  page: number = 0,
  pageSize: number = 20
): Promise<{ data: Patient[]; count: number }> {
  const supabase = await getSupabase();
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

// ── CREATE ──
export async function createPatient(input: {
  nom: string;
  prenom: string;
  telephone: string;
}): Promise<Patient> {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("patient")
    .update(input)
    .eq("id_patient", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── ARCHIVE ──
export async function archivePatient(id: string): Promise<void> {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("patient")
    .select("*, consultations:consultation(*)")
    .eq("id_patient", id)
    .single();

  if (error) throw error;
  return data;
}