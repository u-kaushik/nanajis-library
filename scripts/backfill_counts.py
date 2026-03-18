# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

"""
Backfill page_count and word_count for all documents by reading local PDFs with PyMuPDF.

Usage:
  python scripts/backfill_counts.py

Reads PDFs from the local converted/ folder. Idempotent — skips docs already filled.
"""

import psycopg2
import fitz  # PyMuPDF
from pathlib import Path
from dotenv import dotenv_values

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
env = dotenv_values(PROJECT_ROOT / ".env.local")

PDF_ROOT = Path(r"C:\Users\ukaus\OneDrive\Documents\2. AREAS\Love\Nanaji's documents\converted")

conn = psycopg2.connect(env["DATABASE_URL_UNPOOLED"])
conn.autocommit = False
cur = conn.cursor()

# Fetch docs missing page_count
cur.execute("""
    SELECT id, storage_path FROM documents
    WHERE page_count IS NULL
    ORDER BY collection, category, title
""")
rows = cur.fetchall()
print(f"Found {len(rows)} documents needing counts.")

updated = 0
errors = 0

for i, (doc_id, storage_path) in enumerate(rows, 1):
    # storage_path is like "Books Pre 01/ABHINAV  ZIP/ABHYAS.pdf"
    local_path = PDF_ROOT / storage_path

    if not local_path.exists():
        # Try without leading collection prefix ambiguity
        print(f"  [{i}] NOT FOUND: {storage_path}")
        errors += 1
        continue

    try:
        doc = fitz.open(str(local_path))
        pages = doc.page_count
        words = sum(len(page.get_text().split()) for page in doc)
        doc.close()

        cur.execute(
            "UPDATE documents SET page_count = %s, word_count = %s WHERE id = %s",
            (pages, words, doc_id)
        )
        updated += 1

        if i % 50 == 0:
            conn.commit()
            print(f"  Progress: {i}/{len(rows)} done ({updated} updated, {errors} errors)")

    except Exception as e:
        print(f"  [{i}] ERROR {storage_path}: {e}")
        errors += 1

conn.commit()
print(f"\n=== Done ===")
print(f"  Updated: {updated}")
print(f"  Errors:  {errors}")

cur.close()
conn.close()
