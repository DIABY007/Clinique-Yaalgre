-- ============================================================================
-- Migration: init_schema
-- Projet   : Clinique Yaalgre
-- Description : Schéma complet — 15 tables, énumérations, contraintes, index
-- ============================================================================

-- ── Énumérations ──────────────────────────────────────────────────────────

CREATE TYPE statut_examen AS ENUM ('PRELEVE', 'ENVOYE', 'RESULTAT_DISPONIBLE');
CREATE TYPE categorie_depense AS ENUM ('COTISATION_CLINIQUE', 'COTISATION_MEDECIN', 'ACHAT_ARTHESOUN', 'AUTRE');
CREATE TYPE type_gestion_stock AS ENUM ('STRICT', 'MASSE');
CREATE TYPE type_mouvement AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT_NEGATIF');

-- ── Tables Médicales ─────────────────────────────────────────────────────

-- 1. Utilisateur
CREATE TABLE utilisateur (
    id_utilisateur UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'medecin',
    code_pin_hash TEXT NOT NULL,
    est_actif BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Patient
CREATE TABLE patient (
    id_patient UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telephone TEXT NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    date_creation TIMESTAMPTZ NOT NULL DEFAULT now(),
    est_archive BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Consultation
CREATE TABLE consultation (
    id_consultation UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_patient UUID NOT NULL REFERENCES patient(id_patient) ON DELETE RESTRICT,
    id_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE RESTRICT,
    date_heure TIMESTAMPTZ NOT NULL DEFAULT now(),
    diagnostic TEXT DEFAULT ''
);

-- 4. DocumentImporte (Composition avec Consultation → CASCADE)
CREATE TABLE document_importe (
    id_document UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_consultation UUID NOT NULL REFERENCES consultation(id_consultation) ON DELETE CASCADE,
    type_document TEXT NOT NULL DEFAULT 'image',
    chemin_image TEXT NOT NULL
);

-- 5. TypeExamen
CREATE TABLE type_examen (
    id_type_examen UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    libelle TEXT NOT NULL UNIQUE
);

-- 6. ExamenLaboratoire
CREATE TABLE examen_laboratoire (
    id_examen UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_consultation UUID NOT NULL REFERENCES consultation(id_consultation) ON DELETE CASCADE,
    id_type_examen UUID NOT NULL REFERENCES type_examen(id_type_examen) ON DELETE RESTRICT,
    statut statut_examen NOT NULL DEFAULT 'PRELEVE',
    date_mise_a_jour TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tables Financières ───────────────────────────────────────────────────

-- 7. CatalogueActe
CREATE TABLE catalogue_acte (
    id_acte UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    libelle TEXT NOT NULL,
    prix_unitaire DECIMAL(12, 2) NOT NULL CHECK (prix_unitaire >= 0)
);

-- 8. Facture (Composition avec LigneFacture → CASCADE)
CREATE TABLE facture (
    id_facture UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_consultation UUID NOT NULL UNIQUE REFERENCES consultation(id_consultation) ON DELETE RESTRICT,
    date_facture TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. LigneFacture (Contrainte XOR : acte OU produit, jamais les deux)
CREATE TABLE ligne_facture (
    id_ligne UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_facture UUID NOT NULL REFERENCES facture(id_facture) ON DELETE CASCADE,
    id_acte UUID REFERENCES catalogue_acte(id_acte) ON DELETE RESTRICT,
    id_produit UUID, -- FK ajoutée après création de la table Produit
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire_applique DECIMAL(12, 2) NOT NULL CHECK (prix_unitaire_applique >= 0),

    -- XOR : l'une des deux FK est renseignée, jamais les deux, jamais aucune
    CONSTRAINT ligne_facture_xor_check
        CHECK (
            (id_acte IS NOT NULL AND id_produit IS NULL)
            OR
            (id_acte IS NULL AND id_produit IS NOT NULL)
        )
);

-- 10. Paiement
CREATE TABLE paiement (
    id_paiement UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_facture UUID NOT NULL REFERENCES facture(id_facture) ON DELETE RESTRICT,
    id_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE RESTRICT,
    id_bilan UUID, -- FK ajoutée après création de BilanJournalier
    montant_encaisse DECIMAL(12, 2) NOT NULL CHECK (montant_encaisse > 0),
    date_paiement TIMESTAMPTZ NOT NULL DEFAULT now(),
    est_verrouille BOOLEAN NOT NULL DEFAULT FALSE,
    motif_annulation TEXT DEFAULT ''
);

-- 11. Depense
CREATE TABLE depense (
    id_depense UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE RESTRICT,
    id_bilan UUID, -- FK ajoutée après création de BilanJournalier
    categorie categorie_depense NOT NULL DEFAULT 'AUTRE',
    description_autre TEXT DEFAULT '',
    montant DECIMAL(12, 2) NOT NULL CHECK (montant > 0),
    date_depense TIMESTAMPTZ NOT NULL DEFAULT now(),
    est_verrouille BOOLEAN NOT NULL DEFAULT FALSE,
    motif_annulation TEXT DEFAULT ''
);

-- 12. BilanJournalier
CREATE TABLE bilan_journalier (
    id_bilan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_bilan DATE NOT NULL DEFAULT CURRENT_DATE,
    total_recettes DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_depenses DECIMAL(12, 2) NOT NULL DEFAULT 0,
    solde_net DECIMAL(12, 2) NOT NULL DEFAULT 0
);

-- Ajout des FK vers bilan_journalier
ALTER TABLE paiement
    ADD CONSTRAINT fk_paiement_bilan
    FOREIGN KEY (id_bilan) REFERENCES bilan_journalier(id_bilan) ON DELETE SET NULL;

ALTER TABLE depense
    ADD CONSTRAINT fk_depense_bilan
    FOREIGN KEY (id_bilan) REFERENCES bilan_journalier(id_bilan) ON DELETE SET NULL;

-- ── Tables de Stock ──────────────────────────────────────────────────────

-- 13. Produit
CREATE TABLE produit (
    id_produit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_barre TEXT UNIQUE,
    nom TEXT NOT NULL,
    type_gestion type_gestion_stock NOT NULL DEFAULT 'MASSE',
    prix_unitaire DECIMAL(12, 2) NOT NULL CHECK (prix_unitaire >= 0)
);

-- FK de LigneFacture vers Produit (maintenant que Produit existe)
ALTER TABLE ligne_facture
    ADD CONSTRAINT fk_ligne_facture_produit
    FOREIGN KEY (id_produit) REFERENCES produit(id_produit) ON DELETE RESTRICT;

-- 14. MouvementStock
CREATE TABLE mouvement_stock (
    id_mouvement UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produit UUID NOT NULL REFERENCES produit(id_produit) ON DELETE RESTRICT,
    id_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE RESTRICT,
    id_consultation UUID REFERENCES consultation(id_consultation) ON DELETE SET NULL,
    quantite INTEGER NOT NULL CHECK (quantite != 0),
    type_mouvement type_mouvement NOT NULL,
    motif_ajustement TEXT DEFAULT '',
    date_mouvement TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. RegleConsommation
CREATE TABLE regle_consommation (
    id_regle UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produit UUID NOT NULL REFERENCES produit(id_produit) ON DELETE CASCADE,
    id_type_examen UUID NOT NULL REFERENCES type_examen(id_type_examen) ON DELETE CASCADE,
    quantite_deduite INTEGER NOT NULL CHECK (quantite_deduite > 0),
    UNIQUE (id_produit, id_type_examen)
);

-- ── Index ────────────────────────────────────────────────────────────────

-- Recherche patients
CREATE INDEX idx_patient_nom ON patient(nom);
CREATE INDEX idx_patient_telephone ON patient(telephone);
CREATE INDEX idx_patient_actif ON patient(est_archive) WHERE est_archive = FALSE;

-- Consultation
CREATE INDEX idx_consultation_patient ON consultation(id_patient);
CREATE INDEX idx_consultation_date ON consultation(date_heure DESC);

-- Factures
CREATE INDEX idx_facture_date ON facture(date_facture DESC);
CREATE INDEX idx_ligne_facture_facture ON ligne_facture(id_facture);
CREATE INDEX idx_paiement_facture ON paiement(id_facture);
CREATE INDEX idx_paiement_bilan ON paiement(id_bilan) WHERE id_bilan IS NOT NULL;
CREATE INDEX idx_depense_bilan ON depense(id_bilan) WHERE id_bilan IS NOT NULL;

-- Examens
CREATE INDEX idx_examen_consultation ON examen_laboratoire(id_consultation);
CREATE INDEX idx_examen_statut ON examen_laboratoire(statut);

-- Stock
CREATE INDEX idx_mouvement_produit ON mouvement_stock(id_produit);
CREATE INDEX idx_mouvement_date ON mouvement_stock(date_mouvement DESC);

-- Bilan
CREATE UNIQUE INDEX idx_bilan_date ON bilan_journalier(date_bilan);
CREATE INDEX idx_bilan_recent ON bilan_journalier(date_bilan DESC);