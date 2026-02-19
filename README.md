# SportsCal 2

A dark-mode 2026 sports calendar built with Next.js (App Router) + TypeScript for Vercel.

## Included coverage

- NY Mets (expanded 2026 slate, home + away)
- NY Giants (expanded 2026 slate, home + away)
- UCI World Tour cycling
  - includes individual stage entries for Giro d'Italia, Tour de France, and La Vuelta a España
- Formula 1
- NASCAR

## Key behavior

- Month / Week / Day viewing options.
- Monday-first calendar layout (Monday left, Sunday right).
- Category-colored events (MLB/NFL/Cycling/F1/NASCAR).
- **Today** button jumps directly to current ET day.
- **Refresh schedules** button calls live source adapters (MLB Stats API + Ergast F1, with fallback to bundled data).
- All times rendered in Eastern Time (`America/New_York`).
- Only events with unconfirmed public start times are marked **Time TBD (ET)**.
- Filter by category and team/series.
- Daily ET reset of filter state at day rollover.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run start
```

## Deploy to Vercel

1. Import this repository in Vercel.
2. Framework preset: **Next.js**.
3. Build command: `npm run build`.
4. Output directory: leave empty (Next.js default).
