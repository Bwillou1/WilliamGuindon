#!/bin/bash
set -e

# Script de génération des fichiers .DMG pour macOS (Apple Silicon et Intel)
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$DIR/dist"
STAGING_DIR="$DIR/dmg_staging"

mkdir -p "$DIST_DIR"

build_dmg() {
    local ARCH="$1"
    local ARCH_LABEL="$2"
    local BINARY_NAME="lecteur-dossier-journalistes-mac-$ARCH"
    local DMG_NAME="Lecteur-Dossier-Journalistes-Mac-$ARCH_LABEL.dmg"
    local APP_DIR="$STAGING_DIR/Lecteur Dossier Journalistes.app"

    echo "==================================================================="
    echo "  Création du DMG pour macOS ($ARCH_LABEL)..."
    echo "==================================================================="

    rm -rf "$STAGING_DIR"
    mkdir -p "$STAGING_DIR"
    mkdir -p "$APP_DIR/Contents/MacOS"
    mkdir -p "$APP_DIR/Contents/Resources"

    # Compilation du binaire natif
    echo "🔨 Compilation du binaire Go pour darwin/$ARCH..."
    GOOS=darwin GOARCH="$ARCH" go build -ldflags="-s -w" -o "$APP_DIR/Contents/MacOS/lecteur-local" "$DIR/main.go"

    # Création du fichier Info.plist
    cat << 'EOF' > "$APP_DIR/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>fr</string>
    <key>CFBundleExecutable</key>
    <string>lecteur-local</string>
    <key>CFBundleIdentifier</key>
    <string>me.williamguindon.dossier-journalistes</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Lecteur Dossier Journalistes</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>© 2026 William Guindon. Licence CC BY-NC-ND 4.0</string>
</dict>
</plist>
EOF

    # Rendre le binaire exécutable
    chmod +x "$APP_DIR/Contents/MacOS/lecteur-local"

    # Signature ad-hoc (Apple local)
    if command -v codesign &>/dev/null; then
        echo "🔏 Signature ad-hoc de l'application..."
        codesign --force --deep -s - "$APP_DIR" 2>/dev/null || true
    fi

    # Lien symbolique vers le dossier /Applications
    ln -s /Applications "$STAGING_DIR/Applications"

    # Fichier d'instructions inclus dans le DMG
    cat << 'EOF' > "$STAGING_DIR/LISEZ-MOI_INSTRUCTIONS.txt"
===================================================================
  LECTEUR LOCAL DU DOSSIER JOURNALISTES SEM-26-003
  Authentifié par Ancrage OpenTimestamps (Blockchain Bitcoin)
===================================================================

1. INSTALLATION :
   Glissez l'application "Lecteur Dossier Journalistes" dans le dossier "Applications".

2. PREMIER LANCEMENT SUR MACOS :
   Comme il s'agit d'un outil d'enquête indépendant distribué hors App Store :
   - Faites un CLIC DROIT (ou Control + Clic) sur l'application.
   - Cliquez sur "Ouvrir".
   - Confirmez en cliquant sur "Ouvrir".
   (Cette étape n'est nécessaire qu'une seule fois).

3. ARCHIVE SOURCE :
   Placez votre fichier d'archive "dossier-journalistes-tourbiere-blainville-stablex.zip"
   dans votre dossier Téléchargements ou à côté de l'application.

   Empreinte SHA-256 certifiée OpenTimestamps :
   3209f9ea95dfc096ebcdf1ac0288c97872206af11a6e978a74761c03b3eba4d7
===================================================================
EOF

    # Création de l'image disque .DMG avec hdiutil
    echo "💿 Génération de l'image disque $DMG_NAME..."
    rm -f "$DIST_DIR/$DMG_NAME"
    hdiutil create -volname "Lecteur Dossier Journalistes" -srcfolder "$STAGING_DIR" -ov -format UDZO "$DIST_DIR/$DMG_NAME"

    rm -rf "$STAGING_DIR"
    echo "✅ DMG créé avec succès : $DIST_DIR/$DMG_NAME"
}

# Génération pour Apple Silicon (ARM64)
build_dmg "arm64" "AppleSilicon-M1-M2-M3-M4"

# Génération pour Mac Intel (x86_64)
build_dmg "amd64" "Intel"

echo ""
echo "🎉 Tous les fichiers .DMG ont été générés dans tools/local-vault/dist/ :"
ls -lh "$DIST_DIR"/*.dmg
