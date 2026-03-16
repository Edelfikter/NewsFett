'use client';

import { useEffect, useState } from 'react';

interface Props {
  onAddFeed: () => void;
}

export default function TopBar({ onAddFeed }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-12 glass flex items-center justify-between px-5 border-b border-white/10">
      {/* Logo */}
      <span className="text-[#c7ff8b] font-bold tracking-[0.25em] text-xs uppercase">
        NewsFett
      </span>

      {/* Clock */}
      <div className="flex items-center gap-4">
        <span className="font-bold text-sm tracking-widest text-white/90">{timeStr}</span>
        <span className="font-light text-xs text-white/50 tracking-wide hidden sm:inline">{dateStr}</span>
      </div>

      {/* Add feed button */}
      <button
        onClick={onAddFeed}
        className="flex items-center gap-1.5 text-xs font-light text-white/60 hover:text-[#c7ff8b] transition-colors border border-white/15 hover:border-[#c7ff8b]/40 rounded px-3 py-1"
      >
        <span className="text-base leading-none">+</span>
        <span className="hidden sm:inline">Add Feed</span>
      </button>
    </div>
  );
}
