export interface Document {
  id: string;
  title: string;
  display_title?: string | null;
  collection: string;
  category: string;
  display_category?: string | null;
  storage_path: string;
  file_size_bytes: number;
  tags: string[];
  language: string;
  page_count?: number | null;
  word_count?: number | null;
  created_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: string; title: string; collection: string; category: string }[];
}
