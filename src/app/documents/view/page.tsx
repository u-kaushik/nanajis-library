"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Document } from "@/lib/types";

function ViewerContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/documents`)
      .then((res) => res.json())
      .then((docs: Document[]) => {
        const found = docs.find((d) => d.id === id);
        if (found) setDoc(found);
        else setError("Document not found");
      })
      .catch(() => setError("Failed to load document"));
  }, [id]);

  if (!id) {
    return <p className="text-center py-12 text-gray-500">No document specified.</p>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to library
        </Link>
      </div>
    );
  }

  if (!doc) {
    return <p className="text-center py-12 text-gray-500">Loading...</p>;
  }

  const isPdf = doc.mimeType === "application/pdf";
  const isImage = doc.mimeType.startsWith("image/");
  const isText = doc.mimeType.startsWith("text/");
  const fileUrl = `/api/documents/${doc.id}`;

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-medium text-foreground truncate flex-1">
          {doc.originalName}
        </h1>
        <a
          href={fileUrl}
          download={doc.originalName}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-foreground hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Download
        </a>
      </header>

      <div className="flex-1 bg-gray-100 dark:bg-gray-900">
        {isPdf ? (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={doc.originalName}
          />
        ) : isImage ? (
          <div className="flex items-center justify-center h-full p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={doc.originalName}
              className="max-w-full max-h-full object-contain rounded shadow-lg"
            />
          </div>
        ) : isText ? (
          <TextViewer url={fileUrl} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-gray-500">
              Preview not available for this file type.
            </p>
            <a
              href={fileUrl}
              download={doc.originalName}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function TextViewer({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then(setText)
      .catch(() => setText("Failed to load file content."));
  }, [url]);

  return (
    <div className="h-full overflow-auto p-6">
      <pre className="bg-white dark:bg-gray-800 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap max-w-4xl mx-auto shadow">
        {text ?? "Loading..."}
      </pre>
    </div>
  );
}

export default function ViewPage() {
  return (
    <Suspense fallback={<p className="text-center py-12 text-gray-500">Loading...</p>}>
      <ViewerContent />
    </Suspense>
  );
}
