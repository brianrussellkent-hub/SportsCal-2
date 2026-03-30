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


type JsonFetchResult<T> = {
  ok: boolean;
  statusCode?: number;
  data?: T;
};

async function fetchJsonNoStore<T>(url: string): Promise<JsonFetchResult<T>> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, statusCode: res.status };
    return { ok: true, statusCode: res.status, data: (await res.json()) as T };
  } catch {
    return { ok: false };
  }
}

async function fetchMetsFromMlbApi(): Promise<AdapterResult> {
  const json = await fetchJsonNoStore<{
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
  }>("https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=121&season=2026&gameType=R");

  if (!json.ok || !json.data) {
    return { events: [], status: `MLB Stats API: failed${json.statusCode ? ` (${json.statusCode})` : ""}`, ok: false };
  }

  const events: SportsEvent[] = [];
  for (const day of json.data.dates ?? []) {
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

  if (events.length === 0) {
    return {
      events: [],
      status: "MLB Stats API: returned 0 games; preserving existing Mets schedule",
      ok: false
    };
  }

  return {
    events,
    status: `MLB Stats API: loaded ${events.length} Mets games`,
    ok: true
  };
}

async function fetchGiantsFromEspn(): Promise<AdapterResult> {
  const fallbackGiants = getCanonicalGiantsEvents();
  const teamSchedule = await fetchJsonNoStore<{
    events?: Array<{
      id: string;
      date: string;
      name?: string;
      status?: { type?: { description?: string } };
      competitions?: Array<{ venue?: { fullName?: string } }>;
    }>;
  }>("https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/19/schedule?season=2026");

  const events: SportsEvent[] = (teamSchedule.data?.events ?? []).map((event) => {
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

  if (teamSchedule.ok && events.length > 0) {
    return {
      events,
      status: `ESPN NFL team schedule: loaded ${events.length} Giants games`,
      ok: true
    };
  }

  const weeklyScoreboardEvents = await fetchGiantsFromWeeklyScoreboard();
  if (weeklyScoreboardEvents.length > 0) {
    return {
      events: weeklyScoreboardEvents,
      status: `ESPN NFL weekly scoreboard fallback: loaded ${weeklyScoreboardEvents.length} Giants games`,
      ok: true
    };
  }

  const teamStatus = teamSchedule.ok
    ? "team schedule empty"
    : `team schedule failed${teamSchedule.statusCode ? ` (${teamSchedule.statusCode})` : ""}`;

  return {
    events: fallbackGiants.events,
    status: `ESPN NFL returned 0 Giants games (${teamStatus}; scoreboard fallback empty). Using canonical Giants fallback (${fallbackGiants.events.length} games)`,
    ok: true
  };
}

async function fetchGiantsFromWeeklyScoreboard(): Promise<SportsEvent[]> {
  const events: SportsEvent[] = [];
  const seenEventIds = new Set<string>();

  for (let week = 1; week <= 18; week += 1) {
    const scoreboard = await fetchJsonNoStore<{
      events?: Array<{
        id: string;
        date: string;
        name?: string;
        status?: { type?: { description?: string } };
        competitions?: Array<{
          venue?: { fullName?: string };
          competitors?: Array<{ team?: { id?: string } }>;
        }>;
      }>;
    }>(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}&year=2026`
    );

    if (!scoreboard.ok || !scoreboard.data) continue;

    for (const event of scoreboard.data.events ?? []) {
      const hasGiants = (event.competitions?.[0]?.competitors ?? []).some(
        (competitor) => competitor.team?.id === "19"
      );

      if (!hasGiants || seenEventIds.has(event.id)) continue;
      seenEventIds.add(event.id);

      const description = event.status?.type?.description?.trim();
      const title = event.name ?? "NY Giants Game";

      events.push({
        id: `giants-${event.id}`,
        title: description ? `${title} (${description})` : title,
        category: "NFL",
        teamOrSeries: "NY Giants",
        location: event.competitions?.[0]?.venue?.fullName ?? "TBD Venue",
        startTimeIso: event.date,
        source: "ESPN NFL"
      });
    }
  }

  return events;
}

async function fetchF1FromSources(): Promise<AdapterResult> {
  type ErgastPayload = {
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

  const espnSchedule = await fetchJsonNoStore<{
    events?: Array<{
      id: string;
      date: string;
      name?: string;
      competitions?: Array<{ venue?: { fullName?: string } }>;
    }>;
  }>("https://site.api.espn.com/apis/site/v2/sports/racing/f1/schedule?season=2026");

  if (espnSchedule.ok && espnSchedule.data) {
    const espnEvents: SportsEvent[] = (espnSchedule.data.events ?? []).map((race) => ({
      id: `f1-espn-${race.id}`,
      title: race.name ?? "Formula 1 Race",
      category: "Formula 1",
      teamOrSeries: "F1 World Championship",
      location: race.competitions?.[0]?.venue?.fullName ?? "TBD Venue",
      startTimeIso: race.date,
      source: "ESPN F1"
    }));

    if (espnEvents.length > 0) {
      return {
        events: espnEvents,
        status: `ESPN F1: loaded ${espnEvents.length} races`,
        ok: true
      };
    }
  }

  const candidates: Array<{ name: string; url: string }> = [
    { name: "Ergast", url: "https://ergast.com/api/f1/2026.json" },
    { name: "Jolpica", url: "https://api.jolpi.ca/ergast/f1/2026.json" }
  ];

  const failures: string[] = [];

  for (const candidate of candidates) {
    const json = await fetchJsonNoStore<ErgastPayload>(candidate.url);
    if (!json.ok || !json.data) {
      failures.push(`${candidate.name}${json.statusCode ? ` ${json.statusCode}` : ""}`.trim());
      continue;
    }

    const races = json.data.MRData?.RaceTable?.Races ?? [];
    const events: SportsEvent[] = races.map((race, idx) => {
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
        source: candidate.name
      };
    });

    if (events.length === 0) {
      failures.push(`${candidate.name} empty schedule`);
      continue;
    }

    return {
      events,
      status: `${candidate.name} F1: loaded ${events.length} races`,
      ok: true
    };
  }

  return {
    events: [],
    status: `F1 sources failed (${failures.join(", ") || "no response"}); preserving existing Formula 1 schedule`,
    ok: false
  };
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

function getCanonicalGiantsEvents(): AdapterResult {
  const events = sportsEvents
    .filter((event) => event.category === "NFL" && event.teamOrSeries === "NY Giants")
    .map((event) => ({ ...event, source: event.source ?? "Bundled Giants schedule fallback" }));

  return {
    events,
    status: `Giants canonical fallback: loaded ${events.length} games`,
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
      result: await fetchF1FromSources()
    },
    {
      scope: {
        name: "Cycling",
        include: (event) => event.category === "Cycling" && event.teamOrSeries === "UCI World Tour"
      },
      result: getCanonicalCyclingEvents()
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
