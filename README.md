# SportsCal 2

A clean Sports Calendar project built with Next.js (App Router) + TypeScript for smooth Vercel deployment.

## Included schedules

- NY Mets
- NY Giants
- UCI World Tour cycling events
- Formula 1
- NASCAR

## Key behavior

- **All event times display in Eastern Time (`America/New_York`)**.
- **Daily reset behavior**: calendar filter state auto-resets once a new ET day begins.
- **Extensible data model**: add future teams/sports by appending events in `data/events.ts`.
- Next.js ISR revalidation every 24 hours (`revalidate = 86400`) for routine schedule refresh windows.

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
