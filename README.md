# SportsCal 2

A dark-mode 2026 sports calendar built with Next.js (App Router) + TypeScript for Vercel.

## Included coverage targets

- NY Mets (expanded 2026 slate)
- NY Giants (NFL)
- UCI World Tour cycling
  - one-day events + stage-by-stage entries for all configured stage races
- Formula 1 (via Ergast refresh)
- NASCAR

## Key behavior

- Month / Week / Day viewing options.
- Monday-first calendar layout (Monday on the far left, Sunday on the far right).
- Dark calendar layout inspired by Google/Outlook density.
- All times rendered in Eastern Time (`America/New_York`).
- Only events with unconfirmed public start times are marked **Time TBD (ET)**.
- Filter by category and team/series.
- Daily ET reset of filter state at day rollover.

## Data quality notes

- Event dates are curated from publicly available series calendars and organizer schedules.
- Exact times can change; unresolved or unpublished times are intentionally shown as TBD.

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
