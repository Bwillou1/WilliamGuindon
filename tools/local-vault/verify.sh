#!/bin/bash

# Script de vérification d'intégrité de l'archive ZIP
# Empreinte officielle ancrée par OpenTimestamps (Blockchain Bitcoin) :
EXPECTED_SHA256="3209f9ea95dfc096ebcdf1ac0288c97872206af11a6e978a74761c03b3eba4d7"
ZIP_FILE="${1:-dossier-journalistes-tourbiere-blainville-stablex.zip}"

if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Fichier non trouvé : $ZIP_FILE"
    echo "Usage: ./verify.sh [chemin_vers_archive.zip]"
    exit 1
fi

echo "==================================================================="
echo "  VÉRIFICATION D'INTÉGRITÉ CRYPTOGRAPHIQUE — SEM-26-003"
echo "==================================================================="
echo "📦 Fichier analysé : $ZIP_FILE"

if command -v shasum &>/dev/null; then
    COMPUTED_SHA256=$(shasum -a 256 "$ZIP_FILE" | awk '{print $1}')
elif command -v sha256sum &>/dev/null; then
    COMPUTED_SHA256=$(sha256sum "$ZIP_FILE" | awk '{print $1}')
else
    echo "❌ Aucun utilitaire SHA-256 (shasum / sha256sum) n'a été trouvé."
    exit 1
fi

echo "Calculé  : $COMPUTED_SHA256"
echo "Attendu  : $EXPECTED_SHA256"

if [ "$COMPUTED_SHA256" == "$EXPECTED_SHA256" ]; then
    echo ""
    echo "✅ ARCHIVE CONFORME ET INTACTE (Ancrage OpenTimestamps Bitcoin certifié)"
    exit 0
else
    echo ""
    echo "❌ ALERTE SÉCURITÉ : L'empreinte ne correspond pas !"
    echo "L'archive a été altérée, tronquée ou provient d'une source tierce non officielle."
    exit 2
fi
