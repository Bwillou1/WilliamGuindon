#!/usr/bin/env python3
"""
Générateur des 100 clés d'accès parlementaires nominatives (SHA-256).
- Génère `data/parlement-hashes.json` (les hashs publics SHA-256)
- Génère `MES-CLES-PARLEMENTAIRES.md` (le tableau secret de bord de William Guindon)
"""
import os
import secrets
import hashlib
import json

alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ' # 30 caractères sans confusion (sans 0/O, 1/I/L)
seen_codes = set()
entries = []
hashes = []

while len(entries) < 100:
    code = ''.join(secrets.choice(alphabet) for _ in range(6))
    if code in seen_codes:
        continue
    seen_codes.add(code)
    h = hashlib.sha256(code.encode('utf-8')).hexdigest()
    hashes.append(h)
    entries.append({'id': len(entries) + 1, 'code': code, 'hash': h})

# 1. Sauvegarde des hashs publics pour le site
os.makedirs('data', exist_ok=True)
with open('data/parlement-hashes.json', 'w', encoding='utf-8') as f:
    json.dump({'version': 1, 'maxUsesPerKey': 5, 'validityDays': 90, 'hashes': hashes}, f, indent=2)

# 2. Sauvegarde du registre secret local de William
with open('MES-CLES-PARLEMENTAIRES.md', 'w', encoding='utf-8') as f:
    f.write('# 🏛️ REGISTRE SECRET DES 100 CLÉS PARLEMENTAIRES — WILLIAM GUINDON\n\n')
    f.write('> **CONFIDENTIEL — USAGE STRICTEMENT PERSONNEL.**\n')
    f.write('> Ce fichier reste uniquement sur votre ordinateur local (protégé par .gitignore) et n\'est jamais poussé sur GitHub.\n')
    f.write('> Sur GitHub, seuls les 100 hashs cryptographiques SHA-256 sont stockés dans `data/parlement-hashes.json`.\n\n')
    f.write('### Règles de fonctionnement des clés :\n')
    f.write('- **Validité :** 90 jours à compter de la première activation sur un poste.\n')
    f.write('- **Limite :** 5 activations / sessions maximum par clé.\n')
    f.write('- **Priorité réseau :** Débloque l\'accès complet même sur le réseau fédéral du Parlement (Chambre des communes) ou de l\'Assemblée nationale.\n')
    f.write('- **Barrière de sécurité :** Reste automatiquement inactive si utilisée par les cibles d\'enquête (`ec.gc.ca` ou `stablex.com`).\n\n')
    f.write('| N° | Code secret (6 car.) | Lien d\'accès prêt à envoyer à la députée | Destinataire assigné | Statut |\n')
    f.write('| :--- | :--- | :--- | :--- | :--- |\n')
    for e in entries:
        code = e['code']
        num = e['id']
        url = f'https://williamguindon.me/cle.html?cle={code}'
        f.write(f'| **{num:03d}** | `{code}` | [{url}]({url}) | *(Disponible)* | ⚪ Non utilisée |\n')

print(f"Génération terminée : 100 clés générées dans data/parlement-hashes.json et MES-CLES-PARLEMENTAIRES.md")
