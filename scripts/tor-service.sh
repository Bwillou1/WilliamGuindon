#!/usr/bin/env bash
# ==============================================================================
# Script de déploiement et d'actualisation automatique du Miroir Tor (.onion)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Actualisation automatique du Miroir Tor (.onion) ==="
cd "$REPO_DIR"

echo "1. Récupération des dernières modifications sur Git..."
git pull origin main

echo "2. Vérification des assets et intégrité..."
node scripts/mirror-sync.js

echo "3. Adresse .onion configurée :"
if [ -f "/var/lib/tor/williamguindon_hidden_service/hostname" ]; then
    ONION_HOST=$(cat /var/lib/tor/williamguindon_hidden_service/hostname)
    echo "✔ Service Tor actif sur : http://${ONION_HOST}"
else
    echo "ℹ Mode simulation locale ou Tor en cours d'initialisation."
    echo "ℹ Adresse déclarée : $(node -e "console.log(require('./data/mirrors.json').mirrors.tor_onion.onionUrl)")"
fi

echo "=== Miroir Tor synchronisé avec succès ==="
