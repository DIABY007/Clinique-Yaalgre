import Dexie, { type EntityTable } from "dexie";

// ── Sync Metadata ──
export interface SyncMetadata {
  _syncStatus: "synced" | "pending" | "conflicted";
  _lastModified: number;
  _localVersion: number;
  _serverVersion?: number;
  _deletedAt?: number | null;
}

// ── Types métier (chaque type étend SyncMetadata) ──
export type Syncable<T> = T & SyncMetadata;

export interface Utilisateur {
  id_utilisateur: string;
  nom: string;
  role: string;
  code_pin_hash: string;
  est_actif: boolean;
}

export interface Patient {
  id_patient: string;
  telephone: string;
  nom: string;
  prenom: string;
  date_creation: string;
  est_archive: boolean;
}

export interface Consultation {
  id_consultation: string;
  id_patient: string;
  id_utilisateur: string;
  date_heure: string;
  diagnostic: string;
}

export interface DocumentImporte {
  id_document: string;
  id_consultation: string;
  type_document: string;
  chemin_image: string;
}

export interface ExamenLaboratoire {
  id_examen: string;
  id_consultation: string;
  id_type_examen: string;
  statut: string;
  date_mise_a_jour: string;
}

export interface Facture {
  id_facture: string;
  id_consultation: string;
  date_facture: string;
}

export interface LigneFacture {
  id_ligne: string;
  id_facture: string;
  id_acte?: string | null;
  id_produit?: string | null;
  quantite: number;
  prix_unitaire_applique: number;
}

export interface Paiement {
  id_paiement: string;
  id_facture: string;
  id_utilisateur: string;
  id_bilan?: string | null;
  montant_encaisse: number;
  date_paiement: string;
  est_verrouille: boolean;
  motif_annulation?: string;
}

// ── Sync Queue ──
export interface SyncQueueItem {
  id?: number;
  table: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  recordId: string;
  payload: unknown;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

// ── Database ──
export class CliniqueDB extends Dexie {
  utilisateurs!: EntityTable<Utilisateur, "id_utilisateur">;
  patients!: EntityTable<Patient, "id_patient">;
  consultations!: EntityTable<Consultation, "id_consultation">;
  documents!: EntityTable<DocumentImporte, "id_document">;
  examens!: EntityTable<ExamenLaboratoire, "id_examen">;
  factures!: EntityTable<Facture, "id_facture">;
  ligneFactures!: EntityTable<LigneFacture, "id_ligne">;
  paiements!: EntityTable<Paiement, "id_paiement">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super("CliniqueYaalgre");

    this.version(1).stores({
      utilisateurs: "id_utilisateur, nom, role, est_actif",
      patients: "id_patient, nom, telephone, est_archive",
      consultations: "id_consultation, id_patient, date_heure",
      documents: "id_document, id_consultation",
      examens: "id_examen, id_consultation, statut",
      factures: "id_facture, id_consultation, date_facture",
      ligneFactures: "id_ligne, id_facture",
      paiements: "id_paiement, id_facture, est_verrouille",
      syncQueue: "++id, table, action, retryCount, createdAt",
    });
  }
}

export const db = new CliniqueDB();

// ── Helpers Sync ──

/**
 * Ajouter une opération à la file de synchronisation.
 * Utilise l'exponential backoff + jitter pour les retries.
 */
export async function enqueueSync(
  table: string,
  action: SyncQueueItem["action"],
  recordId: string,
  payload: unknown
): Promise<void> {
  await db.syncQueue.add({
    table,
    action,
    recordId,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

/**
 * Calculer le délai avant le prochain retry (exponential backoff + jitter).
 * Base : 2^retry * 1000ms, jitter : ±20%
 */
export function getBackoffDelay(retryCount: number): number {
  const base = Math.min(Math.pow(2, retryCount) * 1000, 60000); // max 60s
  const jitter = base * 0.2 * (Math.random() * 2 - 1); // ±20%
  return Math.round(base + jitter);
}

/**
 * Marquer un retry sur un item de la queue.
 */
export async function markRetry(
  id: number,
  errorMessage: string
): Promise<void> {
  const item = await db.syncQueue.get(id);
  if (item) {
    await db.syncQueue.update(id, {
      retryCount: (item.retryCount ?? 0) + 1,
      lastError: errorMessage,
    });
  }
}

/**
 * Supprimer un item traité de la queue.
 */
export async function dequeueSync(id: number): Promise<void> {
  await db.syncQueue.delete(id);
}

/**
 * Récupérer les éléments en attente de synchronisation.
 */
export async function getPendingSyncs(): Promise<SyncQueueItem[]> {
  return db.syncQueue
    .orderBy("createdAt")
    .toArray();
}

/**
 * Nombre d'opérations en attente.
 */
export async function getPendingSyncCount(): Promise<number> {
  return db.syncQueue.count();
}

// ── Fallback : utilisateur par défaut (offline) ──
export const DEFAULT_USER: Utilisateur = {
  id_utilisateur: "18050b04-3789-4a24-912e-450aa300290d",
  nom: "Dr Diallo",
  role: "medecin",
  // hash de "1234" avec salt "DR DIALLO" → SHA-256("1234|DR DIALLO")
  code_pin_hash: "a8ec58d76f3a479d881e0cd77585a15d9b4b592afcacaf289640caa4aaf044fb",
  est_actif: true,
};

/**
 * Semer l'utilisateur par défaut si la base est vide.
 * Garantit que le login PIN fonctionne même 100% hors-ligne.
 */
export async function seedDefaultUser(): Promise<void> {
  const count = await db.utilisateurs.count();
  if (count === 0) {
    await db.utilisateurs.add(DEFAULT_USER);
  }
}

// ── Helpers Utilisateurs ──
export async function syncUtilisateurs(users: Utilisateur[]): Promise<void> {
  await db.utilisateurs.clear();
  await db.utilisateurs.bulkAdd(users);
  // Si le serveur n'a renvoyé personne, seed le fallback
  if (users.length === 0) {
    await seedDefaultUser();
  }
}

export async function getAllUtilisateurs(): Promise<Utilisateur[]> {
  return db.utilisateurs.toArray();
}