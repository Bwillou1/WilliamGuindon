#!/usr/bin/env bash
set -euo pipefail

# Construit l'index SQLite FTS5 (data/corpus.sqlite) à partir des données JSON du site.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${ROOT_DIR}/data/corpus.sqlite"
TMP_SQL="$(mktemp)"
trap 'rm -f "${TMP_SQL}"' EXIT

python3 - "${ROOT_DIR}" "${TMP_SQL}" <<'PYEOF'
import json, os, sys

root = sys.argv[1]
out_sql = sys.argv[2]

def esc(s):
    return "'" + str(s or "").replace("'", "''") + "'"

rows = []
corpus_path = os.path.join(root, "api/v1/corpus.json")
if os.path.exists(corpus_path):
    with open(corpus_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = data if isinstance(data, list) else data.get("items", data.get("documents", data.get("pages", [])))
    if isinstance(items, list):
        for it in items:
            if isinstance(it, dict):
                rows.append((
                    it.get("url") or it.get("path") or it.get("id") or "",
                    it.get("title") or it.get("title_fr") or it.get("name") or "",
                    it.get("summary") or it.get("description") or it.get("text") or it.get("content") or "",
                    it.get("category") or it.get("type") or "corpus"
                ))

blog_path = os.path.join(root, "data/blog.json")
if os.path.exists(blog_path):
    with open(blog_path, "r", encoding="utf-8") as f:
        bdata = json.load(f)
    posts = bdata if isinstance(bdata, list) else bdata.get("posts", bdata.get("articles", []))
    if isinstance(posts, list):
        for p in posts:
            if isinstance(p, dict):
                rows.append((
                    p.get("url") or f"/blog.html#{p.get('id', '')}",
                    p.get("title_fr") or p.get("title") or "",
                    p.get("excerpt_fr") or p.get("summary_fr") or p.get("content_fr") or "",
                    "blog"
                ))

with open(out_sql, "w", encoding="utf-8") as out:
    out.write("DROP TABLE IF EXISTS documents_fts;\n")
    out.write("CREATE VIRTUAL TABLE documents_fts USING fts5(url, title, body, kind, tokenize='unicode61 remove_diacritics 2');\n")
    for url, title, body, kind in rows:
        out.write(f"INSERT INTO documents_fts(url, title, body, kind) VALUES ({esc(url)}, {esc(title)}, {esc(body)}, {esc(kind)});\n")
    out.write("INSERT INTO documents_fts(documents_fts) VALUES('optimize');\n")
print(f"SQL généré : {len(rows)} documents indexés")
PYEOF

rm -f "${DB_PATH}"
sqlite3 "${DB_PATH}" < "${TMP_SQL}"
ls -lh "${DB_PATH}"
