'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function DocumentViewerPage() {
  const params = useParams();
  const collection = decodeURIComponent(params.collection as string);
  const category = decodeURIComponent(params.category as string);
  const id = params.id as string;
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    // Fetch metadata to get the title
    fetch(`/api/documents?collection=${encodeURIComponent(collection)}&category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then((docs: Array<{ id: string; title: string }>) => {
        const doc = docs.find(d => d.id === id);
        if (doc) setTitle(doc.title);
      });
    // The signed URL comes from the [id] route via redirect
    setFileUrl(`/api/documents/${id}`);
  }, [id, collection, category]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
      <header className="bg-amber-900 dark:bg-gray-900 text-white shadow px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link
          href={`/library/${encodeURIComponent(collection)}/${encodeURIComponent(category)}`}
          className="text-amber-300 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-medium text-sm flex-1 truncate">{title || 'Loading…'}</h1>
        <a
          href={fileUrl}
          download
          className="text-xs px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 transition-colors"
        >
          Download
        </a>
      </header>

      <div className="flex-1 overflow-hidden">
        {fileUrl && (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={title}
          />
        )}
      </div>
    </div>
  );
}
