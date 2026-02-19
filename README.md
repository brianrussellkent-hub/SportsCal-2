# SportsCal 2

A dark-mode 2026 sports calendar built with Next.js (App Router) + TypeScript for Vercel.

## Included coverage targets

- NY Mets (all regular-season games, home + away via MLB API refresh)
- NY Giants (full schedule, home + away via ESPN refresh)
- UCI World Tour cycling
  - one-day events + stage-by-stage entries for all configured stage races
- Formula 1 (via Ergast refresh)
- NASCAR

## Key behavior

- Month / Week / Day viewing options.
- Monday-first calendar layout (Monday left, Sunday right).
- Category-colored events (MLB/NFL/Cycling/F1/NASCAR).
- **Today** button jumps directly to current ET day.
- **Refresh schedules** checks all tracked sports sources/adapters and merges missing events into the calendar.
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
