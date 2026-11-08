import json
import os
import re

workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
blog_path = os.path.join(workspace_dir, 'data', 'blog.json')
photos_path = os.path.join(workspace_dir, 'data', 'photos.json')
src_txt = '/Users/williamguindon/Library/Mobile Documents/com~apple~CloudDocs/Téléchargements/workspace-01a1b612-322f-75df-a0d9-1ed4c72a6a68/williamguindon-me-txt'

def parse_txt_sections(lang):
    with open(os.path.join(src_txt, lang, 'blog.txt'), 'r', encoding='utf-8') as f:
        content = f.read()
    parts = content.split('## ')
    sections = []
    for p in parts[1:]:
        lines = p.strip().splitlines()
        title = lines[0].strip()
        body = ' '.join(l.strip() for l in lines[1:] if l.strip())
        sections.append((title, body))
    return sections

en_sec = parse_txt_sections('en')
es_sec = parse_txt_sections('es')

with open(blog_path, 'r', encoding='utf-8') as f:
    posts = json.load(f)

cat_map = {
    "Action Parlementaire & Citoyenne": {"en": "Parliamentary & Citizen Action", "es": "Acción Parlamentaria y Ciudadana"},
    "Enquête Documentaire": {"en": "Documentary Investigation", "es": "Investigación Documental"},
    "Représentation Parlementaire": {"en": "Parliamentary Representation", "es": "Representación Parlamentaria"},
    "Dossier Juridique CCE": {"en": "CEC Legal Dossier", "es": "Expediente Jurídico CCA"},
    "Terrain & Vigie citoyenne": {"en": "Field & Citizen Watch", "es": "Terreno y Vigía Ciudadana"},
    "Recours Fédéraux & Droit": {"en": "Federal Remedies & Law", "es": "Recursos Federales y Derecho"},
    "Vulgarisation & Synthèse": {"en": "Popularization & Summary", "es": "Divulgación y Síntesis"},
    "Histoire, Écologie & Réconciliation": {"en": "History, Ecology & Reconciliation", "es": "Historia, Ecología y Reconciliación"},
    "Dossier CCE & Histoire": {"en": "CEC Dossier & History", "es": "Expediente CCA e Historia"},
    "Déclarations & Indépendance": {"en": "Statements & Independence", "es": "Declaraciones e Independencia"},
    "Juridique": {"en": "Legal", "es": "Jurídico"},
    "Outils & Presse": {"en": "Tools & Press", "es": "Herramientas y Prensa"},
    "Spécial": {"en": "Special", "es": "Especial"},
    "Médias": {"en": "Media", "es": "Medios"},
    "Dossier CCE": {"en": "CEC Dossier", "es": "Expediente CCA"}
}

# Apply parsed titles and summaries from blog.txt
for i, p in enumerate(posts):
    # Normalize cover image
    cov = p.get('coverImage', '')
    if cov and not cov.startswith('http') and not cov.startswith('/'):
        p['coverImage'] = '/' + cov

    c = p.get('category', '')
    if c in cat_map:
        p['category_en'] = cat_map[c]['en']
        p['category_es'] = cat_map[c]['es']
    else:
        p['category_en'] = c
        p['category_es'] = c

    if i < len(en_sec):
        p['title_en'] = en_sec[i][0]
        p['summary_en'] = en_sec[i][1]
    if i < len(es_sec):
        p['title_es'] = es_sec[i][0]
        p['summary_es'] = es_sec[i][1]

with open(blog_path, 'w', encoding='utf-8') as f:
    json.dump(posts, f, indent=2, ensure_ascii=False)

print("Updated titles and summaries for all 16 posts.")
