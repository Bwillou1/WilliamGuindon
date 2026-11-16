#!/usr/bin/env python3
"""
Indexation des pièces PDF officielles (assets/docs/) via Microsoft MarkItDown
dans la base SQLite FTS5 (data/corpus.sqlite) et en fiches Markdown d'indexation.

Ne modifie jamais assets/docs/ (lecture seule stricte).
"""

import json
import os
import sqlite3
import sys
from pathlib import Path

from markitdown import MarkItDown

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "assets" / "docs"
DB_PATH = ROOT / "data" / "corpus.sqlite"
MD_OUT_DIR = ROOT / "data" / "docs-markdown"

DISCLAIMER = (
    "> ⚠️ **Indexation automatique brute (MarkItDown)** — "
    "Seule la pièce PDF officielle originale dans `assets/docs/` fait foi.\n\n"
)


def load_json_rows():
    rows = []
    corpus_path = ROOT / "api" / "v1" / "corpus.json"
    if corpus_path.exists():
        data = json.loads(corpus_path.read_text(encoding="utf-8"))
        items = data if isinstance(data, list) else data.get("items", data.get("documents", data.get("pages", [])))
        if isinstance(items, list):
            for it in items:
                if isinstance(it, dict):
                    rows.append((
                        it.get("url") or it.get("path") or it.get("id") or "",
                        it.get("title") or it.get("title_fr") or it.get("name") or "",
                        it.get("summary") or it.get("description") or it.get("text") or it.get("content") or "",
                        it.get("category") or it.get("type") or "corpus",
                    ))

    blog_path = ROOT / "data" / "blog.json"
    if blog_path.exists():
        bdata = json.loads(blog_path.read_text(encoding="utf-8"))
        posts = bdata if isinstance(bdata, list) else bdata.get("posts", bdata.get("articles", []))
        if isinstance(posts, list):
            for p in posts:
                if isinstance(p, dict):
                    rows.append((
                        p.get("url") or f"/blog.html#{p.get('id', '')}",
                        p.get("title_fr") or p.get("title") or "",
                        p.get("excerpt_fr") or p.get("summary_fr") or p.get("content_fr") or "",
                        "blog",
                    ))
    return rows


def main():
    write_md = "--write-md" in sys.argv
    if write_md:
        MD_OUT_DIR.mkdir(parents=True, exist_ok=True)

    md = MarkItDown()
    rows = load_json_rows()
    pdf_count = 0
    empty_count = 0

    for pdf_path in sorted(DOCS_DIR.rglob("*.pdf")):
        rel = pdf_path.relative_to(ROOT).as_posix()
        url = "/" + rel
        title = pdf_path.stem.replace("_", " ").replace("-", " ")
        try:
            res = md.convert(str(pdf_path))
            text = (res.text_content or "").strip()
        except Exception as exc:
            print(f"[AVERTISSEMENT] Échec conversion {rel}: {exc}", file=sys.stderr)
            text = ""

        if not text:
            empty_count += 1
            continue

        # Tronquer proprement à 60 000 caractères par pièce pour garder corpus.sqlite léger
        indexed_text = text[:60000]
        rows.append((url, title, indexed_text, "pdf"))
        pdf_count += 1

        if write_md:
            safe_name = pdf_path.relative_to(DOCS_DIR).as_posix().replace("/", "__") + ".md"
            (MD_OUT_DIR / safe_name).write_text(
                f"# {title}\n\nSource officielle : `{url}`\n\n{DISCLAIMER}{text}\n",
                encoding="utf-8",
            )

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    try:
        conn.execute(
            "CREATE VIRTUAL TABLE documents_fts USING fts5(url, title, body, kind, tokenize='unicode61 remove_diacritics 2')"
        )
        conn.executemany(
            "INSERT INTO documents_fts(url, title, body, kind) VALUES (?, ?, ?, ?)",
            rows,
        )
        conn.execute("INSERT INTO documents_fts(documents_fts) VALUES('optimize')")
        conn.commit()
    finally:
        conn.close()

    size_kb = DB_PATH.stat().st_size / 1024.0
    print(f"Index SQLite FTS5 généré : {len(rows)} documents ({pdf_count} PDF indexés, {empty_count} PDF vides/scannés ignorés), taille={size_kb:.1f} Ko")


if __name__ == "__main__":
    main()
