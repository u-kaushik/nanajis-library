'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import DocumentCard from '@/components/DocumentCard';
import { Document } from '@/lib/types';

interface CategoryGroup {
  collection: string;
  category: string;
  display_category: string | null;
  count: number;
}



export default function Home() {
  const router = useRouter();
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [searchResults, setSearchResults] = useState<Document[] | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/documents');
    if (res.status === 401) { router.push('/login'); return; }
    setGroups(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return; }
    setLoading(true);
    const res = await fetch(`/api/documents?q=${encodeURIComponent(q)}`);
    setSearchResults(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, runSearch]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  // Group by collection
  const byCollection = groups.reduce<Record<string, CategoryGroup[]>>((acc, g) => {
    if (!acc[g.collection]) acc[g.collection] = [];
    acc[g.collection].push(g);
    return acc;
  }, {});

  const totalDocs = groups.reduce((s, g) => s + g.count, 0);

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-950">
      <header className="bg-amber-900 dark:bg-gray-900 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Nanaji&apos;s Library</h1>
            {totalDocs > 0 && (
              <p className="text-amber-300 text-xs mt-0.5">{totalDocs.toLocaleString()} documents</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/chat" className="text-sm px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 transition-colors">
              Ask AI
            </Link>
            <button onClick={handleLogout} className="text-sm text-amber-300 hover:text-white transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading…</p>
        ) : searchResults !== null ? (
          /* Search results */
          <div>
            <p className="text-sm text-gray-500 mb-4">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</p>
            {searchResults.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No documents found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map(doc => <DocumentCard key={doc.id} document={doc} />)}
              </div>
            )}
          </div>
        ) : (
          /* Collection grid */
          <div className="space-y-8">
            {Object.entries(byCollection).map(([collection, cats]) => (
              <div key={collection}>
                <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200 mb-3 pb-1 border-b border-amber-200 dark:border-gray-700">
                  {collection}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cats.map(g => (
                    <Link
                      key={g.category}
                      href={`/library/${encodeURIComponent(collection)}/${encodeURIComponent(g.category)}`}
                      className="group p-4 bg-white dark:bg-gray-900 border border-amber-100 dark:border-gray-700 rounded-xl hover:border-amber-400 hover:shadow-md transition-all"
                    >
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 leading-snug">
                        {g.display_category ?? g.category}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{g.count} documents</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
