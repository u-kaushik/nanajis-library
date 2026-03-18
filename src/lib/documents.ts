import { promises as fs } from "fs";
import path from "path";
import { Document } from "./types";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const METADATA_FILE = path.join(UPLOADS_DIR, "metadata.json");

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readMetadata(): Promise<Document[]> {
  await ensureUploadsDir();
  try {
    const data = await fs.readFile(METADATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeMetadata(docs: Document[]) {
  await ensureUploadsDir();
  await fs.writeFile(METADATA_FILE, JSON.stringify(docs, null, 2));
}

export async function getAllDocuments(): Promise<Document[]> {
  return readMetadata();
}

export async function getDocument(id: string): Promise<Document | undefined> {
  const docs = await readMetadata();
  return docs.find((d) => d.id === id);
}

export async function addDocument(doc: Document, fileBuffer: Buffer) {
  const docs = await readMetadata();
  docs.push(doc);
  await writeMetadata(docs);
  await fs.writeFile(path.join(UPLOADS_DIR, doc.id), fileBuffer);
}

export async function deleteDocument(id: string) {
  const docs = await readMetadata();
  const filtered = docs.filter((d) => d.id !== id);
  await writeMetadata(filtered);
  try {
    await fs.unlink(path.join(UPLOADS_DIR, id));
  } catch {
    // file may already be gone
  }
}

export async function getDocumentFilePath(id: string): Promise<string> {
  return path.join(UPLOADS_DIR, id);
}
