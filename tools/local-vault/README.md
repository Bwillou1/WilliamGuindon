# Coffre-Fort Documentaire Local — SEM-26-003

> **Lecteur local autonome, inviolable et cryptographiquement certifié** pour l'archive documentaire du dossier SEM-26-003 (Grande Tourbière de Blainville / Stablex).

---

## 🔒 1. Sécurité et Ancrage Cryptographique

Le lecteur intègre un contrôle cryptographique strict en dur dans son code source compilé :

* **Empreinte SHA-256 attendue :** `3209f9ea95dfc096ebcdf1ac0288c97872206af11a6e978a74761c03b3eba4d7`
* **Ancrage temporel :** [OpenTimestamps](https://opentimestamps.org/) sur la blockchain Bitcoin (OTS).
* **Garantie d'inviolabilité :** Le binaire refuse de déverrouiller l'interface ou de servir les fichiers si l'archive ZIP locale a été modifiée ne serait-ce que d'un seul octet.
* **Lecture en RAM :** Aucun fichier n'est extrait sur le disque dur ; les flux de prévisualisation (PDF, images, CSV, vidéos) sont lus directement depuis l'archive en mémoire vive.

---

## 🚀 2. Utilisation Rapide

1. **Téléchargez** le fichier d'archive officiel `dossier-journalistes-tourbiere-blainville-stablex.zip` (depuis Internet Archive ou le portail officiel `williamguindon.me`).
2. **Placez** le binaire dans le même dossier que l'archive (ou dans votre dossier Téléchargements).
3. **Lancez** le binaire correspondant à votre système :

### macOS (Image Disque .DMG)
1. Téléchargez et ouvrez `Lecteur-Dossier-Journalistes-Mac-AppleSilicon-M1-M2-M3-M4.dmg` (ou `Lecteur-Dossier-Journalistes-Mac-Intel.dmg`).
2. Glissez **Lecteur Dossier Journalistes** dans **Applications**.
3. **Premier lancement :** Faites **Clic droit (ou Control + Clic)** sur l'application dans Applications → **Ouvrir** → Confirmez avec **Ouvrir**.

### Windows
Double-cliquez sur `lecteur-dossier-journalistes-windows-x64.exe` ou lancez via invite de commandes PowerShell :
```powershell
.\lecteur-dossier-journalistes-windows-x64.exe
```

### Linux
```bash
chmod +x lecteur-dossier-journalistes-linux-x64
./lecteur-dossier-journalistes-linux-x64
```

L'application ouvrira automatiquement votre navigateur web sur l'adresse loopback `http://127.0.0.1:<port>/?token=<token-aléatoire>`.

---

## 🔍 3. Vérification Manuelle de l'Empreinte

Vous pouvez vérifier le hash SHA-256 avant même de lancer le programme :

* **macOS / Linux :**
  ```bash
  shasum -a 256 dossier-journalistes-tourbiere-blainville-stablex.zip
  ```
* **Windows (PowerShell) :**
  ```powershell
  Get-FileHash dossier-journalistes-tourbiere-blainville-stablex.zip -Algorithm SHA256
  ```

---

## 🛠️ 4. Compilation depuis les sources

Nécessite [Go 1.20+](https://go.dev/) :

```bash
# Compilation locale
go build -o lecteur-local main.go

# Cross-compilation multi-plateformes
bash build.sh
```

---

## ⚖️ Licence & Cadre Juridique

* **Licence documentaire :** CC BY-NC-ND 4.0 (William Guindon).
* **Charte de protection :** Conforme à la *Politique de protection de l'archive documentaire publiée (Charte Fondamentale 12)*.
