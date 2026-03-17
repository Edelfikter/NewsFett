'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
}

export default function AddFeedModal({ onClose }: Props) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg('Feed added successfully!');
        setUrl('');
      } else {
        setStatus('error');
        setMsg(data.error || 'Failed to add feed');
      }
    } catch {
      setStatus('error');
      setMsg('Network error. Please try again.');
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass rounded-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.5)] w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold tracking-widest uppercase text-white/80">
            Add RSS Feed
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">
              Feed URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://feeds.example.com/rss.xml"
              required
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-[#9ad37f]/60 focus:bg-white/8 transition-all"
            />
          </div>

          {msg && (
            <p
              className={`text-xs ${
                status === 'success' ? 'text-[#9ad37f]' : 'text-red-400/80'
              }`}
            >
              {msg}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-bold tracking-widest uppercase text-white/40 hover:text-white/70 border border-white/10 hover:border-white/25 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex-1 py-2 text-xs font-bold tracking-widest uppercase bg-[#9ad37f]/20 hover:bg-[#9ad37f]/30 text-[#c7ff8b] border border-[#9ad37f]/30 hover:border-[#9ad37f]/60 rounded-lg transition-all disabled:opacity-50"
            >
              {status === 'loading' ? 'Adding…' : 'Add Feed'}
            </button>
          </div>
        </form>

        {/* Example feeds */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-2">
            Example feeds
          </p>
          <ul className="space-y-1">
            {[
              'https://feeds.reuters.com/reuters/worldNews',
              'https://feeds.bbci.co.uk/news/world/rss.xml',
              'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
            ].map((f) => (
              <li key={f}>
                <button
                  type="button"
                  onClick={() => setUrl(f)}
                  className="text-[10px] text-[#9ad37f]/60 hover:text-[#9ad37f] transition-colors truncate w-full text-left"
                >
                  {f.replace('https://', '')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
