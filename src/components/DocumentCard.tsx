"use client";

import Link from "next/link";
import { Document } from "@/lib/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFileIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.startsWith("text/")) return "TXT";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  return "FILE";
}

function getIconColor(label: string): string {
  switch (label) {
    case "PDF":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    case "IMG":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "TXT":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "DOC":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300";
    case "XLS":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
}

export default function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const iconLabel = getFileIcon(document.mimeType);
  const iconColor = getIconColor(iconLabel);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${iconColor}`}
        >
          {iconLabel}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">
            {document.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatFileSize(document.size)} &middot;{" "}
            {formatDate(document.uploadedAt)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Link
          href={`/documents/view?id=${document.id}`}
          className="flex-1 text-center text-sm py-1.5 px-3 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          View
        </Link>
        <a
          href={`/api/documents/${document.id}`}
          download={document.originalName}
          className="flex-1 text-center text-sm py-1.5 px-3 rounded border border-gray-300 dark:border-gray-600 text-foreground hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Download
        </a>
        <button
          onClick={() => onDelete(document.id)}
          className="text-sm py-1.5 px-3 rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
