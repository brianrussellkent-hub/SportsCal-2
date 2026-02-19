export type Sport = "Basketball" | "Soccer" | "Baseball" | "Tennis";

export type SportsEvent = {
  id: string;
  title: string;
  sport: Sport;
  location: string;
  startTimeIso: string;
};

export const sportsEvents: SportsEvent[] = [
  {
    id: "evt-1",
    title: "City Hawks vs River Kings",
    sport: "Basketball",
    location: "Metro Arena",
    startTimeIso: "2026-03-11T19:30:00Z"
  },
  {
    id: "evt-2",
    title: "United FC vs Northside",
    sport: "Soccer",
    location: "Harbor Stadium",
    startTimeIso: "2026-03-12T18:00:00Z"
  },
  {
    id: "evt-3",
    title: "Blue Sox vs Gold Caps",
    sport: "Baseball",
    location: "Summit Field",
    startTimeIso: "2026-03-14T00:15:00Z"
  },
  {
    id: "evt-4",
    title: "Open Court Finals",
    sport: "Tennis",
    location: "West Garden Club",
    startTimeIso: "2026-03-15T16:00:00Z"
  },
  {
    id: "evt-5",
    title: "Downtown Derby",
    sport: "Soccer",
    location: "Unity Park",
    startTimeIso: "2026-03-16T20:00:00Z"
  }
];
