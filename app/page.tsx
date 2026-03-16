'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import { useNewsStream } from '@/hooks/useNewsStream';
import { useState } from 'react';
import AddFeedModal from '@/components/AddFeedModal';

const MAP_MAX_WIDTH = 900;
const MAP_MAX_HEIGHT = 520;

// Dynamic import to avoid SSR issues with react-simple-maps
const MapCanvas = dynamic(() => import('@/components/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <span className="text-white/40 text-sm tracking-widest uppercase">Loading map…</span>
    </div>
  ),
});

export default function Home() {
  const { items, pinnedId, setPinnedId, dismissPopup } = useNewsStream();
  const [showAddFeed, setShowAddFeed] = useState(false);

  return (
    <main className="relative flex flex-col h-screen w-screen overflow-hidden">
      {/* Top bar */}
      <TopBar onAddFeed={() => setShowAddFeed(true)} />

      {/* Content row: centered map area + sidebar */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Map region — centered with negative space */}
        <div className="flex-1 flex items-center justify-center p-8 min-w-0 overflow-hidden">
          <div className="relative w-full h-full" style={{ maxWidth: `${MAP_MAX_WIDTH}px`, maxHeight: `${MAP_MAX_HEIGHT}px` }}>
            <MapCanvas items={items} pinnedId={pinnedId} onPin={setPinnedId} onDismiss={dismissPopup} />
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar items={items} pinnedId={pinnedId} onPin={setPinnedId} />
      </div>

      {/* Add Feed Modal */}
      {showAddFeed && <AddFeedModal onClose={() => setShowAddFeed(false)} />}
    </main>
  );
}
