'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), { ssr: false });

interface DocMeta {
  id: string;
  title: string;
  display_title?: string | null;
  collection: string;
  category: string;
  display_category?: string | null;
  file_size_bytes: number;
  tags: string[];
  language: string;
  page_count?: number | null;
  word_count?: number | null;
}

export default function DocumentViewerPage() {
  const params = useParams();
  const collection = decodeURIComponent(params.collection as string);
  const category = decodeURIComponent(params.category as string);
  const id = params.id as string;
  const [doc, setDoc] = useState<DocMeta | null>(null);
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    fetch(`/api/documents?collection=${encodeURIComponent(collection)}&category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then((docs: DocMeta[]) => {
        const found = docs.find(d => d.id === id);
        if (found) setDoc(found);
      });
    setFileUrl(`/api/documents/${id}`);
  }, [id, collection, category]);

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Reading progress bar (mounted via PdfViewer) */}
      <div id="reading-progress" style={{ width: 0 }} className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-amber-800 to-amber-500 z-50 transition-[width] duration-100" />

      {/* Header */}
      <header className="bg-amber-900 dark:bg-gray-900 text-white shadow px-4 py-3 flex items-center gap-3 flex-shrink-0 z-10">
        <Link
          href={`/library/${encodeURIComponent(collection)}/${encodeURIComponent(category)}`}
          className="text-amber-300 hover:text-white transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm leading-tight truncate">
            {doc ? (doc.display_title ?? doc.title) : '…'}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-amber-300 text-xs">
              {doc?.display_category ?? category}
              {doc?.page_count && ` · ${doc.page_count} pp`}
              {doc && !doc.page_count && ` · ${formatSize(doc.file_size_bytes)}`}
            </span>
            {doc?.language && doc.language !== 'en' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-700 text-amber-100">
                {doc.language === 'hi' ? 'Hindi' : doc.language}
              </span>
            )}
          </div>
          {doc?.tags && doc.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {doc.tags.slice(0, 4).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-800 text-amber-200">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {fileUrl && (
          <a
            href={fileUrl}
            download={doc?.title}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 transition-colors"
          >
            Download
          </a>
        )}
      </header>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        {fileUrl ? (
          <PdfViewer url={fileUrl} title={doc?.title || ''} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
