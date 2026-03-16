# NewsFett 🌍

**Live Global News Map** — a Vercel-ready Next.js 14 application that visualises RSS news headlines as interactive popups appearing at geo-located positions on a world map.

---

## Features

- 🗺 **Interactive world map** rendered with `react-simple-maps` (Equal Earth projection) and a dot-grid overlay
- 📡 **RSS aggregation** — polls Reuters, BBC, NYT, AP, Al Jazeera (and any feeds you add) every 7 minutes via a Vercel Cron job
- 📍 **Geo-location** — extracts country/city mentions from headlines and maps them to coordinates; falls back to Nominatim (OpenStreetMap) geocoding, cached in Redis
- 💡 **Glass-morphism UI** — dark navy colour scheme with green dot accents and frosted-glass popups
- 📋 **Sidebar** — chronological feed of the 30 most recent headlines with pin/unpin support
- ➕ **Add Feed modal** — add any RSS/Atom feed URL at runtime; stored in Upstash Redis
- 🔁 **Mock data** — works without Redis; 8 sample items are shown on first load
- ⚡ **Edge-ready** — health check runs on the Edge runtime; polling and feed APIs run on Node.js

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS 3 |
| Map | react-simple-maps + D3 projections |
| RSS parsing | fast-xml-parser |
| Data store | Upstash Redis (optional) |
| Data fetching | SWR |
| Deployment | Vercel |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `REDIS_URL` | Upstash Redis REST URL (from [console.upstash.com](https://console.upstash.com)) |
| `REDIS_TOKEN` | Upstash Redis REST token |
| `GEOCODE_USER_AGENT` | User-Agent for Nominatim requests — include your app name & email |
| `CRON_SECRET` | Random string used to protect `POST /api/poll` from unauthorised calls |

> **Redis is optional for local development.** Without it, the app shows built-in mock data and the feed/poll endpoints return graceful errors.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add the environment variables in **Project → Settings → Environment Variables**.
3. Deploy — Vercel will automatically schedule `POST /api/poll` every 7 minutes (defined in `vercel.json`).

---

## Project Structure

```
NewsFett/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Main page (client component)
│   ├── globals.css         # Tailwind + CSS variables
│   └── api/
│       ├── health/route.ts # GET  /api/health  (Edge)
│       ├── feeds/route.ts  # GET|POST /api/feeds
│       ├── latest/route.ts # GET  /api/latest?since=<ms>
│       └── poll/route.ts   # POST /api/poll  (Vercel Cron)
├── components/
│   ├── MapCanvas.tsx       # World map + markers + popup overlay
│   ├── Popup.tsx           # Individual news popup card
│   ├── Sidebar.tsx         # Right-hand headline list
│   ├── TopBar.tsx          # Header with clock + Add Feed button
│   └── AddFeedModal.tsx    # Modal to add an RSS feed URL
├── hooks/
│   └── useNewsStream.ts    # SWR polling + UI state for news items
├── lib/
│   ├── redis.ts            # Upstash Redis helpers
│   ├── rss.ts              # RSS/Atom feed fetching & parsing
│   ├── geocode.ts          # Country centroid lookup + Nominatim fallback
│   ├── mockData.ts         # 8 sample news items for offline use
│   └── defaultFeeds.ts     # Built-in RSS feed URLs
├── .env.example
├── vercel.json             # Cron job definition
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{ ok: true, ts: <unix ms> }` |
| `GET` | `/api/feeds` | Lists stored RSS feed URLs |
| `POST` | `/api/feeds` | Adds a new RSS feed URL `{ url }` |
| `GET` | `/api/latest?since=<ms>` | Returns news items published after `since` |
| `POST` | `/api/poll` | Fetches all feeds and persists new items (requires `Authorization: Bearer <CRON_SECRET>` if set) |

---

## License

MIT

