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
        'Déclaration Anti-SLAPP': 'Anti-SLAPP Statement',
        'Gouvernance &amp; Indépendance': 'Governance &amp; Independence',
        'Politique de modération': 'Moderation Policy',
        'Cadre éthique de l\'IA': 'AI Ethical Framework',
        'Accueil': 'Home',
        'Biographie': 'Biography',
        'Dossier Stablex': 'Stablex Case',
        'Tableau CCE': 'CEC Dashboard',
        'Contact': 'Contact',
        'Presse': 'Press',
        'Diplomatie': 'Diplomacy',
        'Horloge Live': 'Live Clock',
        'Actions clés': 'Key Actions',
        'Consulter le dossier CCE ↗': 'View CEC docket ↗',
        'Espace presse ↗': 'Press room ↗',
        'Écouter la biographie (audio)': 'Listen to biography (audio)',
        'Version courte': 'Short version',
        'Signaler une erreur': 'Report an error',
        'Imprimer ce document': 'Print this document',
        'Imprimer la page': 'Print page',
        'Imprimer': 'Print'
    },
    'es': {
        'En-tête du site': 'Encabezado del sitio',
        'Dossier CCE &amp; Stablex': 'Expediente CCA &amp; Stablex',
        'Dossier CCE & Stablex': 'Expediente CCA & Stablex',
        'Enquêtes &amp; Analyses': 'Investigaciones &amp; Análisis',
        'Enquêtes & Analyses': 'Investigaciones & Análisis',
        'Registre CCE &amp; Pièces': 'Registro CCA &amp; Pruebas',
        'Registre CCE & Pièces': 'Registro CCA & Pruebas',
        'Suivi &amp; Outils Direct': 'Seguimiento &amp; Herramientas',
        'Suivi & Outils Direct': 'Seguimiento & Herramientas',
        'Espace Presse &amp; Médias': 'Sala de Prensa &amp; Medios',
        'Espace Presse & Médias': 'Sala de Prensa & Medios',
        'Mobilisation &amp; Action': 'Movilización &amp; Acción',
        'Mobilisation & Action': 'Movilización & Acción',
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
        'Horloge Live': 'Reloj en vivo',
        'Actions clés': 'Acciones clave',
        'Consulter le dossier CCE ↗': 'Ver expediente CCA ↗',
        'Espace presse ↗': 'Sala de prensa ↗',
        'Écouter la biographie (audio)': 'Escuchar biografía (audio)',
        'Version courte': 'Versión corta',
        'Signaler une erreur': 'Informar de un error',
        'Imprimer ce document': 'Imprimir este documento',
        'Imprimer la page': 'Imprimir página',
        'Imprimer': 'Imprimir'
    }
}

KEY_ENTITIES = [
    'Nadine Le Gal', 'Sylvain Pagé', 'William Guindon', 'Daniel Green', 'Édith Mora Castelan',
    'BAPE 371', 'Loi 93', 'Bill 93', 'Ley 93', 'SEM-26-003', 'Kanien\'kehá:ka', 'Makigôtekw',
    'Jerry DeMarco', 'Marcos A. Orellana', 'Madeleine Chenette'
]

def extract_units(filepath):
    """
    Extrait les unités textuelles sémantiques atomiques d'un fichier Markdown (.txt).
    Sépare strictement :
    - Les titres (heading)
    - Les éléments de liste (list_item)
    - Les paragraphes normaux (p)
    """
    if not os.path.exists(filepath):
        return []
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    parts = content.split('══════════════════════════════════════════════════════════════════════════\n\n')
    if len(parts) < 2:
        return []
    body = parts[1].split('\n\n══════════════════════════════════════════════════════════════════════════')[0]
    
    units = []
    for block in body.split('\n\n'):
        block = block.strip()
        if not block:
            continue
        lines = block.splitlines()
        current_type = None
        current_lines = []
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            # Titres Markdown (#, ##, ###)
            if re.match(r'^#{1,6}\s+', line_str):
                if current_lines:
                    units.append((current_type, ' '.join(current_lines)))
                    current_lines = []
                units.append(('heading', line_str))
                current_type = None
            # Éléments de liste (- ou * ou 1. ) mais PAS les continuations avec indentation
            elif re.match(r'^([\-\*]|\d+\.)\s+[^\s\-]', line) and not line.startswith('-   ') and not line.startswith('    '):
                if current_lines:
                    units.append((current_type, ' '.join(current_lines)))
                    current_lines = []
                current_type = 'list_item'
                current_lines.append(re.sub(r'^([\-\*]|\d+\.)\s+', '', line_str))
            else:
                if current_type is None:
                    current_type = 'p'
                cleaned = re.sub(r'^[\-\*\s]{2,4}', '', line_str) if current_type == 'list_item' else line_str
                current_lines.append(cleaned)
        if current_lines:
            units.append((current_type, ' '.join(current_lines)))
    return units

