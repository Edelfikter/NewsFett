'use client';

import { useMemo } from 'react';
import type { NewsItemWithUI } from '@/hooks/useNewsStream';

interface Props {
  items: NewsItemWithUI[];
  pinnedId: string | null;
  onPin: (id: string | null) => void;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Sidebar({ items, pinnedId, onPin }: Props) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 30),
    [items]
  );

  return (
    <aside className="h-full w-full flex flex-col glass border-l border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">
          Latest
        </span>
        <span className="text-[10px] text-white/30">{sorted.length} items</span>
      </div>

      <ul className="flex-1 overflow-y-auto sidebar-scroll divide-y divide-white/5">
        {sorted.map((item) => (
          <li
            key={item.id}
            className={`px-4 py-3 transition-colors hover:bg-white/5 cursor-default ${
              pinnedId === item.id ? 'bg-white/8' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              {/* Source badge */}
              <span className="mt-0.5 flex-shrink-0 text-[9px] font-bold tracking-wider uppercase text-[#9ad37f] bg-[#9ad37f]/10 px-1.5 py-0.5 rounded-sm max-w-[72px] truncate">
                {item.source.replace(/^www\./, '').split('.')[0]}
              </span>

              {/* Headline */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-light leading-snug text-white/80 line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-white/30">{timeAgo(item.publishedAt)}</span>
                  {/* Pin button */}
                  <button
                    onClick={() => onPin(pinnedId === item.id ? null : item.id)}
                    title={pinnedId === item.id ? 'Unpin' : 'Pin popup'}
                    className={`text-[10px] transition-colors ${
                      pinnedId === item.id
                        ? 'text-[#c7ff8b]'
                        : 'text-white/20 hover:text-white/50'
                    }`}
                  >
                    {pinnedId === item.id ? '📌' : '⊙'}
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
