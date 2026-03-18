'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DocumentCard from '@/components/DocumentCard';
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

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-950">
      <header className="bg-amber-900 dark:bg-gray-900 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-amber-300 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">{category}</h1>
            <p className="text-amber-300 text-xs">{collection}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading…</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{docs.length} documents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map(doc => <DocumentCard key={doc.id} document={doc} />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