def get_meta_info(filepath):
    if not os.path.exists(filepath):
        return '', ''
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    title = ''
    desc = ''
    for line in content.splitlines()[:25]:
        if (line.startswith('TITLE') or line.startswith('TITRE') or line.startswith('TÍTULO')) and ':' in line:
            title = line.split(':', 1)[1].strip()
        elif line.startswith('DESCRIPTION') and ':' in line:
            desc = line.split(':', 1)[1].strip()
    return title, desc

def build_page(page_name, lang):
    if page_name == 'index':
        src_html_rel = 'index.html'
        out_html_rel = 'index.html'
        clean_slug = ''
    elif page_name == 'api_index':
        src_html_rel = 'api/index.html'
        out_html_rel = 'api.html'
        clean_slug = 'api'
    else:
        src_html_rel = f'{page_name}.html'
        out_html_rel = f'{page_name}.html'
        clean_slug = page_name

    src_html_path = os.path.join(WORKSPACE_DIR, src_html_rel)
    if not os.path.exists(src_html_path):
        return False

    with open(src_html_path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    fr_txt = os.path.join(SOURCE_TXT_DIR, 'fr', f'{page_name}.txt')
    tr_txt = os.path.join(SOURCE_TXT_DIR, lang, f'{page_name}.txt')

    t_tr, d_tr = get_meta_info(tr_txt)
    u_fr = extract_units(fr_txt)
    u_tr = extract_units(tr_txt)

    # 1. Mise à jour de la langue HTML
    lang_attr = 'en' if lang == 'en' else 'es'
    html = re.sub(r'<html[^>]*lang=["\'][^"\']*["\'][^>]*>', f'<html lang="{lang_attr}">', html, count=1)

    def escape_attr(val):
        return val.replace('"', '&quot;')

    # 2. Mise à jour de la balise Title et Meta Description
    if t_tr:
        clean_t = escape_attr(t_tr)
        html = re.sub(r'<title>.*?</title>', f'<title>{clean_t}</title>', html, count=1)
        html = re.sub(r'<meta\s+property=["\']og:title["\']\s+content="[^"]*"', f'<meta property="og:title" content="{clean_t}"', html)
        html = re.sub(r'<meta\s+name=["\']twitter:title["\']\s+content="[^"]*"', f'<meta name="twitter:title" content="{clean_t}"', html)

    if d_tr:
        clean_d = escape_attr(d_tr)
        html = re.sub(r'<meta\s+name=["\']description["\']\s+content="[^"]*"', f'<meta name="description" content="{clean_d}"', html)
        html = re.sub(r'<meta\s+property=["\']og:description["\']\s+content="[^"]*"', f'<meta property="og:description" content="{clean_d}"', html)
        html = re.sub(r'<meta\s+name=["\']twitter:description["\']\s+content="[^"]*"', f'<meta name="twitter:description" content="{clean_d}"', html)

    # 3. Canonical et balises hreflang
    base_url = f'https://williamguindon.me/{lang}/' if clean_slug == '' else f'https://williamguindon.me/{lang}/{clean_slug}'
    html = re.sub(r'<link rel=["\']canonical["\'] href=["\'][^"\']*["\']', f'<link rel="canonical" href="{base_url}"', html)

    # 4. Normalisation absolue des chemins de ressources vers la racine (/assets/, /style.css, etc.)
    html = re.sub(r'(src|href)=["\']style\.css(["\']|\?)', r'\1="/style.css\2', html)
    html = re.sub(r'(src|href)=["\']theme\.js(["\']|\?)', r'\1="/theme.js\2', html)
    html = re.sub(r'(src|href)=["\']sw\.js(["\']|\?)', r'\1="/sw.js\2', html)
    html = re.sub(r'(src|href|srcset)=["\']assets/', r'\1="/assets/', html)
    html = re.sub(r'(src|href|srcset)=["\']\.\./assets/', r'\1="/assets/', html)

    for asset in ROOT_ASSETS:
        html = re.sub(rf'(src|href|srcset)=["\']{re.escape(asset)}(["\']|\?)', rf'\1="/{asset}\2', html)
        html = re.sub(rf'(src|href|srcset)=["\']\.\./{re.escape(asset)}(["\']|\?)', rf'\1="/{asset}\2', html)

    # 5. Sélecteur de langue natif propre
    page_target = f'/{clean_slug}' if clean_slug else '/'
    en_target = f'/en/{clean_slug}' if clean_slug else '/en/'
    es_target = f'/es/{clean_slug}' if clean_slug else '/es/'

    lang_btn_text = 'EN' if lang == 'en' else 'ES'
    html = re.sub(r'<span class="current-lang-code">.*?</span>', f'<span class="current-lang-code">{lang_btn_text}</span>', html)

    active_fr = ' active' if lang == 'fr' else ''
    active_en = ' active' if lang == 'en' else ''
    active_es = ' active' if lang == 'es' else ''

    lang_menu_replacement = f'''<div class="nav-dropdown-menu nav-lang-menu" role="menu">
          <span class="nav-dropdown-group-title">Langue / Language</span>
          <a href="{page_target}" class="nav-dropdown-item lang-select-btn{active_fr}" data-lang="fr" role="menuitem">
            <span class="lang-name">Français</span>
            <span class="lang-tag">FR</span>
          </a>
          <a href="{en_target}" class="nav-dropdown-item lang-select-btn{active_en}" data-lang="en" role="menuitem">
            <span class="lang-name">English</span>
            <span class="lang-tag">EN</span>
          </a>
          <a href="{es_target}" class="nav-dropdown-item lang-select-btn{active_es}" data-lang="es" role="menuitem">
            <span class="lang-name">Español</span>
            <span class="lang-tag">ES</span>
          </a>
        </div>'''

    html = re.sub(r'<div class="nav-dropdown-menu nav-lang-menu"[\s\S]*?</div>\s*</div>', f'{lang_menu_replacement}\n      </div>', html)

    # 6. Routage des liens internes
    for excl in EXCLUDED_PAGES:
        clean_excl = excl.replace('.html', '')
        target_excl = '../' if clean_excl == 'index' else f'../{clean_excl}'
        html = re.sub(rf'href=["\']{re.escape(excl)}(["\']|#|\?)', rf'href="{target_excl}\1', html)
        if clean_excl != 'index':
            html = re.sub(rf'href=["\']{re.escape(clean_excl)}(["\']|#|\?)', rf'href="../{clean_excl}\1', html)

    html = re.sub(r'href=["\']index\.html(["\']|#|\?)', r'href="./\1', html)
    html = re.sub(r'href=["\']api/index\.html(["\']|#|\?)', r'href="api\1', html)
    html = re.sub(r'href=["\']([a-zA-Z0-9_\-]+)\.html(["\']|#|\?)', r'href="\1\2', html)

    # 7. Remplacement du contenu de TOUTES les balises textuelles terminales
    if u_fr and u_tr:
        pairs = []
        for idx in range(min(len(u_fr), len(u_tr))):
            u_type, fr_raw = u_fr[idx]
            _, tr_raw = u_tr[idx]

            fr_clean = re.sub(r'^#{1,6}\s+', '', fr_raw).strip()
            tr_clean = re.sub(r'^#{1,6}\s+', '', tr_raw).strip()

            words = fr_clean.split()
            if len(words) >= 3:
                probe = ' '.join(words[:4]).lower()
                pairs.append((probe, tr_clean, len(words), u_type, fr_clean))

        pairs.sort(key=lambda x: x[2], reverse=True)

        tag_pattern = r'<(?P<tag>p|li|h[1-6]|blockquote|summary|figcaption|dt|dd)\b(?P<attrs>[^>]*)>(?P<inner>[\s\S]*?)</(?P=tag)>'

        def replace_tag_content(m):
            tag = m.group('tag')
            attrs = m.group('attrs')
            inner = m.group('inner')

            # Ne pas remplacer si la balise contient des blocs structurels majeurs
            if '<div' in inner or '<article' in inner or '<section' in inner or '<table' in inner or '<form' in inner:
                return m.group(0)

            # Éviter de gonfler démesurément un titre (sécurité h1-h6)
            is_heading = tag.startswith('h')

            inner_clean = ' '.join(re.sub(r'<[^>]+>', ' ', inner).split()).lower()

            for probe, tr_text, _, u_type, fr_orig in pairs:
                if probe in inner_clean:
                    # Si c'est un titre et que le texte de traduction contient plusieurs phrases ou paragraphes,
                    # ne garder que la première ligne / titre court
                    if is_heading:
                        tr_first = tr_text.splitlines()[0]
                        if len(tr_first.split()) > 14 and ':' in tr_first:
                            tr_first = tr_first.split(':', 1)[0].strip()
                        formatted_text = tr_first
                    else:
                        formatted_text = tr_text

                    # Restaurer les liens existants s'ils étaient présents dans l'original
                    links_match = re.findall(r'<a\b[^>]*>[\s\S]*?</a>', inner)
                    # Si l'élément entier était un lien unique (<a ...>texte</a>)
                    single_link = re.match(r'^\s*<a\b(?P<a_attrs>[^>]*)>[\s\S]*?</a>\s*$', inner)
                    if single_link:
                        a_attrs = single_link.group('a_attrs')
                        return f'<{tag}{attrs}><a{a_attrs}>{formatted_text}</a></{tag}>'

                    # Restaurer le préfixe <strong>... :</strong> s'il était présent
                    strong_match = re.match(r'^\s*<strong[^>]*>([\s\S]*?)</strong>\s*(.*)', inner, re.DOTALL)
                    if strong_match and ':' in formatted_text:
                        parts = formatted_text.split(':', 1)
                        formatted_text = f'<strong>{parts[0].strip()} :</strong> {parts[1].strip()}'

                    # Si des liens internes étaient en fin de phrase (ex: (voir <a ...>...</a>))
                    if links_match and not single_link:
                        # Si le lien n'est pas déjà dans le texte formaté
                        for l_html in links_match:
                            if l_html not in formatted_text:
                                # Attacher le lien proprement s'il contient une référence
                                href_match = re.search(r'href=["\']([^"\']+)["\']', l_html)
                                if href_match:
                                    target_href = href_match.group(1)
                                    clean_target = target_href.replace('.html', '')
                                    formatted_text += f' <a href="{clean_target}">↗</a>'

                    # Rétablissement des <strong> pour les entités clés
                    for ent in KEY_ENTITIES:
                        if ent in formatted_text and f'<strong>{ent}</strong>' not in formatted_text:
                            formatted_text = formatted_text.replace(ent, f'<strong>{ent}</strong>', 1)

                    return f'<{tag}{attrs}>\n          {formatted_text}\n        </{tag}>'

            return m.group(0)

        html = re.sub(tag_pattern, replace_tag_content, html)

    # 8. Remplacements des signatures dans les chartes et politiques
    sig_text = 'Original signed' if lang == 'en' else 'Original firmado'
    html = re.sub(r'<span class="signature-caption">.*?</span>', f'<span class="signature-caption">{sig_text}</span>', html)

    # 9. Remplacements des chaînes d'interface communes (menus, boutons, métas)
    repl_dict = COMMON_REPLACEMENTS.get(lang, {})
    for fr_str, tr_str in repl_dict.items():
        html = html.replace(fr_str, tr_str)

    # 10. Écriture du fichier HTML de sortie
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
