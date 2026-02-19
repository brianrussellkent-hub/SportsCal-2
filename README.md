# SportsCal 2

A dark-mode, full-year 2026 sports calendar built with Next.js (App Router) + TypeScript for Vercel.

## Included coverage

- NY Mets (MLB)
- NY Giants (NFL)
- UCI World Tour cycling (expanded 2026 calendar)
- Formula 1
- NASCAR

## Key behavior

- **Google/Outlook-inspired month-grid calendar layout**.
- **Dark mode UI** optimized for dense event viewing.
- **All times rendered in Eastern Time (`America/New_York`)**.
- **Filter by category and team/series**.
- **Daily ET reset** of filter state at day rollover.
- Data model is extensible in `data/events.ts` for adding teams/sports/events.

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
