#!/bin/bash
set -e

# Script de cross-compilation pour le Lecteur Local Sécurisé (SEM-26-003)
# Sorties : macOS (ARM64 & Intel), Windows (.exe x64), Linux (x64)

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$DIR/dist"

mkdir -p "$DIST_DIR"

echo "==================================================================="
echo "  COMPILATION DU LECTEUR LOCAL DU DOSSIER JOURNALISTES"
echo "  Ancrage OpenTimestamps : 3209f9ea95dfc096ebcdf1ac0288c97872206af11a6e978a74761c03b3eba4d7"
echo "==================================================================="

echo "🔨 Compilation pour macOS ARM64 (Apple Silicon M1/M2/M3/M4)..."
GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o "$DIST_DIR/lecteur-dossier-journalistes-mac-arm64" "$DIR/main.go"

echo "🔨 Compilation pour macOS Intel (x86_64)..."
GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o "$DIST_DIR/lecteur-dossier-journalistes-mac-intel" "$DIR/main.go"

echo "🔨 Compilation pour Windows x64 (.exe)..."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o "$DIST_DIR/lecteur-dossier-journalistes-windows-x64.exe" "$DIR/main.go"

echo "🔨 Compilation pour Linux x64..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o "$DIST_DIR/lecteur-dossier-journalistes-linux-x64" "$DIR/main.go"

echo ""
echo "✅ Tous les binaires ont été générés avec succès dans tools/local-vault/dist/ :"
ls -lh "$DIST_DIR"
