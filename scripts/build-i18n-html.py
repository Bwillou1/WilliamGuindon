#!/usr/bin/env python3
"""
scripts/build-i18n-html.py

Génère automatiquement l'intégralité des 50 pages HTML en anglais (/en/) et en espagnol (/es/)
à partir des pages françaises de référence et des fichiers de traduction du corpus williamguindon-me-txt.

Architecture :
- Français (langue initiale) : racine du site (/ et /*.html) sans aucun préfixe /fr/
- Anglais : /en/ et /en/*.html
- Espagnol : /es/ et /es/*.html
"""

import os
import re
import csv
import sys

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SOURCE_TXT_DIR = '/Users/williamguindon/Library/Mobile Documents/com~apple~CloudDocs/Téléchargements/workspace-01a1b612-322f-75df-a0d9-1ed4c72a6a68/williamguindon-me-txt'

# Pages exclues de la traduction qui doivent toujours renvoyer vers le fichier français d'origine
EXCLUDED_PAGES = {
    '11-novembre.html',
    '404.html',
    'actualites.html',
    'admin.html',
    'age.html',
    'cadet.html',
    'cce.html',
    'cle.html',
    'commentaires.html',
    'console-admin.html',
    'delegation.html',
    'dossier-confidentiel-non-biffe-sem26003.html',
    'editeur.html',
    'enquete-partis.html',
    'google57da095d83ebd58e.html',
    'loi-93.html',
    'navbar.html',
    'noel.html',
    'opsec.html',
    'presentations.html',
    'registre-cce-sem26003.html',
    'registre.html',
    'reload.html',
    'state.html',
    'statut-mineur.html',
    'studio.html',
    'transmission-sem26003.html',
    'vie-privee-parents.html'
}

ROOT_ASSETS = [
    'tourbiere.jpg',
    'blainville_latest.png',
    'blainville_capture_3.png',
    'navbar.js',
    'countdown-live.svg',
    'publickey.asc',
    'transcriptions.txt',
    'llms-full.txt',
    'llms.txt',
    'llms-en.txt',
    'llms-es.txt',
    'robots.txt',
    'status.json',
    'apis.json',
    'openapi.json',
    'security.txt'
]

