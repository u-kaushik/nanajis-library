import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addDocument } from "@/lib/documents";
import { Document } from "@/lib/types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();

  const doc: Document = {
    id,
    name: file.name.replace(/\.[^.]+$/, ""),
    originalName: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
    tags: [],
  };

  await addDocument(doc, buffer);

  return NextResponse.json(doc, { status: 201 });
}
