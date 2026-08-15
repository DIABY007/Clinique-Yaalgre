import { getSupabase } from "./client-lazy";

// ── CREATE ──
export async function createConsultation(input: {
  id_patient: string;
  id_utilisateur: string;
  diagnostic?: string;
}): Promise<{ id_consultation: string }> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("consultation")
    .insert({
      id_patient: input.id_patient,
      id_utilisateur: input.id_utilisateur,
      diagnostic: input.diagnostic ?? "",
    })
    .select("id_consultation")
    .single();

  if (error) throw error;
  return data;
}

// ── GET PATIENT CONSULTATIONS ──
export async function fetchPatientConsultations(patientId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("consultation")
    .select("*, documents:document_importe(*), examens:examen_laboratoire(*, type_examen(*))")
    .eq("id_patient", patientId)
    .order("date_heure", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ── SAVE DOCUMENT ──
export async function saveDocumentRecord(input: {
  id_consultation: string;
  type_document: string;
  chemin_image: string;
}): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from("document_importe").insert({
    id_consultation: input.id_consultation,
    type_document: input.type_document,
    chemin_image: input.chemin_image,
  });

  if (error) throw error;
}

// ── PRESCRIBE LAB EXAM ──
export async function prescribeExam(input: {
  id_consultation: string;
  id_type_examen: string;
}): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from("examen_laboratoire").insert({
    id_consultation: input.id_consultation,
    id_type_examen: input.id_type_examen,
    statut: "PRELEVE",
  });

  if (error) throw error;
}

// ── FETCH EXAM TYPES ──
export async function fetchExamTypes(): Promise<
  { id_type_examen: string; libelle: string }[]
> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("type_examen")
    .select("id_type_examen, libelle")
    .order("libelle");

  if (error) throw error;
  return data ?? [];
}