COMMON_REPLACEMENTS = {
    'en': {
        'En-tête du site': 'Site Header',
        'Dossier CCE &amp; Stablex': 'CEC Case &amp; Stablex',
        'Dossier CCE & Stablex': 'CEC Case & Stablex',
        'Enquêtes &amp; Analyses': 'Investigations &amp; Analyses',
        'Enquêtes & Analyses': 'Investigations & Analyses',
        'Registre CCE &amp; Pièces': 'CEC Registry &amp; Evidence',
        'Registre CCE & Pièces': 'CEC Registry & Evidence',
        'Suivi &amp; Outils Direct': 'Monitoring &amp; Direct Tools',
        'Suivi & Outils Direct': 'Monitoring & Direct Tools',
        'Espace Presse &amp; Médias': 'Press &amp; Media Kit',
        'Espace Presse & Médias': 'Press & Media Kit',
        'Mobilisation &amp; Action': 'Mobilization &amp; Action',
        'Mobilisation & Action': 'Mobilization & Action',
        'Fermer': 'Close',
        'Fermer le menu': 'Close menu',
        'Ouvrir le menu de navigation': 'Open navigation menu',
        'Navigation principale': 'Main navigation',
        'Contenu mis à disposition sous licence': 'Content made available under license',
        'Consulter les documents': 'View documents',
        'Version texte': 'Text version',
        'Conditions d\'utilisation': 'Terms of Use',
        'Politique de confidentialité': 'Privacy Policy',
        'Haut ↑': 'Top ↑',
        'Lire l\'article ↗': 'Read article ↗',
        'Copier le lien': 'Copy link',
        'Partager': 'Share',
        'Dossier d\'enquête Stablex': 'Stablex Investigation Dossier',
        'Enquête : Contamination &amp; Mesures': 'Investigation: Contamination &amp; Testing',
        'Dossier : Histoire autochtone &amp; Écologie': 'Dossier: Indigenous History &amp; Ecology',
        'Dossier expliqué &amp; Vulgarisation (SEM-26-003)': 'Case Explained &amp; Overview (SEM-26-003)',
        'Lexique &amp; Dictionnaire citoyen': 'Citizen Glossary &amp; Lexicon',
        'Observations de l\'auteur (17 oct.)': 'Submitter Observations (Oct. 17)',
        'Réponse du Canada (16 oct.)': 'Canada\'s Response (Oct. 16)',
        'Registre officiel CCE (Direct)': 'Official CEC Registry (Direct)',
        'Explorateur documentaire': 'Document Explorer',
        'Miroirs Décentralisés (IPFS/Tor)': 'Decentralized Mirrors (IPFS/Tor)',
        'Comment Agir &amp; Soutenir': 'How to Act &amp; Support',
        'Horloge &amp; Réponse Canada (16 oct.)': 'Countdown &amp; Canada Response (Oct. 16)',
        'Kit Média &amp; Déclarations': 'Press Kit &amp; Statements',
        'Interventions Télé &amp; Radio': 'TV &amp; Radio Appearances',
        'Communiqués de presse': 'Press Releases',
        'Dossier documentaire pour journalistes': 'Media Documentary Dossier',
        'Photos haute résolution &amp; Licences': 'High-Res Photos &amp; Licenses',
        'Charte de déontologie de l\'information': 'Journalistic Code of Ethics',
        'Déclaration Anti-SLAPP': 'Anti-SLAPP Declaration',
        'Gouvernance &amp; Indépendance': 'Governance &amp; Independence',
        'Politique de modération': 'Moderation Policy',
        'Cadre éthique de l\'IA': 'AI Ethical Framework',
        'Accueil': 'Home',
        'Biographie': 'Biography',
        'Dossier Stablex': 'Stablex Case',
        'Tableau CCE': 'CEC Tracker',
        'Contact': 'Contact',
        'Presse': 'Press',
        'Diplomatie': 'Diplomacy',
        'Horloge Live': 'Live Countdown'
    },
    'es': {
        'En-tête du site': 'Encabezado del sitio',
        'Dossier CCE &amp; Stablex': 'Expediente CCA y Stablex',
        'Dossier CCE & Stablex': 'Expediente CCA y Stablex',
        'Enquêtes &amp; Analyses': 'Investigaciones y análisis',
        'Enquêtes & Analyses': 'Investigaciones y análisis',
        'Registre CCE &amp; Pièces': 'Registro CCA y pruebas',
        'Registre CCE & Pièces': 'Registro CCA y pruebas',
        'Suivi &amp; Outils Direct': 'Seguimiento y herramientas directas',
        'Suivi & Outils Direct': 'Seguimiento y herramientas directas',
        'Espace Presse &amp; Médias': 'Prensa y medios',
        'Espace Presse & Médias': 'Prensa y medios',
        'Mobilisation &amp; Action': 'Movilización y acción',
        'Mobilisation & Action': 'Movilización y acción',
        'Fermer': 'Cerrar',
        'Fermer le menu': 'Cerrar menú',
        'Ouvrir le menu de navigation': 'Abrir menú de navegación',
        'Navigation principale': 'Navegación principal',
        'Contenu mis à disposition sous licence': 'Contenido puesto a disposición bajo licencia',
        'Consulter les documents': 'Consultar documentos',
        'Version texte': 'Versión de texto',
        'Conditions d\'utilisation': 'Términos de uso',
        'Politique de confidentialité': 'Política de privacidad',
        'Haut ↑': 'Arriba ↑',
        'Lire l\'article ↗': 'Leer artículo ↗',
        'Copier le lien': 'Copiar enlace',
        'Partager': 'Compartir',
        'Dossier d\'enquête Stablex': 'Expediente de investigación Stablex',
        'Enquête : Contamination &amp; Mesures': 'Investigación: Contaminación y medidas',
        'Dossier : Histoire autochtone &amp; Écologie': 'Dossier: Historia indígena y ecología',
        'Dossier expliqué &amp; Vulgarisation (SEM-26-003)': 'Expediente explicado y divulgación (SEM-26-003)',
        'Lexique &amp; Dictionnaire citoyen': 'Glosario y diccionario ciudadano',
        'Observations de l\'auteur (17 oct.)': 'Observaciones del autor (17 oct.)',
        'Réponse du Canada (16 oct.)': 'Respuesta de Canadá (16 oct.)',
        'Registre officiel CCE (Direct)': 'Registro oficial CCA (Directo)',
        'Explorateur documentaire': 'Explorador documental',
        'Miroirs Décentralisés (IPFS/Tor)': 'Espejos descentralizados (IPFS/Tor)',
        'Comment Agir &amp; Soutenir': 'Cómo actuar y apoyar',
        'Horloge &amp; Réponse Canada (16 oct.)': 'Reloj y respuesta de Canadá (16 oct.)',
        'Kit Média &amp; Déclarations': 'Kit de prensa y declaraciones',
        'Interventions Télé &amp; Radio': 'Apariciones en TV y radio',
        'Communiqués de presse': 'Comunicados de prensa',
        'Dossier documentaire pour journalistes': 'Dossier documental para periodistas',
        'Photos haute résolution &amp; Licences': 'Fotos de alta resolución y licencias',
        'Charte de déontologie de l\'information': 'Código deontológico de la información',
        'Déclaration Anti-SLAPP': 'Declaración Anti-SLAPP',
        'Gouvernance &amp; Indépendance': 'Gobernanza e independencia',
        'Politique de modération': 'Política de moderación',
        'Cadre éthique de l\'IA': 'Marco ético de la IA',
        'Accueil': 'Inicio',
        'Biographie': 'Biografía',
        'Dossier Stablex': 'Caso Stablex',
        'Tableau CCE': 'Panel CCA',
        'Contact': 'Contacto',
        'Presse': 'Prensa',
        'Diplomatie': 'Diplomacia',
        'Horloge Live': 'Reloj en vivo'
    }
}

