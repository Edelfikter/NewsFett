'use client';

import { useEffect, useState } from 'react';

interface Props {
  onAddFeed: () => void;
}

export default function TopBar({ onAddFeed }: Props) {
  const [now, setNow] = useState(new Date());
  const [balloonsOn, setBalloonsOn] = useState(true);

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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="z-20 h-12 flex items-center justify-between px-5 border-b border-white/10 flex-shrink-0"
      style={{ background: 'rgba(0,0,0,0.15)' }}
    >
      {/* Left: NEWSFETT wordmark + balloon toggle */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black uppercase tracking-[-0.04em] text-white select-none">
          NEWSFETT
        </h1>
        <span className="text-white/30 select-none">·</span>
        <span className="text-[11px] font-bold text-white/65 tracking-tight">
          Balloon:{' '}
          <button
            onClick={() => setBalloonsOn((v) => !v)}
            className="text-white hover:text-yellow-200 transition-colors underline decoration-white/30"
            aria-label="Toggle balloon popups"
          >
            {balloonsOn ? 'On' : 'Off'}
          </button>
        </span>
      </div>

      {/* Right: date + large clock */}
      <div className="flex items-center gap-4">
        <span className="text-[13px] font-bold text-white/70 tracking-tight">{dateStr}</span>
        <span className="text-2xl font-black text-white drop-shadow tracking-[-0.04em] tabular-nums">
          {timeStr}
        </span>
      </div>
    </div>
  );
}
