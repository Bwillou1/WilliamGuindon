#!/usr/bin/env python3
"""
Script de synchronisation satellite Copernicus Sentinel-2 L2A pour le secteur de Blainville
Télécharge la capture sans nuages la plus récente avec masque de transparence (dataMask).
"""

import datetime
import json
import os
import sys

try:
    import requests
except ImportError:
    print("Erreur: Le module 'requests' est requis. Installez-le avec 'pip install requests'.")
    sys.exit(1)

CLIENT_ID = os.environ.get("CDSE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("CDSE_CLIENT_SECRET")

if not CLIENT_ID or not CLIENT_SECRET:
    print("Avertissement: Les secrets CDSE_CLIENT_ID et/ou CDSE_CLIENT_SECRET ne sont pas définis.")
    print("Veuillez configurer ces variables d'environnement dans GitHub Settings > Secrets.")
    if not os.path.exists("meta.json"):
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        with open("meta.json", "w", encoding="utf-8") as f:
            json.dump({
                "updated_at": now_utc.strftime("%Y-%m-%d %H:%M UTC"),
                "status": "pending_credentials",
                "source": "Copernicus Sentinel-2 L2A"
            }, f, indent=2)
    sys.exit(0)

# 1. Authentification OAuth2 Copernicus Data Space Ecosystem
try:
    token_resp = requests.post(
        "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
        data={
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        timeout=30
    )
    token_resp.raise_for_status()
    token = token_resp.json().get("access_token")
    if not token:
        raise ValueError("Aucun jeton d'accès retourné par le service d'authentification.")
except Exception as e:
    print(f"Erreur d'authentification Copernicus: {e}")
    sys.exit(1)

# 2. Polygone exact de la Grande Tourbière de Blainville (Coordonnées [lon, lat])
polygon_coords = [
    [-73.88134, 45.692871],
    [-73.852844, 45.670084],
    [-73.833103, 45.684357],
    [-73.8297012, 45.6937939],
    [-73.8203067, 45.6924814],
    [-73.8115699, 45.6964419],
    [-73.8163711, 45.7018587],
    [-73.8181253, 45.7094027],
    [-73.825378, 45.709895],
    [-73.851814, 45.712173],
    [-73.853359, 45.702583],
    [-73.88134, 45.692871],
]

now = datetime.datetime.now(datetime.timezone.utc)
start = now - datetime.timedelta(days=30)

evalscript = """
//VERSION=3
function setup() {
  return {
    input: ["B04", "B03", "B02", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(sample) {
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02, sample.dataMask];
}
"""

payload = {
    "input": {
        "bounds": {
            "geometry": {"type": "Polygon", "coordinates": [polygon_coords]},
            "properties": {
                "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
            },
        },
        "data": [{
            "type": "sentinel-2-l2a",
            "dataFilter": {
                "timeRange": {
                    "from": start.strftime("%Y-%m-%dT00:00:00Z"),
                    "to": now.strftime("%Y-%m-%dT23:59:59Z"),
                },
                "mosaickingOrder": "mostRecent",
                "maxCloudCoverage": 25,
            },
        }],
    },
    "output": {
        "width": 1200,
        "height": 1000,
        "responses": [
            {"identifier": "default", "format": {"type": "image/png"}}
        ],
    },
    "evalscript": evalscript,
}

# 3. Récupération de l'image satellite traitée
try:
    res = requests.post(
        "https://sh.dataspace.copernicus.eu/api/v1/process",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "image/png",
            "Content-Type": "application/json",
        },
        timeout=60
    )

    if res.status_code == 200 and res.content:
        tmp_img = "blainville_latest.png.tmp"
        with open(tmp_img, "wb") as f:
            f.write(res.content)
        os.replace(tmp_img, "blainville_latest.png")

        tmp_meta = "meta.json.tmp"
        with open(tmp_meta, "w", encoding="utf-8") as f:
            json.dump({
                "updated_at": now.strftime("%Y-%m-%d %H:%M UTC"),
                "status": "success",
                "source": "Copernicus Sentinel-2 L2A",
                "satellite": "Sentinel-2",
                "coverage": "Grande Tourbière de Blainville"
            }, f, indent=2)
        os.replace(tmp_meta, "meta.json")
        print("Image satellite blainville_latest.png et meta.json actualisées avec suppression et remplacement atomique.")
    else:
        print(f"Erreur API Copernicus ({res.status_code}): {res.text}")
        sys.exit(1)
except Exception as e:
    print(f"Erreur lors du traitement satellite: {e}")
    sys.exit(1)
