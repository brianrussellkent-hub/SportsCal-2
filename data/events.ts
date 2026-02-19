export type EventCategory =
  | "MLB"
  | "NFL"
  | "Cycling"
  | "Formula 1"
  | "NASCAR"
  | (string & {});

export type SportsEvent = {
  id: string;
  title: string;
  category: EventCategory;
  teamOrSeries: string;
  location: string;
  startTimeIso: string;
};

/**
 * Add more schedules by appending records to this array.
 * Times are stored in UTC ISO and rendered as America/New_York in the UI.
 */
export const sportsEvents: SportsEvent[] = [
  {
    id: "mets-2026-04-02",
    title: "NY Mets vs Phillies",
    category: "MLB",
    teamOrSeries: "NY Mets",
    location: "Citi Field",
    startTimeIso: "2026-04-02T23:10:00Z"
  },
  {
    id: "mets-2026-04-05",
    title: "NY Mets vs Braves",
    category: "MLB",
    teamOrSeries: "NY Mets",
    location: "Citi Field",
    startTimeIso: "2026-04-05T17:40:00Z"
  },
  {
    id: "giants-2026-09-13",
    title: "NY Giants vs Cowboys",
    category: "NFL",
    teamOrSeries: "NY Giants",
    location: "MetLife Stadium",
    startTimeIso: "2026-09-13T17:00:00Z"
  },
  {
    id: "giants-2026-09-20",
    title: "NY Giants vs Eagles",
    category: "NFL",
    teamOrSeries: "NY Giants",
    location: "MetLife Stadium",
    startTimeIso: "2026-09-20T20:25:00Z"
  },
  {
    id: "uci-2026-03-21",
    title: "Milano-Sanremo",
    category: "Cycling",
    teamOrSeries: "UCI World Tour",
    location: "Milan to Sanremo, Italy",
    startTimeIso: "2026-03-21T10:00:00Z"
  },
  {
    id: "uci-2026-04-12",
    title: "Paris-Roubaix",
    category: "Cycling",
    teamOrSeries: "UCI World Tour",
    location: "Compiègne to Roubaix, France",
    startTimeIso: "2026-04-12T09:00:00Z"
  },
  {
    id: "f1-2026-03-08",
    title: "Formula 1 Australian Grand Prix",
    category: "Formula 1",
    teamOrSeries: "F1 World Championship",
    location: "Melbourne Grand Prix Circuit",
    startTimeIso: "2026-03-08T04:00:00Z"
  },
  {
    id: "f1-2026-03-22",
    title: "Formula 1 Chinese Grand Prix",
    category: "Formula 1",
    teamOrSeries: "F1 World Championship",
    location: "Shanghai International Circuit",
    startTimeIso: "2026-03-22T07:00:00Z"
  },
  {
    id: "nascar-2026-02-15",
    title: "DAYTONA 500",
    category: "NASCAR",
    teamOrSeries: "NASCAR Cup Series",
    location: "Daytona International Speedway",
    startTimeIso: "2026-02-15T19:30:00Z"
  },
  {
    id: "nascar-2026-03-15",
    title: "NASCAR Cup at Las Vegas",
    category: "NASCAR",
    teamOrSeries: "NASCAR Cup Series",
    location: "Las Vegas Motor Speedway",
    startTimeIso: "2026-03-15T19:30:00Z"
  }
];
