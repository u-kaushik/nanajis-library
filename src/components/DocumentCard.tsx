'use client';

import Link from 'next/link';
import { Document } from '@/lib/types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function DocumentCard({ document: doc }: { document: Document }) {
  return (
    <Link
      href={`/library/${encodeURIComponent(doc.collection)}/${encodeURIComponent(doc.category)}/${doc.id}`}
      className="group block p-4 bg-white dark:bg-gray-900 border border-amber-100 dark:border-gray-700 rounded-xl hover:border-amber-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-700 dark:text-red-300 font-bold text-xs">
          PDF
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 line-clamp-2 leading-snug">
            {doc.title}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {doc.file_size_bytes ? formatSize(doc.file_size_bytes) : ''}
          </p>
        </div>
      </div>
    </Link>
  );
}
