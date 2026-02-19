import { sportsEvents, type SportsEvent } from "@/data/events";

type RefreshResult = {
  events: SportsEvent[];
  refreshedAtIso: string;
  sourceStatus: string[];
};

function dedupe(events: SportsEvent[]): SportsEvent[] {
  const map = new Map<string, SportsEvent>();
  for (const event of events) map.set(event.id, event);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime()
  );
}

async function fetchMetsFromMlbApi(): Promise<SportsEvent[]> {
  const res = await fetch(
    "https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=121&season=2026&gameType=R",
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const events: SportsEvent[] = [];

  for (const day of data.dates ?? []) {
    for (const game of day.games ?? []) {
      const away = game.teams?.away?.team?.name ?? "Away Team";
      const home = game.teams?.home?.team?.name ?? "Home Team";
      const venue = game.venue?.name ?? "TBD Venue";
      events.push({
        id: `mets-${game.gamePk}`,
        title: `${away} vs ${home}`,
        category: "MLB",
        teamOrSeries: "NY Mets",
        location: venue,
        startTimeIso: game.gameDate,
        source: "MLB Stats API"
      });
    }
  }

  return events;
}

async function fetchF1FromErgast(): Promise<SportsEvent[]> {
  const res = await fetch("https://ergast.com/api/f1/2026.json", {
    next: { revalidate: 1800 }
  });
  if (!res.ok) return [];
  const data = await res.json();

  return (data?.MRData?.RaceTable?.Races ?? []).map((race: any, idx: number) => ({
    id: `f1-ergast-${idx + 1}`,
    title: `Formula 1 ${race.raceName}`,
    category: "Formula 1",
    teamOrSeries: "F1 World Championship",
    location: `${race.Circuit?.Location?.locality ?? ""}, ${race.Circuit?.Location?.country ?? ""}`.replace(/^,\s*/, ""),
    startTimeIso: `${race.date}T${(race.time ?? "12:00:00Z").replace("+00:00", "Z")}`,
    source: "Ergast"
  }));
}

export async function refreshSchedulesFromSources(): Promise<RefreshResult> {
  const sourceStatus: string[] = [];
  let merged = [...sportsEvents];

  try {
    const mets = await fetchMetsFromMlbApi();
    if (mets.length > 0) {
      merged = dedupe([...merged.filter((e) => e.teamOrSeries !== "NY Mets"), ...mets]);
      sourceStatus.push(`MLB Stats API: loaded ${mets.length} Mets games`);
    } else {
      sourceStatus.push("MLB Stats API: no new data");
    }
  } catch {
    sourceStatus.push("MLB Stats API: failed");
  }

  try {
    const f1 = await fetchF1FromErgast();
    if (f1.length > 0) {
      merged = dedupe([
        ...merged.filter((e) => !(e.category === "Formula 1" && e.teamOrSeries === "F1 World Championship")),
        ...f1
      ]);
      sourceStatus.push(`Ergast F1: loaded ${f1.length} races`);
    } else {
      sourceStatus.push("Ergast F1: no new data");
    }
  } catch {
    sourceStatus.push("Ergast F1: failed");
  }

  sourceStatus.push("Cycling/NFL/NASCAR currently using bundled schedule dataset");

  return {
    events: dedupe(merged),
    refreshedAtIso: new Date().toISOString(),
    sourceStatus
  };
}
