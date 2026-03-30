import { sportsEvents, type SportsEvent } from "@/data/events";

type RefreshResult = {
  events: SportsEvent[];
  refreshedAtIso: string;
  sourceStatus: string[];
};

type AdapterResult = {
  events: SportsEvent[];
  status: string;
  ok: boolean;
};

type ScopeDefinition = {
  name: string;
  include: (event: SportsEvent) => boolean;
};

type DiffSummary = {
  added: number;
  updated: number;
  removed: number;
};

function dedupe(events: SportsEvent[]): SportsEvent[] {
  const map = new Map<string, SportsEvent>();
  for (const event of events) map.set(event.id, event);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime()
  );
}

function eventFingerprint(event: SportsEvent): string {
  return [
    event.title,
    event.category,
    event.teamOrSeries,
    event.location,
    event.startTimeIso,
    event.source ?? "",
    event.isTimeTbd ? "1" : "0"
  ].join("|");
}

function computeDiff(previous: SportsEvent[], next: SportsEvent[]): DiffSummary {
  const previousById = new Map(previous.map((event) => [event.id, event]));
  const nextById = new Map(next.map((event) => [event.id, event]));

  let added = 0;
  let updated = 0;
  let removed = 0;

  for (const [id, nextEvent] of nextById.entries()) {
    const previousEvent = previousById.get(id);
    if (!previousEvent) {
      added += 1;
      continue;
    }

    if (eventFingerprint(previousEvent) !== eventFingerprint(nextEvent)) {
      updated += 1;
    }
  }

  for (const id of previousById.keys()) {
    if (!nextById.has(id)) removed += 1;
  }

  return { added, updated, removed };
}

function replaceScope(
  merged: SportsEvent[],
  scope: ScopeDefinition,
  replacement: SportsEvent[]
): SportsEvent[] {
  return [...merged.filter((event) => !scope.include(event)), ...replacement];
}

async function fetchMetsFromMlbApi(): Promise<AdapterResult> {
  try {
    const res = await fetch(
      "https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=121&season=2026&gameType=R",
      { cache: "no-store" }
    );
    if (!res.ok) return { events: [], status: "MLB Stats API: failed", ok: false };

    const data = (await res.json()) as {
      dates?: Array<{
        games?: Array<{
          gamePk: number;
          gameDate: string;
          venue?: { name?: string };
          teams?: {
            away?: { team?: { name?: string } };
            home?: { team?: { name?: string } };
          };
          status?: { detailedState?: string };
        }>;
      }>;
    };

    const events: SportsEvent[] = [];
    for (const day of data.dates ?? []) {
      for (const game of day.games ?? []) {
        const away = game.teams?.away?.team?.name ?? "Away Team";
        const home = game.teams?.home?.team?.name ?? "Home Team";
        const detailedState = game.status?.detailedState?.trim();

        events.push({
          id: `mets-${game.gamePk}`,
          title: detailedState ? `${away} at ${home} (${detailedState})` : `${away} at ${home}`,
          category: "MLB",
          teamOrSeries: "NY Mets",
          location: game.venue?.name ?? "TBD Venue",
          startTimeIso: game.gameDate,
          source: "MLB Stats API"
        });
      }
    }

    return {
      events,
      status: `MLB Stats API: loaded ${events.length} Mets games`,
      ok: true
    };
  } catch {
    return { events: [], status: "MLB Stats API: failed", ok: false };
  }
}

async function fetchGiantsFromEspn(): Promise<AdapterResult> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/19/schedule?season=2026",
      { cache: "no-store" }
    );
    if (!res.ok) return { events: [], status: "ESPN NFL: failed", ok: false };

    const data = (await res.json()) as {
      events?: Array<{
        id: string;
        date: string;
        name?: string;
        status?: { type?: { description?: string } };
        competitions?: Array<{ venue?: { fullName?: string } }>;
      }>;
    };

    const events: SportsEvent[] = (data.events ?? []).map((event) => {
      const description = event.status?.type?.description?.trim();
      const title = event.name ?? "NY Giants Game";
      return {
        id: `giants-${event.id}`,
        title: description ? `${title} (${description})` : title,
        category: "NFL",
        teamOrSeries: "NY Giants",
        location: event.competitions?.[0]?.venue?.fullName ?? "TBD Venue",
        startTimeIso: event.date,
        source: "ESPN NFL"
      };
    });

    return {
      events,
      status: `ESPN NFL: loaded ${events.length} Giants games`,
      ok: true
    };
  } catch {
    return { events: [], status: "ESPN NFL: failed", ok: false };
  }
}

