'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Document } from '@/lib/types';

type SortKey = 'title' | 'pages' | 'words' | 'size';
type SortDir = 'asc' | 'desc';

function formatSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatWords(n: number | null | undefined) {
  if (!n) return null;
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k words';
  return n + ' words';
}

export default function CategoryPage() {
  const params = useParams();
  const collection = decodeURIComponent(params.collection as string);
  const category = decodeURIComponent(params.category as string);

  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    fetch(`/api/documents?collection=${encodeURIComponent(collection)}&category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(data => { setDocs(data); setLoading(false); });
  }, [collection, category]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'title' ? 'asc' : 'desc');
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter(d => {
      if (!q) return true;
      const haystack = ((d.display_title ?? d.title) + ' ' + (d.tags ?? []).join(' ')).toLowerCase();
      return haystack.includes(q);
    });
  }, [docs, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'title') {
        diff = (a.display_title ?? a.title).localeCompare(b.display_title ?? b.title);
      } else if (sortKey === 'pages') {
        diff = (a.page_count ?? 0) - (b.page_count ?? 0);
      } else if (sortKey === 'words') {
        diff = (a.word_count ?? 0) - (b.word_count ?? 0);
      } else if (sortKey === 'size') {
        diff = (a.file_size_bytes ?? 0) - (b.file_size_bytes ?? 0);
      }
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [filtered, sortKey, sortDir]);

  const displayCategory = docs[0]?.display_category ?? category;

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors ${
        sortKey === k
          ? 'bg-amber-700 text-white'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700 border border-amber-100 dark:border-gray-700'
      }`}
    >
      {label}
      {sortKey === k && (
        <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );

  // Totals for the category
  const totalPages = docs.reduce((s, d) => s + (d.page_count ?? 0), 0);
  const totalWords = docs.reduce((s, d) => s + (d.word_count ?? 0), 0);
  const hasCountData = docs.some(d => d.page_count);

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-amber-900 dark:bg-gray-900 text-white sticky top-0 z-10 shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-amber-300 hover:text-white transition-colors p-1 -ml-1 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base leading-tight truncate">{displayCategory}</h1>
            <p className="text-amber-300 text-xs mt-0.5">
              {docs.length} documents
              {hasCountData && totalPages > 0 && ` · ${totalPages.toLocaleString()} pages`}
              {hasCountData && totalWords > 0 && ` · ${(totalWords / 1000).toFixed(0)}k words`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search in ${displayCategory}…`}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          {/* Sort buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 mr-0.5">Sort:</span>
            <SortBtn k="title" label="A–Z" />
            {hasCountData && <SortBtn k="pages" label="Pages" />}
            {hasCountData && <SortBtn k="words" label="Words" />}
            <SortBtn k="size" label="Size" />
          </div>
        </div>

        {/* Results count when filtering */}
        {search && !loading && (
          <p className="text-xs text-gray-500">
            {sorted.length} of {docs.length} matching &ldquo;{search}&rdquo;
          </p>
        )}

        {/* Document list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No documents match &ldquo;{search}&rdquo;</p>
        ) : (
          <div className="divide-y divide-amber-100 dark:divide-gray-800">
            {sorted.map((doc, i) => (
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
                    {doc.page_count && (
                      <span className="text-xs text-gray-400">{doc.page_count} pp</span>
                    )}
                    {doc.word_count ? (
                      <span className="text-xs text-gray-400">{formatWords(doc.word_count)}</span>
                    ) : doc.file_size_bytes > 0 ? (
                      <span className="text-xs text-gray-400">{formatSize(doc.file_size_bytes)}</span>
                    ) : null}
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
