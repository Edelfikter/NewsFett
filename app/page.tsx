'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import { useNewsStream } from '@/hooks/useNewsStream';
import { useState } from 'react';
import AddFeedModal from '@/components/AddFeedModal';

const MapCanvas = dynamic(() => import('@/components/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-white/60 text-sm tracking-[0.08em] uppercase">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const { items, pinnedId, setPinnedId } = useNewsStream();
  const [showAddFeed, setShowAddFeed] = useState(false);

  return (
    <main className="min-h-screen w-full bg-[var(--bg)] bg-stripes text-[var(--text-main)] flex flex-col items-center py-6 px-4">
      {/* Centered shell that holds top bar + map + sidebar */}
      <div className="layout-shell w-full">
        <TopBar onAddFeed={() => setShowAddFeed(true)} />

        <div className="flex gap-6 items-start justify-center">
          {/* Map box */}
          <div className="map-frame">
            <MapCanvas items={items} pinnedId={pinnedId} onPin={setPinnedId} />
          </div>

          {/* Sidebar same height as map, snug to its right */}
          <div className="sidebar-frame">
            <Sidebar items={items} pinnedId={pinnedId} onPin={setPinnedId} />
          </div>
        </div>
      </div>

      {showAddFeed && <AddFeedModal onClose={() => setShowAddFeed(false)} />}
    </main>
  );
}
