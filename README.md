# SportsCal 2

A dark-mode 2026 sports calendar built with Next.js (App Router) + TypeScript for Vercel.

## Included coverage

- NY Mets (MLB)
- NY Giants (NFL)
- UCI World Tour cycling
  - includes individual stage entries for Giro d'Italia, Tour de France, and La Vuelta a España
- Formula 1
- NASCAR

## Key behavior

- Month / Week / Day viewing options.
- Dark calendar layout inspired by Google/Outlook density.
- All times rendered in Eastern Time (`America/New_York`).
- Events with unconfirmed public start times are marked **Time TBD (ET)**.
- Filter by category and team/series.
- Daily ET reset of filter state at day rollover.

## Data quality notes

- Event dates are curated from publicly available series calendars and organizer schedules.
- Exact start times can change; unresolved or unpublished times are intentionally shown as TBD.

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
