"use client";

import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import DocumentCard from "@/components/DocumentCard";
import UploadModal from "@/components/UploadModal";
import { Document } from "@/lib/types";

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/documents${params}`);
    const data = await res.json();
    setDocuments(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    fetchDocuments();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            Nanaji&apos;s Library
          </h1>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Upload
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              {search
                ? "No documents match your search."
                : "No documents yet. Upload your first document!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={fetchDocuments}
      />
    </div>
  );
}
