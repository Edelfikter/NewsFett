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
      className="absolute top-0 left-0 right-0 z-20 h-12 flex items-center justify-between px-5 border-b border-white/10"
      style={{ background: 'rgba(0,0,0,0.1)' }}
    >
      {/* Left: date + balloon toggle */}
      <div className="flex items-center gap-4">
        <span className="text-[13px] font-bold text-white/80 tracking-wide">{dateStr}</span>
        <span className="text-white/40 select-none">·</span>
        <span className="text-[11px] font-bold text-white/65 tracking-wide">
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

      {/* Right: large clock */}
      <span className="text-2xl font-bold text-white drop-shadow tracking-widest tabular-nums">
        {timeStr}
      </span>
    </div>
  );
}
