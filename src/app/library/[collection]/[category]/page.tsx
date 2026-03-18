'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Document } from '@/lib/types';

export default function CategoryPage() {
  const params = useParams();
  const collection = decodeURIComponent(params.collection as string);
  const category = decodeURIComponent(params.category as string);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents?collection=${encodeURIComponent(collection)}&category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(data => { setDocs(data); setLoading(false); });
  }, [collection, category]);

  function formatSize(bytes: number) {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-amber-900 dark:bg-gray-900 text-white sticky top-0 z-10 shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-amber-300 hover:text-white transition-colors p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-bold text-base leading-tight">
            {docs[0]?.display_category ?? category}
          </h1>
            <p className="text-amber-300 text-xs">{collection}</p>
          </div>
          {!loading && (
            <span className="ml-auto text-amber-300 text-xs">{docs.length} documents</span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-amber-100 dark:divide-gray-800">
            {docs.map((doc, i) => (
              <Link
                key={doc.id}
                href={`/library/${encodeURIComponent(collection)}/${encodeURIComponent(category)}/${doc.id}`}
                className="flex items-center gap-3 py-3 group hover:bg-amber-100/50 dark:hover:bg-gray-900 -mx-2 px-2 rounded-lg transition-colors"
              >
                <span className="text-xs text-gray-300 dark:text-gray-600 w-6 text-right flex-shrink-0 font-mono">{i + 1}</span>
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 dark:text-red-400 text-xs font-bold">PDF</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 leading-snug line-clamp-2">
                    {doc.display_title ?? doc.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {doc.file_size_bytes > 0 && (
                      <span className="text-xs text-gray-400">{formatSize(doc.file_size_bytes)}</span>
                    )}
                    {doc.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-amber-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