KEY_ENTITIES = [
    'Nadine Le Gal', 'Sylvain Pagé', 'William Guindon', 'Daniel Green', 'Édith Mora Castelan',
    'BAPE 371', 'Loi 93', 'Bill 93', 'Ley 93', 'SEM-26-003', 'Kanien\'kehá:ka', 'Makigôtekw',
    'Jerry DeMarco', 'Marcos A. Orellana', 'Madeleine Chenette'
]

def parse_txt_file(filepath):
    if not os.path.exists(filepath):
        return '', '', []
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    title = ''
    desc = ''
    for line in content.splitlines()[:25]:
        if (line.startswith('TITLE') or line.startswith('TITRE') or line.startswith('TÍTULO')) and ':' in line:
            title = line.split(':', 1)[1].strip()
        elif line.startswith('DESCRIPTION') and ':' in line:
            desc = line.split(':', 1)[1].strip()
            
    parts = content.split('══════════════════════════════════════════════════════════════════════════\n\n')
    if len(parts) < 2:
        return title, desc, []
    body = parts[1].split('\n\n══════════════════════════════════════════════════════════════════════════')[0]
    blocks = [b.strip() for b in body.split('\n\n') if b.strip()]
    return title, desc, blocks

def clean_block_lines(block):
    """Sépare les lignes signifiantes d'un bloc en retirant les marqueurs Markdown."""
    lines = []
    for l in block.splitlines():
        l = l.strip()
        if not l:
            continue
        cleaned = re.sub(r'^[#>\-\*]+\s*', '', l).strip()
        if cleaned:
            lines.append(cleaned)
    return lines

