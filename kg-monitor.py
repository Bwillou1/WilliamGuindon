"""Radar Knowledge Graph — vérifie si l'entité « William Guindon » existe dans le Google Knowledge Graph.

Usage :
  1. Obtenir une clé API (gratuite) : https://console.cloud.google.com/apis/credentials
     -> Créer un projet -> Activer « Knowledge Graph Search API » -> Créer une clé API
  2. Lancer :  python3 kg-monitor.py VOTRE_CLE_API
"""

import json
import sys
import urllib.parse
import urllib.request
from datetime import date

QUERIES = [
    "William Guindon",
    "William Guindon Blainville",
    "William Guindon militant",
    "Grande Tourbière de Blainville",
    "SEM-26-003",
]

SERVICE_URL = "https://kgsearch.googleapis.com/v1/entities:search"


def search(query: str, api_key: str, languages: str = "fr,en") -> list:
    params = urllib.parse.urlencode({
        "query": query,
        "key": api_key,
        "limit": 5,
        "languages": languages,
    })
    with urllib.request.urlopen(f"{SERVICE_URL}?{params}", timeout=15) as resp:
        data = json.loads(resp.read().decode())
    return data.get("itemListElement", [])


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    api_key = sys.argv[1]

    print(f"=== Radar Knowledge Graph — {date.today()} ===\n")
    entity_found = False

    for q in QUERIES:
        print(f"Requête : « {q} »")
        try:
            results = search(q, api_key)
        except Exception as exc:
            print(f"  Erreur : {exc}\n")
            continue

        if not results:
            print("  -> Aucune entité (pas encore dans le Knowledge Graph)\n")
            continue

        for item in results:
            r = item.get("result", {})
            name = r.get("name", "?")
            kg_id = r.get("@id", "?")
            desc = r.get("description", "")
            score = item.get("resultScore", 0)
            print(f"  -> {name} [{kg_id}] {desc} (score: {score:.0f})")
            if "guindon" in name.lower():
                entity_found = True
        print()

    print("=" * 50)
    if entity_found:
        print("🎯 ENTITÉ « GUINDON » DÉTECTÉE DANS LE KNOWLEDGE GRAPH !")
        print("Le Knowledge Panel (le cube) suit généralement de quelques")
        print("jours à quelques semaines. Continuez les mentions presse.")
    else:
        print("⏳ Pas encore d'entité. C'est normal au début : le Knowledge")
        print("Graph se met à jour par cycles lents (semaines/mois).")
        print("Relancez ce script une fois par semaine.")
        print("Accélérateurs : nouvelles mentions presse, profils liés,")
        print("page indexée dans Search Console.")


if __name__ == "__main__":
    main()
