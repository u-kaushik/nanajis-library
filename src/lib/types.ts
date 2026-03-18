export interface Document {
  id: string;
  title: string;
  collection: string;
  category: string;
  storage_path: string;
  file_size_bytes: number;
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