async function fetchF1FromErgast(): Promise<AdapterResult> {
  try {
    const res = await fetch("https://ergast.com/api/f1/2026.json", {
      cache: "no-store"
    });
    if (!res.ok) return { events: [], status: "Ergast F1: failed", ok: false };

    const data = (await res.json()) as {
      MRData?: {
        RaceTable?: {
          Races?: Array<{
            round?: string;
            raceName?: string;
            date: string;
            time?: string;
            Circuit?: { Location?: { locality?: string; country?: string } };
          }>;
        };
      };
    };

    const events: SportsEvent[] = (data.MRData?.RaceTable?.Races ?? []).map((race, idx) => {
      const round = race.round ?? `${idx + 1}`;
      return {
        id: `f1-ergast-${round}`,
        title: `Formula 1 ${race.raceName ?? `Round ${round}`}`,
        category: "Formula 1",
        teamOrSeries: "F1 World Championship",
        location: `${race.Circuit?.Location?.locality ?? ""}, ${race.Circuit?.Location?.country ?? ""}`.replace(
          /^,\s*/,
          ""
        ),
        startTimeIso: `${race.date}T${(race.time ?? "12:00:00Z").replace("+00:00", "Z")}`,
        source: "Ergast"
      };
    });

    return {
      events,
      status: `Ergast F1: loaded ${events.length} races`,
      ok: true
    };
  } catch {
    return { events: [], status: "Ergast F1: failed", ok: false };
  }
}

function getCanonicalCyclingEvents(): AdapterResult {
  const events = sportsEvents
    .filter((event) => event.category === "Cycling" && event.teamOrSeries === "UCI World Tour")
    .map((event) => ({ ...event, source: event.source ?? "UCI WorldTour / race organizer calendar" }));

  return {
    events,
    status: `Cycling canonical reference: loaded ${events.length} events`,
    ok: true
  };
}

function getCanonicalNascarEvents(): AdapterResult {
  const events = sportsEvents
    .filter((event) => event.category === "NASCAR" && event.teamOrSeries === "NASCAR Cup Series")
    .map((event) => ({ ...event, source: event.source ?? "NASCAR canonical schedule" }));

  return {
    events,
    status: `NASCAR canonical reference: loaded ${events.length} races`,
    ok: true
  };
}

export async function refreshSchedulesFromSources(): Promise<RefreshResult> {
  const sourceStatus: string[] = [];
  let merged = [...sportsEvents];

  const scopes: Array<{ scope: ScopeDefinition; result: AdapterResult }> = [
    {
      scope: { name: "NY Mets", include: (event) => event.teamOrSeries === "NY Mets" },
      result: await fetchMetsFromMlbApi()
    },
    {
      scope: { name: "NY Giants", include: (event) => event.teamOrSeries === "NY Giants" },
      result: await fetchGiantsFromEspn()
    },
    {
      scope: {
        name: "Formula 1",
        include: (event) => event.category === "Formula 1" && event.teamOrSeries === "F1 World Championship"
      },
      result: await fetchF1FromErgast()
    },
    {
      scope: {
        name: "Cycling",
        include: (event) => event.category === "Cycling" && event.teamOrSeries === "UCI World Tour"
      },
      result: getCanonicalCyclingEvents()
    },
    {
      scope: {
        name: "NASCAR",
        include: (event) => event.category === "NASCAR" && event.teamOrSeries === "NASCAR Cup Series"
      },
      result: getCanonicalNascarEvents()
    }
  ];

  for (const { scope, result } of scopes) {
    sourceStatus.push(result.status);

    if (!result.ok) {
      sourceStatus.push(`${scope.name}: refresh skipped (source unavailable), existing events preserved`);
      continue;
    }

    const previousScopeEvents = merged.filter(scope.include);
    merged = replaceScope(merged, scope, result.events);
    const diff = computeDiff(previousScopeEvents, result.events);
    sourceStatus.push(
      `${scope.name}: +${diff.added} new, ${diff.updated} updated, ${diff.removed} removed/cancelled`
    );
  }

  return {
    events: dedupe(merged),
    refreshedAtIso: new Date().toISOString(),
    sourceStatus
  };
}
