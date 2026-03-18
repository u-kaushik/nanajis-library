import { NextResponse } from "next/server";
import { getAllDocuments, deleteDocument } from "@/lib/documents";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  let docs = await getAllDocuments();

  if (query) {
    docs = docs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.originalName.toLowerCase().includes(query) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return NextResponse.json(docs);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing document id" }, { status: 400 });
  }

  await deleteDocument(id);
  return NextResponse.json({ success: true });
}