def build_page(page_name, lang):
    if page_name == 'index':
        src_html_rel = 'index.html'
        out_html_rel = 'index.html'
        page_slug = ''
    elif page_name == 'api_index':
        src_html_rel = 'api/index.html'
        out_html_rel = 'api.html'
        page_slug = 'api.html'
    else:
        src_html_rel = f'{page_name}.html'
        out_html_rel = f'{page_name}.html'
        page_slug = f'{page_name}.html'

    src_html_path = os.path.join(WORKSPACE_DIR, src_html_rel)
    if not os.path.exists(src_html_path):
        return False

    with open(src_html_path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    fr_txt = os.path.join(SOURCE_TXT_DIR, 'fr', f'{page_name}.txt')
    tr_txt = os.path.join(SOURCE_TXT_DIR, lang, f'{page_name}.txt')

    t_fr, d_fr, b_fr = parse_txt_file(fr_txt)
    t_tr, d_tr, b_tr = parse_txt_file(tr_txt)

    # 1. Mise à jour de la langue HTML
    lang_attr = 'en' if lang == 'en' else 'es'
    html = re.sub(r'<html[^>]*lang=["\'][^"\']*["\'][^>]*>', f'<html lang="{lang_attr}">', html, count=1)

    # 2. Mise à jour du Titre
    if t_tr:
        html = re.sub(r'<title>.*?</title>', f'<title>{t_tr}</title>', html, count=1, flags=re.DOTALL)

    # 3. Mise à jour de la Méta Description
    if d_tr:
        html = re.sub(r'<meta\s+name=["\']description["\']\s+content=["\'].*?["\']\s*/?>', f'<meta name="description" content="{d_tr}">', html, count=1, flags=re.DOTALL)
        html = re.sub(r'<meta\s+content=["\'].*?["\']\s+name=["\']description["\']\s*/?>', f'<meta name="description" content="{d_tr}">', html, count=1, flags=re.DOTALL)

    # 4. Canonical & Hreflang
    canonical_url = f'https://williamguindon.me/{lang}/{page_slug}'
    html = re.sub(r'<link\s+rel=["\']canonical["\'][^>]*>', f'<link rel="canonical" href="{canonical_url}">', html, count=1)

    hreflang_tags = (
        f'<link rel="alternate" hreflang="fr-CA" href="https://williamguindon.me/{page_slug}">\n'
        f'  <link rel="alternate" hreflang="en" href="https://williamguindon.me/en/{page_slug}">\n'
        f'  <link rel="alternate" hreflang="es" href="https://williamguindon.me/es/{page_slug}">\n'
        f'  <link rel="alternate" hreflang="x-default" href="https://williamguindon.me/{page_slug}">'
    )
    if '<link rel="alternate" hreflang=' in html:
        html = re.sub(r'(<link\s+rel=["\']alternate["\']\s+hreflang=[^>]*>\s*)+', hreflang_tags + '\n  ', html, count=1)
    else:
        html = html.replace('</head>', f'  {hreflang_tags}\n</head>', 1)

    # 5. Ajustement des chemins d'assets relatifs (le fichier est situé dans /{lang}/)
    html = re.sub(r'href=["\']style\.css(["\'])', r'href="../style.css\1', html)
    html = re.sub(r'href=["\']style\.css\?([^"\']+)["\']', r'href="../style.css?\1"', html)

    html = re.sub(r'src=["\']assets/', 'src="../assets/', html)
    html = re.sub(r'href=["\']assets/', 'href="../assets/', html)
    html = re.sub(r'src=["\']data/', 'src="../data/', html)
    html = re.sub(r'href=["\']data/', 'href="../data/', html)

    html = re.sub(r'src=["\']theme\.js(["\'])', r'src="../theme.js\1', html)
    html = re.sub(r'src=["\']theme\.js\?([^"\']+)["\']', r'src="../theme.js?\1"', html)

    html = re.sub(r'href=["\']favicon', 'href="../favicon', html)
    html = re.sub(r'href=["\']apple-touch-icon\.png["\']', 'href="../apple-touch-icon.png"', html)
    html = re.sub(r'href=["\']site\.webmanifest["\']', 'href="../site.webmanifest"', html)
    html = re.sub(r'href=["\']manifest\.json["\']', 'href="../manifest.json"', html)
    html = re.sub(r'href=["\']feed\.xml["\']', 'href="../feed.xml"', html)

    for asset in ROOT_ASSETS:
        html = re.sub(rf'href=["\']{re.escape(asset)}(["\']|#|\?)', rf'href="../{asset}\1', html)
        html = re.sub(rf'src=["\']{re.escape(asset)}(["\']|#|\?)', rf'src="../{asset}\1', html)

    html = re.sub(r'src=["\']api/', 'src="../api/', html)
    html = re.sub(r'href=["\']api/', 'href="../api/', html)
    if page_name == 'api_index':
        html = re.sub(r'href=["\']v1/', 'href="../api/v1/', html)

    html = html.replace("this.src='assets/", "this.src='../assets/")
    html = html.replace("this.src='tourbiere.jpg'", "this.src='../tourbiere.jpg'")

    # 5b. Mise à jour de l'état du sélecteur de langue dans la navbar statique
    code_upper = 'EN' if lang == 'en' else 'ES'
    html = html.replace('<span class="current-lang-code">FR</span>', f'<span class="current-lang-code">{code_upper}</span>')
    html = html.replace('class="nav-dropdown-item lang-select-btn active" data-lang="fr"', 'class="nav-dropdown-item lang-select-btn" data-lang="fr"')
    html = html.replace(f'class="nav-dropdown-item lang-select-btn" data-lang="{lang}"', f'class="nav-dropdown-item lang-select-btn active" data-lang="{lang}"')

    # 6. Redirection des liens vers pages exclues françaises (vers ../page.html)
    for excl in EXCLUDED_PAGES:
        html = re.sub(rf'href=["\']{re.escape(excl)}(["\']|#|\?)', rf'href="../{excl}\1', html)
        clean_slug = excl.replace('.html', '')
        if clean_slug != 'index':
            html = re.sub(rf'href=["\']{re.escape(clean_slug)}(["\']|#|\?)', rf'href="../{clean_slug}\1', html)

    # 7. Remplacement précis du contenu des balises textuelles (p, h1-h6, blockquote, li, summary)
    if b_fr and b_tr:
        # Construction des paires probe -> translated text
        replacements = []
        for idx in range(min(len(b_fr), len(b_tr))):
            fr_lines = clean_block_lines(b_fr[idx])
            tr_lines = clean_block_lines(b_tr[idx])

            if not fr_lines or not tr_lines:
                continue

            # Cas 1 : bloc multilignes régulier
            if len(fr_lines) == len(tr_lines):
                for fl, tl in zip(fr_lines, tr_lines):
                    words = fl.split()
                    if len(words) >= 3:
                        probe = ' '.join(words[:4]).lower()
                        replacements.append((probe, tl, len(words)))
            else:
                # Cas 2 : paragraphe complet regroupé
                full_fl = ' '.join(fr_lines)
                full_tl = ' '.join(tr_lines)
                words = full_fl.split()
                if len(words) >= 3:
                    probe = ' '.join(words[:4]).lower()
                    replacements.append((probe, full_tl, len(words)))

        # Tri par spécificité décroissante (les probes les plus longues d'abord)
        replacements.sort(key=lambda x: x[2], reverse=True)

        # Remplacement au niveau des balises HTML terminales
        tag_pattern = r'<(?P<tag>p|h[1-6]|blockquote|summary)\b[^>]*>([\s\S]*?)</(?P=tag)>'

        def replace_tag_content(m):
            tag = m.group('tag')
            full = m.group(0)
            open_tag = full[:full.index('>') + 1]
            close_tag = f'</{tag}>'
            inner = m.group(2)
            
            # Ne pas écraser si le tag contient déjà des sous-balises structurelles majeures
            if '<div' in inner or '<article' in inner or '<section' in inner or '<table' in inner:
                return full

            inner_clean = ' '.join(re.sub(r'<[^>]+>', ' ', inner).split()).lower()

            for probe, tr_text, _ in replacements:
                if probe in inner_clean:
                    # Rétablissement des <strong> pour les entités clés
                    formatted_text = tr_text
                    for ent in KEY_ENTITIES:
                        if ent in formatted_text and f'<strong>{ent}</strong>' not in formatted_text:
                            formatted_text = formatted_text.replace(ent, f'<strong>{ent}</strong>', 1)
                    return f'{open_tag}\n          {formatted_text}\n        {close_tag}'

            return full

        html = re.sub(tag_pattern, replace_tag_content, html)

    # 8. Remplacements des chaînes d'interface communes (menus, boutons, métas)
    repl_dict = COMMON_REPLACEMENTS.get(lang, {})
    for fr_str, tr_str in repl_dict.items():
        html = html.replace(fr_str, tr_str)

    # 9. Écriture du fichier HTML de sortie
    out_dir = os.path.join(WORKSPACE_DIR, lang)
    os.makedirs(out_dir, exist_ok=True)
    out_html_path = os.path.join(out_dir, out_html_rel)

    with open(out_html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    return True

def main():
    csv_file = os.path.join(WORKSPACE_DIR, 'pages-index.csv')
    if not os.path.exists(csv_file):
        print(f"❌ Erreur : {csv_file} introuvable.")
        sys.exit(1)

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        pages = [r['page'] for r in reader]

    print(f"🚀 Lancement de la génération automatisée pour {len(pages)} pages...")

    success_en = 0
    success_es = 0

    for page in pages:
        if build_page(page, 'en'):
            success_en += 1
        if build_page(page, 'es'):
            success_es += 1

    print(f"✔ Génération EN : {success_en} pages HTML créées dans /en/")
    print(f"✔ Génération ES : {success_es} pages HTML créées dans /es/")
    print("🎉 Compilation globale multilingue terminée avec succès !")

if __name__ == '__main__':
    main()
