'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import { useNewsStream } from '@/hooks/useNewsStream';
import { useState } from 'react';
import AddFeedModal from '@/components/AddFeedModal';

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
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Top bar */}
      <TopBar onAddFeed={() => setShowAddFeed(true)} />

      {/* Map fills remaining space */}
      <div className="absolute inset-0 pt-12">
        <MapCanvas items={items} pinnedId={pinnedId} onPin={setPinnedId} onDismiss={dismissPopup} />
      </div>

      {/* Sidebar */}
      <Sidebar items={items} pinnedId={pinnedId} onPin={setPinnedId} />

      {/* Add Feed Modal */}
      {showAddFeed && <AddFeedModal onClose={() => setShowAddFeed(false)} />}
    </main>
  );
}
