import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import sql from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Simple text embedding via Gemini REST API (same as existing knowledge pipeline)
async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
    }
  );
  const data = await res.json();
  return data.embedding.values as number[];
}

export async function POST(request: Request) {
  const session = await verifySession(await cookies());
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages } = await request.json();
  const userMessage: string = messages[messages.length - 1].content;

  // Embed query and find similar chunks
  const queryEmbedding = await embed(userMessage);
  const embeddingLiteral = `[${queryEmbedding.join(',')}]`;

  const chunks = await sql`
    SELECT c.content, d.id AS document_id, d.title, d.collection, d.category,
           1 - (c.embedding <=> ${embeddingLiteral}::vector) AS similarity
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    WHERE c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${embeddingLiteral}::vector
    LIMIT 8
  `;

  if (chunks.length === 0) {
    return NextResponse.json({
      reply: "I don't have any of Nanaji's writings indexed yet. Once the documents are ingested, I'll be able to answer questions from his writings.",
      sources: [],
    });
  }

  const context = chunks
    .map((c, i) => `[${i + 1}] From "${c.title}" (${c.category}):\n${c.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are a thoughtful assistant helping family members explore the writings and wisdom of Nanaji (grandfather). You have access to excerpts from his documents.

Answer questions warmly and thoughtfully, drawing on the provided excerpts. Always cite which document your answer comes from using [1], [2] etc. If the excerpts don't contain enough information to answer fully, say so honestly.

Context from Nanaji's writings:
${context}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.slice(0, -1).concat([{ role: 'user', content: userMessage }]),
  });

  const reply = (response.content[0] as { type: string; text: string }).text;

  // Deduplicate sources
  const seen = new Set<string>();
  const sources = chunks
    .filter(c => { if (seen.has(c.document_id)) return false; seen.add(c.document_id); return true; })
    .map(c => ({ id: c.document_id, title: c.title, collection: c.collection, category: c.category }));

  return NextResponse.json({ reply, sources });
}
