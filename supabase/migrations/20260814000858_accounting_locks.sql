-- ============================================================================
-- Migration: accounting_locks
-- Projet   : Clinique Yaalgre
-- Description : RLS, verrou comptable, triggers de consommation
-- ============================================================================

-- ── Activer RLS sur toutes les tables ─────────────────────────────────────
ALTER TABLE utilisateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_importe ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_examen ENABLE ROW LEVEL SECURITY;
ALTER TABLE examen_laboratoire ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_acte ENABLE ROW LEVEL SECURITY;
ALTER TABLE facture ENABLE ROW LEVEL SECURITY;
ALTER TABLE ligne_facture ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiement ENABLE ROW LEVEL SECURITY;
ALTER TABLE depense ENABLE ROW LEVEL SECURITY;
ALTER TABLE bilan_journalier ENABLE ROW LEVEL SECURITY;
ALTER TABLE produit ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvement_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE regle_consommation ENABLE ROW LEVEL SECURITY;

-- ── Politiques d'accès ──────────────────────────────────────────────────
-- Toutes les tables sont accessibles aux utilisateurs authentifiés
-- (le vrai contrôle se fait au niveau applicatif via le PIN)

CREATE POLICY "Accès total authentifié" ON utilisateur FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON patient FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON consultation FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON document_importe FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON type_examen FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON examen_laboratoire FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON catalogue_acte FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON facture FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON ligne_facture FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON bilan_journalier FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON produit FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON mouvement_stock FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès total authentifié" ON regle_consommation FOR ALL USING (auth.role() = 'authenticated');

-- ── Verrou comptable Paiement ──────────────────────────────────────────
-- Interdire UPDATE/DELETE sur les paiements verrouillés
CREATE POLICY "Protection paiement verrouillé UPDATE" ON paiement
    FOR UPDATE USING (est_verrouille = FALSE);

CREATE POLICY "Protection paiement verrouillé DELETE" ON paiement
    FOR DELETE USING (est_verrouille = FALSE);

-- ── Verrou comptable Depense ──────────────────────────────────────────
CREATE POLICY "Protection depense verrouillée UPDATE" ON depense
    FOR UPDATE USING (est_verrouille = FALSE);

CREATE POLICY "Protection depense verrouillée DELETE" ON depense
    FOR DELETE USING (est_verrouille = FALSE);

-- ── Trigger : Déduction de stock sur validation d'examen ──────────────
CREATE OR REPLACE FUNCTION appliquer_regle_consommation()
RETURNS TRIGGER AS $$
BEGIN
    -- Quand un examen passe à RESULTAT_DISPONIBLE
    IF NEW.statut = 'RESULTAT_DISPONIBLE' AND OLD.statut IS DISTINCT FROM 'RESULTAT_DISPONIBLE' THEN
        -- Trouver les règles de consommation liées à ce type d'examen
        INSERT INTO mouvement_stock (
            id_produit,
            id_utilisateur,
            id_consultation,
            quantite,
            type_mouvement,
            motif_ajustement
        )
        SELECT
            rc.id_produit,
            (SELECT id_utilisateur FROM consultation WHERE id_consultation = NEW.id_consultation LIMIT 1),
            NEW.id_consultation,
            -rc.quantite_deduite,
            'SORTIE'::type_mouvement,
            'Consommation automatique: ' || (SELECT libelle FROM type_examen WHERE id_type_examen = NEW.id_type_examen)
        FROM regle_consommation rc
        WHERE rc.id_type_examen = NEW.id_type_examen;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer le trigger sur examen_laboratoire
DROP TRIGGER IF EXISTS trigger_regle_consommation ON examen_laboratoire;
CREATE TRIGGER trigger_regle_consommation
    AFTER UPDATE OF statut ON examen_laboratoire
    FOR EACH ROW
    EXECUTE FUNCTION appliquer_regle_consommation();

-- ── Trigger : Calcul des totaux du bilan journalier ──────────────────
CREATE OR REPLACE FUNCTION calculer_bilan_journalier()
RETURNS TRIGGER AS $$
DECLARE
    v_total_recettes DECIMAL(12,2);
    v_total_depenses DECIMAL(12,2);
    v_bilan_id UUID;
BEGIN
    -- Trouver le bilan du jour
    SELECT id_bilan INTO v_bilan_id
    FROM bilan_journalier
    WHERE date_bilan = CURRENT_DATE
    LIMIT 1;

    IF v_bilan_id IS NOT NULL THEN
        -- Recalculer les totaux
        SELECT COALESCE(SUM(montant_encaisse), 0) INTO v_total_recettes
        FROM paiement WHERE id_bilan = v_bilan_id AND est_verrouille = TRUE;

        SELECT COALESCE(SUM(montant), 0) INTO v_total_depenses
        FROM depense WHERE id_bilan = v_bilan_id AND est_verrouille = TRUE;

        UPDATE bilan_journalier
        SET total_recettes = v_total_recettes,
            total_depenses = v_total_depenses,
            solde_net = v_total_recettes - v_total_depenses
        WHERE id_bilan = v_bilan_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_bilan_paiement ON paiement;
CREATE TRIGGER trigger_bilan_paiement
    AFTER UPDATE OF est_verrouille ON paiement
    FOR EACH ROW
    WHEN (NEW.est_verrouille = TRUE)
    EXECUTE FUNCTION calculer_bilan_journalier();

DROP TRIGGER IF EXISTS trigger_bilan_depense ON depense;
CREATE TRIGGER trigger_bilan_depense
    AFTER UPDATE OF est_verrouille ON depense
    FOR EACH ROW
    WHEN (NEW.est_verrouille = TRUE)
    EXECUTE FUNCTION calculer_bilan_journalier();