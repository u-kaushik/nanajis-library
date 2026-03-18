'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChatMessage } from '@/lib/types';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    });
    const data = await res.json();
    setLoading(false);

    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: data.reply, sources: data.sources },
    ]);
  }

  return (
    <div className="flex flex-col h-screen bg-amber-50 dark:bg-gray-950">
      <header className="bg-amber-900 dark:bg-gray-900 text-white shadow px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <Link href="/" className="text-amber-300 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-bold">Ask Nanaji&apos;s Library</h1>
          <p className="text-amber-300 text-xs">Powered by Claude AI</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 pt-12">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-base font-medium text-gray-600 dark:text-gray-300 mb-2">Ask anything about Nanaji&apos;s writings</p>
            <p className="text-sm text-gray-400">Try: &ldquo;What did Nanaji write about meditation?&rdquo; or &ldquo;Find poems about nature&rdquo;</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-amber-800 text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-amber-100 dark:border-gray-700 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400 px-1">Sources:</p>
                  {msg.sources.map(s => (
                    <Link
                      key={s.id}
                      href={`/library/${encodeURIComponent(s.collection)}/${encodeURIComponent(s.category)}/${s.id}`}
                      className="block text-xs px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors truncate"
                    >
                      📄 {s.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-gray-900 border border-amber-100 dark:border-gray-700">
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="px-4 py-4 bg-white dark:bg-gray-900 border-t border-amber-100 dark:border-gray-700 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about Nanaji's writings…"
          className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-amber-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
