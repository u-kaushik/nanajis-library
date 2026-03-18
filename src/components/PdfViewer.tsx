'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  title: string;
}

export default function PdfViewer({ url, title }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [outline, setOutline] = useState<Array<{ title: string; pageNumber: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Measure container width for responsive PDF scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Track current page via intersection observer
  useEffect(() => {
    if (numPages === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const page = parseInt((e.target as HTMLElement).dataset.page || '1');
            setCurrentPage(page);
          }
        });
      },
      { threshold: 0.5 }
    );
    pageRefs.current.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [numPages]);

  // Update reading progress bar
  useEffect(() => {
    if (numPages === 0) return;
    const pct = (currentPage / numPages) * 100;
    const bar = document.getElementById('reading-progress');
    if (bar) bar.style.width = `${pct}%`;
    return () => { if (bar) bar.style.width = '0%'; };
  }, [currentPage, numPages]);

  function onDocumentLoad({ numPages: n }: { numPages: number }) {
    setNumPages(n);
  }

  function jumpToPage(page: number) {
    const el = pageRefs.current.get(page);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  }

  function setPageRef(page: number, el: HTMLDivElement | null) {
    if (el) pageRefs.current.set(page, el);
    else pageRefs.current.delete(page);
  }

  const pageWidth = containerWidth > 0 ? Math.min(containerWidth - 32, 900) : undefined;

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Reading progress bar */}
      <div id="reading-progress" style={{ width: 0 }} />

      {/* Sidebar TOC — desktop pinned, mobile overlay */}
      {outline.length > 0 && (
        <>
          {/* Mobile overlay backdrop */}
          {tocOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-20 lg:hidden"
              onClick={() => setTocOpen(false)}
            />
          )}
          <aside className={`
            fixed lg:relative inset-y-0 left-0 z-30
            w-64 bg-amber-50 dark:bg-gray-900 border-r border-amber-200 dark:border-gray-700
            flex flex-col overflow-hidden transition-transform duration-200
            ${tocOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="px-4 py-3 border-b border-amber-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Contents</span>
              <button onClick={() => setTocOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {outline.map((item, i) => (
                <button
                  key={i}
                  onClick={() => jumpToPage(item.pageNumber)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-gray-800 transition-colors truncate"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </aside>
        </>
      )}

      {/* Main PDF area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-amber-100 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          {outline.length > 0 && (
            <button
              onClick={() => setTocOpen(v => !v)}
              className="lg:hidden p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Table of contents"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            </button>
          )}
          <span className="text-xs text-gray-400 font-mono ml-auto">
            {numPages > 0 ? `${currentPage} / ${numPages}` : '…'}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => jumpToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => jumpToPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF scroll area */}
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-950 px-4 py-4">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoad}
            loading={
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading {title}…</p>
                </div>
              </div>
            }
            error={
              <div className="text-center py-20 text-gray-400">
                <p>Could not load PDF.</p>
              </div>
            }
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
              <div
                key={page}
                ref={el => setPageRef(page, el)}
                data-page={page}
                className="pdf-page mb-3 flex justify-center"
              >
                <Page
                  pageNumber={page}
                  width={pageWidth}
                  className="shadow-lg rounded overflow-hidden"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
