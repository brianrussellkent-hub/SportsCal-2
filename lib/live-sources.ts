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

function withSequentialIds(events: SportsEvent[], prefix: string): SportsEvent[] {
  return [...events]
    .sort((a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime())
    .map((event, index) => ({ ...event, id: `${prefix}-${index + 1}` }));
}


type JsonFetchResult<T> = {
  ok: boolean;
  statusCode?: number;
  data?: T;
};

type TextFetchResult = {
  ok: boolean;
  statusCode?: number;
  data?: string;
};

type MediaWikiParseResponse = {
  parse?: {
    text?: string | { "*": string };
    wikitext?: string | { "*": string };
  };
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

async function fetchTextNoStore(url: string): Promise<TextFetchResult> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; SportsCalBot/2.0; +https://sportscal.app)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.7"
      }
    });
    if (!res.ok) return { ok: false, statusCode: res.status };
    return { ok: true, statusCode: res.status, data: await res.text() };
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
    const stableEvents = withSequentialIds(events, "giants");
    return {
      events: stableEvents,
      status: `ESPN NFL team schedule: loaded ${stableEvents.length} Giants games`,
      ok: true
    };
  }

  const weeklyScoreboardEvents = await fetchGiantsFromWeeklyScoreboard();
  if (weeklyScoreboardEvents.length > 0) {
    const stableEvents = withSequentialIds(weeklyScoreboardEvents, "giants");
    return {
      events: stableEvents,
      status: `ESPN NFL weekly scoreboard fallback: loaded ${stableEvents.length} Giants games`,
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
      const stableEvents = withSequentialIds(espnEvents, "f1");
      return {
        events: stableEvents,
        status: `ESPN F1: loaded ${stableEvents.length} races`,
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
        id: `f1-${round}`,
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

function sanitizeRaceSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function monthNumber(monthLabel: string): string | null {
  const months: Record<string, string> = {
    january: "01",
    jan: "01",
    february: "02",
    feb: "02",
    march: "03",
    mar: "03",
    april: "04",
    apr: "04",
    may: "05",
    june: "06",
    jun: "06",
    july: "07",
    jul: "07",
    august: "08",
    aug: "08",
    september: "09",
    sep: "09",
    sept: "09",
    october: "10",
    oct: "10",
    november: "11",
    nov: "11",
    december: "12"
    ,
    dec: "12"
  };

  return months[monthLabel.toLowerCase()] ?? null;
}

function normalizeCalendarDate(dateLabel: string, year: string): string | null {
  const compact = dateLabel.replace(/\s+/g, " ").trim();
  const match = compact.match(/(\d{1,2})(?:\s*[–-]\s*\d{1,2})?\s+([A-Za-z]+)/);
  if (!match) return null;

  const month = monthNumber(match[2]);
  if (!month) return null;

  return `${year}-${month}-${match[1].padStart(2, "0")}`;
}

function normalizeFlexibleCyclingDate(dateLabel: string, year: string): string | null {
  const compact = dateLabel.replace(/\s+/g, " ").trim();

  const isoMatch =
    compact.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/) ??
    compact.match(/\b(20\d{2})\/(\d{2})\/(\d{2})\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const dottedMatch = compact.match(/\b(\d{2})\.(\d{2})\.(20\d{2})\b/);
  if (dottedMatch) return `${dottedMatch[3]}-${dottedMatch[2]}-${dottedMatch[1]}`;

  const monthTextMatch = compact.match(/(\d{1,2})(?:\s*[–-]\s*\d{1,2})?\s+([A-Za-z]{3,9})/);
  if (monthTextMatch) {
    const month = monthNumber(monthTextMatch[2]);
    if (!month) return null;
    return `${year}-${month}-${monthTextMatch[1].padStart(2, "0")}`;
  }

  return null;
}

function toUtcDay(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00Z`);
}

function shiftIsoDateByDays(dateIso: string, deltaDays: number): string {
  const date = new Date(dateIso);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString();
}

function cyclingRaceBaseName(title: string): string {
  return title.replace(/\s+-\s+Stage\s+\d+$/i, "").trim();
}

function reconcileCyclingWithCanonical(liveRaceEvents: SportsEvent[], canonicalEvents: SportsEvent[]): SportsEvent[] {
  const groupedCanonical = new Map<string, SportsEvent[]>();
  for (const event of canonicalEvents) {
    const key = sanitizeRaceSlug(cyclingRaceBaseName(event.title));
    const bucket = groupedCanonical.get(key) ?? [];
    bucket.push(event);
    groupedCanonical.set(key, bucket);
  }

  for (const bucket of groupedCanonical.values()) {
    bucket.sort((a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime());
  }

  const updated = canonicalEvents.map((event) => ({ ...event }));
  const updatedById = new Map(updated.map((event) => [event.id, event]));

  for (const liveEvent of liveRaceEvents) {
    const key = sanitizeRaceSlug(cyclingRaceBaseName(liveEvent.title));
    const canonicalRaceEvents = groupedCanonical.get(key);
    if (!canonicalRaceEvents || canonicalRaceEvents.length === 0) continue;

    const canonicalStart = toUtcDay(canonicalRaceEvents[0].startTimeIso.slice(0, 10));
    const liveStart = toUtcDay(liveEvent.startTimeIso.slice(0, 10));
    const deltaDays = Math.round((liveStart.getTime() - canonicalStart.getTime()) / (1000 * 60 * 60 * 24));

    for (const canonicalEvent of canonicalRaceEvents) {
      const toUpdate = updatedById.get(canonicalEvent.id);
      if (!toUpdate) continue;
      toUpdate.startTimeIso = shiftIsoDateByDays(canonicalEvent.startTimeIso, deltaDays);
      toUpdate.source = liveEvent.source ?? toUpdate.source;
    }
  }

  return dedupe(updated);
}

function parseCyclingRowsFromWikipediaHtml(html: string, year: string): SportsEvent[] {
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const events: SportsEvent[] = [];
  const seenIds = new Set<string>();

  for (const row of rows) {
    const tdMatches = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
    if (tdMatches.length < 2) continue;

    const cellText = tdMatches
      .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (cellText.length < 2) continue;

    const dateCandidate = cellText.find((text) => /\d{1,2}(?:\s*[–-]\s*\d{1,2})?\s+[A-Za-z]{3,}/.test(text));
    if (!dateCandidate) continue;

    const raceCandidate = cellText.find(
      (text) =>
        !/\d{1,2}(?:\s*[–-]\s*\d{1,2})?\s+[A-Za-z]{3,}/.test(text) &&
        !/^(class|category|country|distance)$/i.test(text) &&
        text.length > 3
    );
    if (!raceCandidate) continue;

    const startDate = normalizeCalendarDate(dateCandidate, year);
    if (!startDate) continue;

    const raceName = raceCandidate;
    if (!raceName || /^date$/i.test(raceName) || /^class$/i.test(raceName)) continue;

    const id = `uci-live-${startDate}-${sanitizeRaceSlug(raceName)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    events.push({
      id,
      title: raceName,
      category: "Cycling",
      teamOrSeries: "UCI World Tour",
      location: "TBD",
      startTimeIso: `${startDate}T12:00:00Z`,
      source: "Wikipedia UCI World Tour calendar",
      isTimeTbd: true
    });
  }

  return events;
}

function parseCyclingRowsFromWikipediaWikitext(wikitext: string, year: string): SportsEvent[] {
  const rowBlocks = wikitext.split(/\n\|-\n/g);
  const events: SportsEvent[] = [];
  const seenIds = new Set<string>();

  for (const block of rowBlocks) {
    const compact = block.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    if (!compact.startsWith("|")) continue;

    const columns = compact
      .replace(/^\|\s*/, "")
      .split(/\s*\|\|\s*/)
      .map((column) =>
        column
          .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
          .replace(/\[\[([^\]]+)\]\]/g, "$1")
          .replace(/\{\{.*?\}\}/g, "")
          .replace(/''/g, "")
          .replace(/<[^>]+>/g, "")
          .trim()
      )
      .filter(Boolean);
    if (columns.length < 2) continue;

    const dateCandidate = columns.find((column) => /\d{1,2}(?:\s*[–-]\s*\d{1,2})?\s+[A-Za-z]{3,}/.test(column));
    if (!dateCandidate) continue;

    const raceName =
      columns.find(
        (column) =>
          !/\d{1,2}(?:\s*[–-]\s*\d{1,2})?\s+[A-Za-z]{3,}/.test(column) &&
          !/^\d+$/.test(column) &&
          column.length > 3
      ) ?? "";
    const startDate = normalizeCalendarDate(dateCandidate, year);
    if (!raceName || !startDate) continue;

    const id = `uci-live-${startDate}-${sanitizeRaceSlug(raceName)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    events.push({
      id,
      title: raceName,
      category: "Cycling",
      teamOrSeries: "UCI World Tour",
      location: "TBD",
      startTimeIso: `${startDate}T12:00:00Z`,
      source: "Wikipedia UCI World Tour calendar",
      isTimeTbd: true
    });
  }

  return events;
}

function unwrapMediaWikiField(field?: string | { "*": string }): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field["*"] ?? "";
}

function parseCyclingRowsFromHtml(html: string): SportsEvent[] {
  const rows = html.split(/<\/tr>/i);
  const events: SportsEvent[] = [];
  const seenIds = new Set<string>();
  const year = "2026";

  for (const row of rows) {
    const rowText = row.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const normalizedDate = normalizeFlexibleCyclingDate(rowText, year);
    if (!normalizedDate) continue;

    const raceMatch =
      row.match(/<a[^>]+href="\/race\/[^"]+"[^>]*>([^<]+)<\/a>/i) ??
      row.match(/<a[^>]*>([^<]{5,})<\/a>/i);
    if (!raceMatch) continue;

    const raceName = raceMatch[1].replace(/\s+/g, " ").trim();
    const locationMatch = row.match(/<td[^>]*class="[^"]*nation[^"]*"[^>]*>(.*?)<\/td>/i);
    const location = locationMatch?.[1]?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || "TBD";

    const id = `uci-live-${normalizedDate}-${sanitizeRaceSlug(raceName)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    events.push({
      id,
      title: raceName,
      category: "Cycling",
      teamOrSeries: "UCI World Tour",
      location,
      startTimeIso: `${normalizedDate}T12:00:00Z`,
      source: "ProCyclingStats calendar",
      isTimeTbd: true
    });
  }

  return events;
}

async function fetchCyclingFromSources(): Promise<AdapterResult> {
  const year = "2026";
  const failures: string[] = [];
  const canonicalCycling = getCanonicalCyclingEvents();
  const wikiUrl =
    `https://en.wikipedia.org/w/api.php?action=parse&page=${year}_UCI_World_Tour` +
    "&prop=text|wikitext&format=json";
  const wikiResponse = await fetchJsonNoStore<MediaWikiParseResponse>(wikiUrl);

  if (wikiResponse.ok && wikiResponse.data?.parse) {
    const wikiHtml = unwrapMediaWikiField(wikiResponse.data.parse.text);
    const wikiWikitext = unwrapMediaWikiField(wikiResponse.data.parse.wikitext);
    const wikiEvents = dedupe([
      ...parseCyclingRowsFromWikipediaHtml(wikiHtml, year),
      ...parseCyclingRowsFromWikipediaWikitext(wikiWikitext, year)
    ]).filter(
      (event) => event.category === "Cycling" && event.teamOrSeries === "UCI World Tour"
    );

    if (wikiEvents.length > 0) {
      const reconciled = reconcileCyclingWithCanonical(wikiEvents, canonicalCycling.events);
      return {
        events: reconciled,
        status: `Wikipedia UCI World Tour: loaded ${wikiEvents.length} races and reconciled canonical cycling schedule`,
        ok: true
      };
    }
    failures.push("Wikipedia returned no parseable races");
  } else {
    failures.push(`Wikipedia${wikiResponse.statusCode ? ` ${wikiResponse.statusCode}` : " unavailable"}`);
  }

  const candidates = [
    `https://www.procyclingstats.com/races.php?year=${year}&circuit=1&class=1&type=stageraces`,
    `https://www.procyclingstats.com/races.php?year=${year}&circuit=1&class=1&type=onedayraces`,
    `https://www.procyclingstats.com/races.php?year=${year}&circuit=1&class=1`
  ];

  const events: SportsEvent[] = [];
  for (const url of candidates) {
    const response = await fetchTextNoStore(url);
    if (!response.ok || !response.data) {
      failures.push(`${url}${response.statusCode ? ` ${response.statusCode}` : ""}`.trim());
      continue;
    }
    const parsed = parseCyclingRowsFromHtml(response.data);
    if (parsed.length === 0) {
      failures.push(`${url} parse-empty`);
      continue;
    }
    events.push(...parsed);
  }

  const deduped = dedupe(events).filter(
    (event) => event.category === "Cycling" && event.teamOrSeries === "UCI World Tour"
  );

  if (deduped.length > 0) {
    const reconciled = reconcileCyclingWithCanonical(deduped, canonicalCycling.events);
    return {
      events: reconciled,
      status: `ProCyclingStats: loaded ${deduped.length} races and reconciled canonical cycling schedule`,
      ok: true
    };
  }

  const fallback = canonicalCycling;
  return {
    events: fallback.events,
    status:
      failures.length > 0
        ? `Cycling live sources unavailable (${failures.join(", ")}); keeping bundled WorldTour schedule (${fallback.events.length} events)`
        : `Cycling live sources returned no parseable races; keeping bundled WorldTour schedule (${fallback.events.length} events)`,
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
      result: await fetchCyclingFromSources()
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
