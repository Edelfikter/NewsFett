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

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="topbar glass flex items-center justify-between px-6 py-3 mb-4">
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-black tracking-[0.08em] uppercase">NewsFett</span>
        <span className="text-sm font-semibold tracking-[0.04em] text-white/75">{dateStr}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-2xl font-black tracking-[0.08em]">{timeStr}</span>
        <button
          onClick={onAddFeed}
          className="text-[11px] font-bold tracking-[0.08em] text-white/65 hover:text-white transition-colors"
        >
          Balloon On/Off
        </button>
      </div>
    </div>
  );
}
