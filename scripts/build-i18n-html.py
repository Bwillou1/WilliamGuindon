#!/usr/bin/env python3
"""
scripts/build-i18n-html.py

Génère automatiquement l'intégralité des pages HTML statiques en anglais (/en/) et en espagnol (/es/)
à partir des pages françaises de référence, du corpus de traduction williamguindon-me-txt (50 pages)
et du dictionnaire complémentaire scripts/i18n-extra-translations.json.

Architecture :
- Français (langue initiale faisant foi) : racine du site (/ et /*.html) avec lang="fr" et hreflang="fr"
- Anglais : /en/ et /en/*.html avec lang="en"
- Espagnol : /es/ et /es/*.html avec lang="es"
"""

import os
import re
import csv
import sys
import json
import html as htmllib

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SOURCE_TXT_DIR = '/Users/williamguindon/Library/Mobile Documents/com~apple~CloudDocs/Téléchargements/workspace-01a1b612-322f-75df-a0d9-1ed4c72a6a68/williamguindon-me-txt'
EXTRA_JSON_PATH = os.path.join(WORKSPACE_DIR, 'scripts', 'i18n-extra-translations.json')

# Pages exclues de la traduction qui doivent toujours renvoyer vers le fichier français d'origine à la racine
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

TRANSLATED_SLUGS = {
    'adultisme', 'agir', 'ai', 'anti-slapp', 'apercu', 'api', 'apparitions-publiques',
    'autochtone', 'blog', 'communiques', 'contamination', 'correspondance', 'deontologie',
    'dependances-licences', 'dev', 'diplomatie', 'dossier-journalistes',
    'edition-speciale-reconciliation', 'embargo', 'experts', 'flux', 'halloween',
    'ia-ethique', 'independance', 'index', 'lecteur', 'lexique', 'licence-et-charte',
    'liens', 'live', 'lobby', 'messagerie', 'miroirs', 'netiquette', 'photos',
    'politique-traduction', 'politiques', 'portrait', 'presse', 'privacy', 'projets',
    'protection-archive', 'reciprocite', 'satellite', 'stablex', 'statut',
    'telechargement-archive', 'terms', 'tracabilite', 'txt', 'viewer'
}

def localize_all_links(html, lang):
    """Localise de manière absolue et sans ambiguïté tous les liens internes vers /{lang}/{slug} (0 ms de redirection)."""
    def _repl(m):
        full = m.group(0)
        attr = m.group(1)
        quote = m.group(2)
        raw_url = m.group(3)

        # Ignorer liens externes, ancres pures, protocoles non-web
        if raw_url.startswith(('http://', 'https://', 'mailto:', 'tel:', 'javascript:', '#')):
            return full

        url_match = re.match(r'^([^?#]*)([?#].*)?$', raw_url)
        path_part = url_match.group(1) if url_match else raw_url
        extra_part = url_match.group(2) or '' if url_match else ''

        # Ignorer ressources et documents statiques (vérifié sur le chemin, sans la query)
        if path_part.startswith(('/assets/', '/data/', 'assets/', 'data/')) or re.search(r'\.(css|js|png|jpg|jpeg|webp|svg|pdf|xml|json|txt|zip|woff2?|ttf|ico|vcf)$', path_part, re.I):
            return full

        clean = path_part.strip().lstrip('./').lstrip('/')
        clean_slug = clean.replace('.html', '').lower()

        if clean_slug in ('', 'index'):
            return f'{attr}{quote}/{lang}/{extra_part}{quote}'

        if clean.startswith(('en/', 'es/')):
            parts = clean.split('/', 1)
            clean_slug = parts[1].replace('.html', '').lower() if len(parts) > 1 else ''
            if clean_slug in ('', 'index'):
                return f'{attr}{quote}/{lang}/{extra_part}{quote}'

        if clean_slug in TRANSLATED_SLUGS:
            return f'{attr}{quote}/{lang}/{clean_slug}{extra_part}{quote}'

        # Page exclue (reste en version française à la racine)
        return f'{attr}{quote}/{clean_slug}{extra_part}{quote}'

    return re.sub(r'(href=)(["\'])([^"\']+)["\']', _repl, html)

