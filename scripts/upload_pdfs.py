"""
Upload all converted PDFs to Cloudflare R2 and register them in the Neon database.

Usage:
  python scripts/upload_pdfs.py

Reads credentials from .env.local in the project root.
Skips files already in the database (idempotent — safe to re-run).
"""

import os
import sys
import boto3
import psycopg2
from pathlib import Path
from dotenv import dotenv_values

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ENV_FILE = PROJECT_ROOT / ".env.local"
CONVERTED_DIR = Path(r"C:\Users\ukaus\OneDrive\Documents\2. AREAS\Love\Nanaji's documents\converted")

env = dotenv_values(ENV_FILE)

R2_ACCOUNT_ID      = env["R2_ACCOUNT_ID"]
R2_ACCESS_KEY_ID   = env["R2_ACCESS_KEY_ID"]
R2_SECRET_ACCESS_KEY = env["R2_SECRET_ACCESS_KEY"]
R2_BUCKET          = env["R2_BUCKET_NAME"]
DATABASE_URL       = env["DATABASE_URL_UNPOOLED"]  # use direct (non-pooled) for scripts

# ── Clients ───────────────────────────────────────────────────────────────────

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
)

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = False
cur = conn.cursor()

# ── Helpers ───────────────────────────────────────────────────────────────────

def already_uploaded(storage_path: str) -> bool:
    cur.execute("SELECT 1 FROM documents WHERE storage_path = %s LIMIT 1", (storage_path,))
    return cur.fetchone() is not None

def upload_and_register(pdf_path: Path, collection: str, category: str):
    storage_path = f"{collection}/{category}/{pdf_path.name}"
    title = pdf_path.stem

    if already_uploaded(storage_path):
        return "skip"

    # Upload to R2
    with open(pdf_path, "rb") as f:
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=storage_path,
            Body=f,
            ContentType="application/pdf",
        )

    # Register in DB
    file_size = pdf_path.stat().st_size
    cur.execute(
        """
        INSERT INTO documents (title, collection, category, storage_path, file_size_bytes)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
        """,
        (title, collection, category, storage_path, file_size),
    )
    conn.commit()
    return "upload"

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not CONVERTED_DIR.exists():
        print(f"ERROR: Converted directory not found: {CONVERTED_DIR}")
        sys.exit(1)

    # Collect all PDFs
    all_pdfs = []
    for collection_dir in sorted(CONVERTED_DIR.iterdir()):
        if not collection_dir.is_dir():
            continue
        collection = collection_dir.name
        for item in sorted(collection_dir.rglob("*.pdf")):
            # category = immediate parent folder relative to collection
            try:
                rel = item.relative_to(collection_dir)
                category = rel.parts[0] if len(rel.parts) > 1 else collection
            except ValueError:
                category = collection
            all_pdfs.append((item, collection, category))

    total = len(all_pdfs)
    print(f"Found {total} PDFs to process\n")

    uploaded = skipped = errors = 0

    for i, (pdf_path, collection, category) in enumerate(all_pdfs, 1):
        try:
            result = upload_and_register(pdf_path, collection, category)
            if result == "upload":
                uploaded += 1
                print(f"[{i}/{total}] ✓ {collection}/{category}/{pdf_path.name}")
            else:
                skipped += 1
                if skipped <= 5 or i % 100 == 0:
                    print(f"[{i}/{total}] — skip {pdf_path.name}")
        except Exception as e:
            errors += 1
            conn.rollback()
            print(f"[{i}/{total}] ✗ ERROR {pdf_path.name}: {e}")

        # Progress summary every 50 uploads
        if i % 50 == 0:
            print(f"\n  Progress: {uploaded} uploaded, {skipped} skipped, {errors} errors\n")

    print(f"\n{'='*50}")
    print(f"Done! {uploaded} uploaded, {skipped} already done, {errors} errors")
    print(f"Total in DB: ", end="")
    cur.execute("SELECT COUNT(*) FROM documents")
    print(cur.fetchone()[0])

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
