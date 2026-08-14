#!/usr/bin/env bash
# ============================================================================
# Script : create-user.sh
# Usage  : bash scripts/create-user.sh "Dr Diallo" "medecin" "1234"
# ============================================================================

NOM="${1:-Dr Diallo}"
ROLE="${2:-medecin}"
PIN="${3:-1234}"

if [ -z "$NOM" ] || [ -z "$PIN" ]; then
  echo "Usage: bash scripts/create-user.sh \"Nom\" \"role\" \"PIN\""
  echo "Exemple: bash scripts/create-user.sh \"Dr Diallo\" \"medecin\" \"1234\""
  exit 1
fi

# Générer le hash SHA-256 du PIN (même algorithme que le frontend)
HASH=$(echo -n "${PIN}|${NOM^^}" | sha256sum | cut -d' ' -f1)

echo "══════════════════════════════════════════"
echo "  UTILISATEUR À CRÉER"
echo "══════════════════════════════════════════"
echo "  Nom   : $NOM"
echo "  Rôle  : $ROLE"
echo "  PIN   : $PIN"
echo "  Hash  : $HASH"
echo "══════════════════════════════════════════"
echo ""
echo "Exécute ce SQL dans le Supabase SQL Editor :"
echo ""
echo "INSERT INTO utilisateur (nom, role, code_pin_hash, est_actif)"
echo "VALUES ('$NOM', '$ROLE', '$HASH', TRUE);"
echo ""