ROOT_ASSETS = [
    'tourbiere.jpg',
    'tourbiere-thumb.webp',
    'blainville_latest.png',
    'blainville_capture_3.png',
    'navbar.js',
    'countdown-live.svg',
    'publickey.asc',
    'transcriptions.txt',
    'llms-full.txt',
    'llms.txt',
    'robots.txt',
    'status.json',
    'apis.json',
    'openapi.json',
    'security.txt',
    'manifest.json',
    'feed.xml',
    'sitemap.xml',
    'william-guindon.vcf',
    'vcard.vcf'
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
        'Fermer les notifications': 'Close notifications',
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
        'Fermer les notifications': 'Cerrar notificaciones',
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

NESTED_BLOCK_RE = re.compile(
    r'<(div|p|section|article|table|thead|tbody|tr|ul|ol|dl|h[1-6]|li|blockquote|details|aside|header|footer|nav|form|figure|picture|img|video|audio|svg|canvas|iframe)\b',
    re.I
)


def norm(s, strip_prefix=False):
    """Normalise une chaîne HTML ou texte pour comparaison exacte sans faux positifs."""
    s = re.sub(r'<[^>]+>', ' ', s)
    s = htmllib.unescape(s)
    s = s.replace('\u2019', "'").replace('\u2018', "'").replace('\u00a0', ' ').replace('\u202f', ' ')
    s = ' '.join(s.split()).strip().lower()
    if strip_prefix:
        s = re.sub(r'^(\d+[\.\)]\s*|[•▸·✓✔✕✗→➔🔒📄⚖️🏛️🔬📊📡🛡️⚡🌐📥🔗📌]+\s*)', '', s)
    return s


def extract_units(filepath):
    """
    Extrait les unités textuelles sémantiques atomiques d'un fichier Markdown (.txt).
    Sépare strictement :
    - Les titres (heading : # .. ######)
    - Les en-têtes de tableau (th : ▸ ...)
    - Les cellules de tableau (td : · ...)
    - Les légendes de tableau (caption : [Légende] / [Caption] / [Leyenda])
    - Les citations (quote : > ...)
    - Les éléments de liste (list_item : - / * / 1..99.)
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
            if re.match(r'^#{1,6}\s+', line_str):
                if current_lines:
                    units.append((current_type, ' '.join(current_lines)))
                    current_lines = []
                units.append(('heading', re.sub(r'^#{1,6}\s+', '', line_str).strip()))
                current_type = None
            elif line_str.startswith('▸ '):
                if current_lines:
                    units.append((current_type, ' '.join(current_lines)))
                    current_lines = []
                units.append(('th', line_str[2:].strip()))
                current_type = None
            elif line_str.startswith('· '):
                if current_lines:
                    units.append((current_type, ' '.join(current_lines)))
                    current_lines = []
                current_type = 'td'
                current_lines.append(line_str[2:].strip())
            elif re.match(r'^\[(Légende|Caption|Leyenda)\]\s*', line_str, re.I):
                if current_lines:
                    units.append((current_type, ' '.join(current_lines)))
                    current_lines = []
                units.append(('caption', re.sub(r'^\[(Légende|Caption|Leyenda)\]\s*', '', line_str, flags=re.I).strip()))
                current_type = None
            elif line_str.startswith('> '):
                if current_lines and current_type != 'quote':
                    units.append((current_type, ' '.join(current_lines)))
                    current_lines = []
                current_type = 'quote'
                current_lines.append(line_str[2:].strip())
            elif (
                re.match(r'^([\-\*]|\d{1,2}\.)\s+[^\s\-]', line)
                and not line.startswith('-   ')
                and not line.startswith('    ')
                and not line_str.startswith('- Pas de Modification')
            ):
                if current_lines:
                    units.append((current_type, ' '.join(current_lines)))
                    current_lines = []
                current_type = 'list_item'
                current_lines.append(re.sub(r'^([\-\*]|\d{1,2}\.)\s+', '', line_str))
            else:
                if current_type is None:
                    current_type = 'p'
                cleaned = re.sub(r'^[\-\*\s]{2,4}', '', line_str) if current_type in ('list_item', 'td') else line_str
                current_lines.append(cleaned)
        if current_lines:
            units.append((current_type, ' '.join(current_lines)))
    return units


def split_by_headings(units):
    sections = [[]]
    for t, txt in units:
        if t == 'heading':
            sections.append([(t, txt)])
        else:
            sections[-1].append((t, txt))
    return sections


def align_units(uf, ut):
    """Aligne les unités FR et EN/ES section par section et par type d'unité."""
    pairs = []
    sf = split_by_headings(uf)
    st = split_by_headings(ut)
    if len(sf) == len(st):
        for sec_f, sec_t in zip(sf, st):
            by_type_f = {}
            by_type_t = {}
            for t, txt in sec_f:
                by_type_f.setdefault(t, []).append(txt)
            for t, txt in sec_t:
                by_type_t.setdefault(t, []).append(txt)
            for t in by_type_f:
                lf = by_type_f[t]
                lt = by_type_t.get(t, [])
                for f_txt, t_txt in zip(lf, lt):
                    pairs.append((t, f_txt, t_txt))
    else:
        by_type_f = {}
        by_type_t = {}
        for t, txt in uf:
            by_type_f.setdefault(t, []).append(txt)
        for t, txt in ut:
            by_type_t.setdefault(t, []).append(txt)
        for t in by_type_f:
            lf = by_type_f[t]
            lt = by_type_t.get(t, [])
            for f_txt, t_txt in zip(lf, lt):
                pairs.append((t, f_txt, t_txt))
    return pairs


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
        elif (line.startswith('DESCRIPTION') or line.startswith('DESCRIPCIÓN')) and ':' in line:
            desc = line.split(':', 1)[1].strip()
    return title, desc


MONTHS_MAP = {
    'en': {
        'janvier': 'January', 'février': 'February', 'mars': 'March', 'avril': 'April',
        'mai': 'May', 'juin': 'June', 'juillet': 'July', 'août': 'August',
        'septembre': 'September', 'octobre': 'October', 'novembre': 'November', 'décembre': 'December',
        'janv.': 'Jan.', 'févr.': 'Feb.', 'avr.': 'Apr.', 'juill.': 'Jul.',
        'sept.': 'Sept.', 'oct.': 'Oct.', 'nov.': 'Nov.', 'déc.': 'Dec.'
    },
    'es': {
        'janvier': 'enero', 'février': 'febrero', 'mars': 'marzo', 'avril': 'abril',
        'mai': 'mayo', 'juin': 'junio', 'juillet': 'julio', 'août': 'agosto',
        'septembre': 'septiembre', 'octobre': 'octubre', 'novembre': 'noviembre', 'décembre': 'diciembre',
        'janv.': 'ene.', 'févr.': 'feb.', 'avr.': 'abr.', 'juill.': 'jul.',
        'sept.': 'sept.', 'oct.': 'oct.', 'nov.': 'nov.', 'déc.': 'dic.'
    }
}


def translate_dates_and_bylines(html, lang):
    """Traduit automatiquement les mentions 'Par William Guindon' et dates françaises restantes hors attributs."""
    by_word = 'By' if lang == 'en' else 'Por'
    html = re.sub(r'(\b\d{4}-\d{2}-\d{2}\s*·\s*)Par\s+William Guindon', rf'\1{by_word} William Guindon', html)
    html = re.sub(r'(·\s*)Par\s+William Guindon', rf'\1{by_word} William Guindon', html)
    html = re.sub(r'(>\s*)Par\s+William Guindon(\s*<)', rf'\1{by_word} William Guindon\2', html)

    months = MONTHS_MAP[lang]
    month_pattern = '|'.join(re.escape(m) for m in sorted(months.keys(), key=len, reverse=True))

    # Format: 16 octobre 2026 / 1er mai 2026 / 1ᵉʳ mai 2026
    def repl_full_date(m):
        day = m.group('day')
        day_num = re.sub(r'(er|ᵉʳ)$', '', day)
        mon_fr = m.group('mon').lower()
        year = m.group('year')
        mon_tr = months.get(mon_fr, m.group('mon'))
        if lang == 'en':
            return f'{mon_tr} {day_num}, {year}'
        else:
            return f'{day_num} de {mon_tr} de {year}'

    html = re.sub(
        rf'(?<![a-zA-Z0-9_/=-])\b(?P<day>\d{{1,2}}(?:er|ᵉʳ)?)\s+(?P<mon>{month_pattern})\s+(?P<year>20\d{{2}})\b',
        repl_full_date,
        html,
        flags=re.I
    )

    # Format: Juillet 2026 / Octobre 2026 en début de balise (>Juillet 2026<)
    def repl_month_year(m):
        prefix = m.group(1)
        mon_fr = m.group(2)
        year = m.group(3)
        suffix = m.group(4)
        mon_tr = months.get(mon_fr.lower(), mon_fr)
        if lang == 'en':
            return f'{prefix}{mon_tr.capitalize()} {year}{suffix}'
        else:
            return f'{prefix}{mon_tr.capitalize()} de {year}{suffix}'

    html = re.sub(
        rf'(>\s*)(?P<mon>{month_pattern})\s+(?P<year>20\d{{2}})(\s*<)',
        repl_month_year,
        html,
        flags=re.I
    )
    return html


def build_global_maps(pages):
    """Construit la mémoire de traduction globale (50 fichiers .txt + dictionnaire JSON)."""
    extra_data = {'en': {}, 'es': {}}
    if os.path.exists(EXTRA_JSON_PATH):
        with open(EXTRA_JSON_PATH, 'r', encoding='utf-8') as f:
            extra_data = json.load(f)

    global_exact = {'en': {}, 'es': {}}
    page_data = {'en': {}, 'es': {}}

    for lang in ('en', 'es'):
        # 1. Charger les paires des 50 fichiers .txt
        for p in pages:
            uf = extract_units(os.path.join(SOURCE_TXT_DIR, 'fr', f'{p}.txt'))
            ut = extract_units(os.path.join(SOURCE_TXT_DIR, lang, f'{p}.txt'))
            aligned = align_units(uf, ut)

            local_exact = {}
            local_units = []
            for t, f_txt, t_txt in aligned:
                nf = norm(f_txt)
                nf_s = norm(f_txt, True)
                if len(nf) >= 2:
                    local_exact[nf] = t_txt
                    local_exact[nf_s] = t_txt
                    global_exact[lang].setdefault(nf, t_txt)
                    global_exact[lang].setdefault(nf_s, t_txt)
                    local_units.append((t, nf, nf_s, f_txt, t_txt))
            page_data[lang][p] = (local_exact, local_units)

        # 2. Ajouter COMMON_REPLACEMENTS et EXTRA_JSON dans global_exact (priorité haute)
        merged_dict = dict(COMMON_REPLACEMENTS.get(lang, {}))
        merged_dict.update(extra_data.get(lang, {}))
        outer_tag_re = re.compile(r'^\s*<([a-zA-Z0-9]+)\b[^>]*>([\s\S]*?)</\1>\s*$')
        for fr_k, tr_v in merged_dict.items():
            if NESTED_BLOCK_RE.search(fr_k):
                continue
            m_f = outer_tag_re.match(fr_k)
            m_t = outer_tag_re.match(tr_v)
            if m_f and m_t and m_f.group(1).lower() == m_t.group(1).lower():
                inner_fk = m_f.group(2).strip()
                inner_tv = m_t.group(2).strip()
                if not NESTED_BLOCK_RE.search(inner_fk):
                    nf = norm(inner_fk)
                    nf_s = norm(inner_fk, True)
                    if len(nf) >= 2:
                        global_exact[lang][nf] = inner_tv
                        global_exact[lang][nf_s] = inner_tv
            elif not (fr_k.strip().startswith('<') and fr_k.strip().endswith('>')):
                nf = norm(fr_k)
                nf_s = norm(fr_k, True)
                if len(nf) >= 2:
                    global_exact[lang][nf] = tr_v
                    global_exact[lang][nf_s] = tr_v

    return global_exact, page_data, extra_data


def format_leaf_replacement(tag, attrs, inner, tr_text, is_heading=False):
    """Formate le texte traduit en préservant les sous-balises critiques (sec-num, liens, strong)."""
    if is_heading:
        tr_first = tr_text.splitlines()[0]
        if len(tr_first.split()) > 16 and ':' in tr_first and '<' not in tr_first:
            tr_first = tr_first.split(':', 1)[0].strip()
        formatted_text = tr_first
    else:
        formatted_text = tr_text

    # Si tr_text contient déjà la structure HTML voulue (ex: issu de EXTRA_JSON), l'utiliser directement
    if '<span' in formatted_text or '<a ' in formatted_text or '<strong' in formatted_text:
        return f'<{tag}{attrs}>{formatted_text}</{tag}>'

    # Préserver <span class="sec-num">01</span> dans les titres
    sec_num_match = re.match(r'^\s*(<span\s+class=["\']sec-num["\'][^>]*>[\s\S]*?</span>\s*)', inner)
    if sec_num_match:
        sec_span = sec_num_match.group(1)
        # Retirer un éventuel numéro doublon en début de formatted_text (ex: "1. " ou "01 ")
        clean_heading = re.sub(r'^\d{1,2}[\.\s·\-]+\s*', '', formatted_text)
        return f'<{tag}{attrs}>{sec_span}{clean_heading}</{tag}>'

    # Si l'élément entier était un lien unique (<a ...>texte</a>)
    single_link = re.match(r'^\s*<a\b(?P<a_attrs>[^>]*)>[\s\S]*?</a>\s*$', inner)
    if single_link:
        a_attrs = single_link.group('a_attrs')
        return f'<{tag}{attrs}><a{a_attrs}>{formatted_text}</a></{tag}>'

    # Si l'élément commence par <strong>Question ?</strong><br>Réponse (ex: FAQ apercu.html)
    faq_br_match = re.match(r'^\s*<strong(?P<s_attrs>[^>]*)>(?P<q>[\s\S]*?)</strong>\s*<br\s*/?>\s*(?P<a>[\s\S]*)$', inner, re.I)
    if faq_br_match and '?' in formatted_text:
        q_part, a_part = formatted_text.split('?', 1)
        s_attrs = faq_br_match.group('s_attrs')
        return f'<{tag}{attrs}><strong{s_attrs}>{q_part.strip()}?</strong><br>{a_part.strip()}</{tag}>'

    # Restaurer le préfixe <strong>... :</strong> s'il était présent
    strong_match = re.match(r'^\s*<strong(?P<s_attrs>[^>]*)>([\s\S]*?)</strong>\s*(.*)', inner, re.DOTALL)
    if strong_match and ':' in formatted_text:
        s_attrs = strong_match.group('s_attrs')
        parts = formatted_text.split(':', 1)
        if len(parts[0].split()) <= 12:
            formatted_text = f'<strong{s_attrs}>{parts[0].strip()}:</strong> {parts[1].strip()}'

    # Restaurer les liens existants s'ils étaient présents dans l'original
    links_match = re.findall(r'<a\b[^>]*>[\s\S]*?</a>', inner)
    if links_match and not single_link:
        for l_html in links_match:
            if l_html not in formatted_text:
                href_match = re.search(r'href=["\']([^"\']+)["\']', l_html)
                if href_match:
                    target_href = href_match.group(1)
                    clean_target = target_href.replace('.html', '')
                    formatted_text += f' <a href="{clean_target}">↗</a>'

    # Rétablissement des <strong> pour les entités clés dans les paragraphes
    if tag in ('p', 'li', 'dd', 'blockquote'):
        for ent in KEY_ENTITIES:
            if ent in formatted_text and f'<strong>{ent}</strong>' not in formatted_text:
                formatted_text = formatted_text.replace(ent, f'<strong>{ent}</strong>', 1)

    return f'<{tag}{attrs}>{formatted_text}</{tag}>'


def apply_extra_replacements(html, lang, extra_dict):
    """Applique les remplacements directs de chaînes en protégeant <script> et <style>."""
    # Protéger temporairement les blocs <script> et <style>
    protected_blocks = []

    def save_block(m):
        protected_blocks.append(m.group(0))
        return f'__PROTECTED_BLOCK_{len(protected_blocks) - 1}__'

    html_work = re.sub(r'<(script|style)\b[^>]*>[\s\S]*?</\1>', save_block, html, flags=re.I)

    merged = dict(COMMON_REPLACEMENTS.get(lang, {}))
    merged.update(extra_dict)

    # Trier par longueur décroissante pour remplacer d'abord les phrases complètes
    sorted_items = sorted(merged.items(), key=lambda x: len(x[0]), reverse=True)

    for fr_str, tr_str in sorted_items:
        if not fr_str or fr_str == tr_str:
            continue
        if '<' in fr_str or '>' in fr_str or len(fr_str) >= 20:
            html_work = html_work.replace(fr_str, tr_str)
        else:
            # Pour les chaînes courtes sans balise (< 20 car.), remplacer uniquement entre >...< ou dans aria-label/title
            html_work = re.sub(
                rf'(>\s*){re.escape(fr_str)}(\s*<)',
                lambda m: f'{m.group(1)}{tr_str}{m.group(2)}',
                html_work
            )
            html_work = re.sub(
                rf'((?:aria-label|title|placeholder|alt|data-tooltip)=["\']){re.escape(fr_str)}(["\'])',
                lambda m: f'{m.group(1)}{tr_str}{m.group(2)}',
                html_work
            )

    # Restaurer les blocs <script> et <style>
    for idx, blk in enumerate(protected_blocks):
        html_work = html_work.replace(f'__PROTECTED_BLOCK_{idx}__', blk)

    return html_work


def normalize_links_and_assets(html, lang, clean_slug):
    """Normalise la langue, les URLs d'assets, le sélecteur de langue et les liens internes."""
    lang_attr = 'en' if lang == 'en' else 'es'
    locale_meta = 'en_CA' if lang == 'en' else 'es_MX'

    def _sub_html_tag(m):
        attrs = m.group(1).replace('\\"', '"').replace("\\'", "'")
        if re.search(r'\blang=["\'][^"\']*["\']', attrs):
            attrs = re.sub(r'\blang=["\'][^"\']*["\']', f'lang="{lang_attr}"', attrs)
        else:
            attrs = f'lang="{lang_attr}" ' + attrs.strip()
        return f'<html {attrs.strip()}>'

    html = re.sub(r'<html\b([^>]*)>', _sub_html_tag, html, count=1)
    html = re.sub(
        r'<meta\s+property=["\']og:locale["\']\s+content=["\'][^"\']*["\']',
        f'<meta property="og:locale" content="{locale_meta}"',
        html
    )

    # Canonical
    base_url = f'https://williamguindon.me/{lang}/' if clean_slug == '' else f'https://williamguindon.me/{lang}/{clean_slug}'
    html = re.sub(r'<link rel=["\']canonical["\'] href=["\'][^"\']*["\']', f'<link rel="canonical" href="{base_url}"', html)

    # Chemins d'assets vers la racine (/assets/, /style.css, url('/assets/...'), etc.)
    html = re.sub(r'(src|href)=(["\'])style\.css(\2|\?)', r'\1=\2/style.css\3', html)
    html = re.sub(r'(src|href)=(["\'])theme\.js(\2|\?)', r'\1=\2/theme.js\3', html)
    html = re.sub(r'(src|href)=(["\'])sw\.js(\2|\?)', r'\1=\2/sw.js\3', html)
    html = re.sub(r'(src|href|srcset|poster|data-src|data-original)=(["\'])assets/', r'\1=\2/assets/', html)
    html = re.sub(r'(src|href|srcset|poster|data-src|data-original)=(["\'])\.\./assets/', r'\1=\2/assets/', html)
    html = re.sub(r'(src|href|srcset|poster|data-src)=(["\'])data/', r'\1=\2/data/', html)
    html = re.sub(r'(src|href|srcset|poster|data-src)=(["\'])\.\./data/', r'\1=\2/data/', html)
    html = re.sub(r'url\((["\']?)(?:\.\./)?assets/', r'url(\1/assets/', html)
    html = re.sub(r'fetch\((["\'])data/', r'fetch(\1/data/', html)
    html = re.sub(r'fetch\((["\'])assets/', r'fetch(\1/assets/', html)

    for asset in ROOT_ASSETS:
        html = re.sub(rf'(src|href|srcset)=(["\']){re.escape(asset)}(\2|\?)', rf'\1=\2/{asset}\3', html)
        html = re.sub(rf'(src|href|srcset)=(["\'])\.\./{re.escape(asset)}(\2|\?)', rf'\1=\2/{asset}\3', html)

    # Sélecteur de langue natif propre
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

    # Routage des liens internes
    html = localize_all_links(html, lang)

    return html


def generate_blog_cards_html(lang):
    import json
    blog_json_path = os.path.join(WORKSPACE_DIR, 'data', 'blog.json')
    if not os.path.exists(blog_json_path):
        return ''
    with open(blog_json_path, 'r', encoding='utf-8') as f:
        posts = json.load(f)

    posts.sort(key=lambda p: p.get('date', ''), reverse=True)
    cards = []
    by_txt = 'By' if lang == 'en' else ('Por' if lang == 'es' else 'Par')
    read_txt = 'Read article ↗' if lang == 'en' else ('Leer artículo ↗' if lang == 'es' else "Lire l'article ↗")
    copy_aria = 'Copy link to this article' if lang == 'en' else ('Copiar enlace a este artículo' if lang == 'es' else 'Copier le lien direct de cet article')
    copy_txt = 'Copy link' if lang == 'en' else ('Copiar enlace' if lang == 'es' else 'Copier le lien')

    for p in posts:
        slug = p.get('slug') or p.get('id', '')
        title = p.get(f'title_{lang}') or p.get('title', '')
        summary = p.get(f'summary_{lang}') or p.get('summary', '')
        cat = p.get(f'category_{lang}') or p.get('category', '')
        cover = p.get('coverImage', '/assets/media/grande-tourbiere-couverture.webp')
        if not cover.startswith('/') and not cover.startswith('http'):
            cover = '/' + cover

        tags = p.get('tags', [])
        tags_html = ''.join(f'<span class="blog-tag">#{t}</span>' for t in tags)

        card = f'''    <article class="blog-card">
      <div class="blog-card-img-wrap" style="position:relative;">
        <img src="{cover}" alt="{title.replace('"', '&quot;')}" class="blog-card-img" loading="lazy" decoding="async" width="380" height="215" onerror="this.onerror=null; this.src='/assets/media/grande-tourbiere-couverture.webp';">
        <span class="blog-card-category">{cat}</span>
      </div>
      <div class="blog-card-body">
        <time class="blog-card-date">{p.get("date", "")} · {by_txt} {p.get("author", "William Guindon")}</time>
        <h2 class="blog-card-title"><a href="#{slug}" class="blog-card-title-link">{title}</a></h2>
        <p class="blog-card-summary">{summary}</p>
        <div class="blog-card-tags">{tags_html}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--line, rgba(255,255,255,0.08));">
          <a href="#{slug}" class="blog-card-read-more" style="font-size:12.5px;font-weight:700;color:var(--accent);text-decoration:none;">{read_txt}</a>
          <button type="button" class="btn-copy-card-link" aria-label="{copy_aria}" title="{copy_aria}">
            <svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>{copy_txt}</span>
          </button>
        </div>
      </div>
    </article>'''
        cards.append(card)

    return '\n\n'.join(cards)


def build_page(page_name, lang, global_exact, page_data, extra_data):
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

    tr_txt = os.path.join(SOURCE_TXT_DIR, lang, f'{page_name}.txt')
    t_tr, d_tr = get_meta_info(tr_txt)

    def escape_attr(val):
        return val.replace('"', '&quot;')

    # 1. Title et Meta Description
    if t_tr:
        clean_t = escape_attr(t_tr)
        html = re.sub(r'<title>[\s\S]*?</title>', f'<title>{clean_t}</title>', html, count=1)
        html = re.sub(r'<meta\s+property=["\']og:title["\']\s+content="[^"]*"', f'<meta property="og:title" content="{clean_t}"', html)
        html = re.sub(r'<meta\s+name=["\']twitter:title["\']\s+content="[^"]*"', f'<meta name="twitter:title" content="{clean_t}"', html)

    if d_tr:
        clean_d = escape_attr(d_tr)
        html = re.sub(r'<meta\s+name=["\']description["\']\s+content="[^"]*"', f'<meta name="description" content="{clean_d}"', html)
        html = re.sub(r'<meta\s+property=["\']og:description["\']\s+content="[^"]*"', f'<meta property="og:description" content="{clean_d}"', html)
        html = re.sub(r'<meta\s+name=["\']twitter:description["\']\s+content="[^"]*"', f'<meta name="twitter:description" content="{clean_d}"', html)

    # 2. Normalisation des liens, assets et sélecteur de langue
    html = normalize_links_and_assets(html, lang, clean_slug)

    # 3. Remplacement balise par balise sur tous les conteneurs terminaux (leaf containers)
    local_exact, local_units = page_data[lang].get(page_name, ({}, []))
    g_exact = global_exact[lang]

    leaf_tags = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'summary', 'figcaption', 'dt', 'dd',
        'th', 'td', 'caption', 'li', 'blockquote',
        'div', 'span', 'a', 'button', 'label'
    ]

    for tag in leaf_tags:
        is_heading = tag.startswith('h')
        pat = re.compile(rf'<({tag})\b([^>]*)>([\s\S]*?)</\1>', re.I)

        def repl_leaf(m):
            t_name = m.group(1)
            attrs = m.group(2)
            inner = m.group(3)

            if 'notranslate' in attrs or 'lang-tag' in attrs or 'lang-name' in attrs or 'current-lang-code' in attrs:
                return m.group(0)
            if NESTED_BLOCK_RE.search(inner) or 'class="year"' in inner:
                return m.group(0)

            ni = norm(inner)
            ni_s = norm(inner, True)
            if len(ni) < 2:
                return m.group(0)

            tr_match = None
            # Priorité 1 : correspondance exacte normalisée sur la page courante (.txt)
            if ni in local_exact:
                tr_match = local_exact[ni]
            elif ni_s in local_exact and len(ni_s) >= 3:
                tr_match = local_exact[ni_s]
            # Priorité 2 : correspondance exacte normalisée dans le corpus global (.txt + JSON)
            elif ni in g_exact:
                tr_match = g_exact[ni]
            elif ni_s in g_exact and len(ni_s) >= 3:
                tr_match = g_exact[ni_s]
            # Priorité 3 : correspondance par préfixe/suffixe long (≥ 30 car.) et ratio de longueur strict
            else:
                for u_type, nf, nf_s, f_txt, t_txt in local_units:
                    if is_heading and u_type != 'heading':
                        continue
                    if not is_heading and u_type == 'heading':
                        continue
                    if len(nf) >= 30 and len(ni) >= 30:
                        ratio = len(ni) / len(nf)
                        if 0.68 <= ratio <= 1.42 and (
                            ni[:32] == nf[:32] or ni_s[:32] == nf_s[:32] or ni[-32:] == nf[-32:]
                        ):
                            tr_match = t_txt
                            break

            if tr_match:
                return format_leaf_replacement(t_name, attrs, inner, tr_match, is_heading=is_heading)
            return m.group(0)

        html = pat.sub(repl_leaf, html)

    # 4. Application des remplacements directs de chaînes (navigation, tiroir de notifications, lignes complexes, attributs)
    html = apply_extra_replacements(html, lang, extra_data.get(lang, {}))

    # 5. Remplacements des signatures dans les chartes et politiques
    sig_text = 'Original signed' if lang == 'en' else 'Original firmado'
    html = re.sub(r'<span class="signature-caption">[\s\S]*?</span>', f'<span class="signature-caption">{sig_text}</span>', html)
    html = re.sub(
        r'Signé électroniquement par\s*<strong>William Guindon</strong>',
        f'<strong>{sig_text}</strong> (William Guindon)',
        html
    )
    html = re.sub(
        r'Signé par\s*<strong>William Guindon</strong>',
        f'<strong>{sig_text}</strong> (William Guindon)',
        html
    )

    # 6. Traduction automatique des dates et mentions 'Par William Guindon' restantes
    html = translate_dates_and_bylines(html, lang)

    # 6b. Pour blog.html, injection des fiches pré-traduites et normalisées
    if page_name == 'blog':
        cards_html = generate_blog_cards_html(lang)
        if cards_html:
            html = re.sub(
                r'<div class="blog-grid" id="blog-posts-grid">[\s\S]*?</div>\s*<div class="empty-state blog-empty-state"',
                f'<div class="blog-grid" id="blog-posts-grid">\n{cards_html}\n  </div>\n\n  <div class="empty-state blog-empty-state"',
                html,
                count=1
            )

    # 6c. Ré-application globale de la localisation stricte des liens
    html = localize_all_links(html, lang)

    # 7. Écriture du fichier HTML de sortie
    out_dir = os.path.join(WORKSPACE_DIR, lang)
    os.makedirs(out_dir, exist_ok=True)
    out_html_path = os.path.join(out_dir, out_html_rel)

    with open(out_html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    return True


def post_process_standalone_page(rel_path, lang, clean_slug, extra_data):
    """Met à jour l'en-tête, les notifications, les liens et le pied de page des pages traduites autonomes (ex: politique-traduction.html)."""
    full_path = os.path.join(WORKSPACE_DIR, lang, rel_path)
    if not os.path.exists(full_path):
        return False
    with open(full_path, 'r', encoding='utf-8') as f:
        html = f.read()
    html = normalize_links_and_assets(html, lang, clean_slug)
    html = apply_extra_replacements(html, lang, extra_data.get(lang, {}))
    html = translate_dates_and_bylines(html, lang)
    html = localize_all_links(html, lang)
    with open(full_path, 'w', encoding='utf-8') as f:
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

    print(f"🚀 Construction de la mémoire de traduction globale pour {len(pages)} pages...")
    global_exact, page_data, extra_data = build_global_maps(pages)
    print(f"   → Unités exactes EN : {len(global_exact['en'])} | ES : {len(global_exact['es'])}")

    success_en = 0
    success_es = 0

    for page in pages:
        if build_page(page, 'en', global_exact, page_data, extra_data):
            success_en += 1
        if build_page(page, 'es', global_exact, page_data, extra_data):
            success_es += 1

    # Post-traitement de politique-traduction.html dans /en/ et /es/
    if post_process_standalone_page('politique-traduction.html', 'en', 'politique-traduction', extra_data):
        success_en += 1
    if post_process_standalone_page('politique-traduction.html', 'es', 'politique-traduction', extra_data):
        success_es += 1

    print(f"✔ Génération EN : {success_en} pages HTML créées dans /en/")
    print(f"✔ Génération ES : {success_es} pages HTML créées dans /es/")
    print("🎉 Compilation globale multilingue terminée avec succès !")


if __name__ == '__main__':
    main()
