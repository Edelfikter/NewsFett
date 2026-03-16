import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NewsFett — Live Global News Map',
  description: 'Real-time RSS news visualization on a world map.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden">{children}</body>
    </html>
  );
}
