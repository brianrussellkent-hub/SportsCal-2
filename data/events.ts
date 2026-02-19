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
  source?: string;
};

const uciWorldTour2026: SportsEvent[] = [
  ["2026-01-18T11:00:00Z", "Santos Tour Down Under", "Adelaide, Australia"],
  ["2026-01-25T11:00:00Z", "Cadel Evans Great Ocean Road Race", "Geelong, Australia"],
  ["2026-02-01T12:00:00Z", "UAE Tour", "Abu Dhabi, UAE"],
  ["2026-03-07T11:00:00Z", "Strade Bianche", "Siena, Italy"],
  ["2026-03-14T11:00:00Z", "Tirreno–Adriatico", "Italy"],
  ["2026-03-15T11:00:00Z", "Paris–Nice", "France"],
  ["2026-03-21T10:00:00Z", "Milano–Sanremo", "Milan to Sanremo, Italy"],
  ["2026-03-27T11:00:00Z", "E3 Saxo Classic", "Harelbeke, Belgium"],
  ["2026-03-29T10:30:00Z", "Gent–Wevelgem", "Belgium"],
  ["2026-04-01T11:00:00Z", "Dwars door Vlaanderen", "Belgium"],
  ["2026-04-05T10:00:00Z", "Tour of Flanders", "Flanders, Belgium"],
  ["2026-04-12T09:00:00Z", "Paris–Roubaix", "Compiègne to Roubaix, France"],
  ["2026-04-19T10:00:00Z", "Amstel Gold Race", "Limburg, Netherlands"],
  ["2026-04-22T11:00:00Z", "La Flèche Wallonne", "Wallonia, Belgium"],
  ["2026-04-26T10:00:00Z", "Liège–Bastogne–Liège", "Belgium"],
  ["2026-05-01T12:00:00Z", "Eschborn–Frankfurt", "Germany"],
  ["2026-05-09T11:00:00Z", "Giro d'Italia", "Italy"],
  ["2026-06-08T10:00:00Z", "Critérium du Dauphiné", "France"],
  ["2026-06-15T11:00:00Z", "Tour de Suisse", "Switzerland"],
  ["2026-07-04T10:00:00Z", "Tour de France", "France"],
  ["2026-08-01T10:00:00Z", "Donostia San Sebastián Klasikoa", "San Sebastián, Spain"],
  ["2026-08-10T10:00:00Z", "Tour de Pologne", "Poland"],
  ["2026-08-17T10:00:00Z", "BEMER Cyclassics", "Hamburg, Germany"],
  ["2026-08-23T10:00:00Z", "Renewi Tour", "Belgium / Netherlands"],
  ["2026-08-22T10:00:00Z", "La Vuelta a España", "Spain"],
  ["2026-09-13T10:00:00Z", "Grand Prix Cycliste de Québec", "Québec, Canada"],
  ["2026-09-15T10:00:00Z", "Grand Prix Cycliste de Montréal", "Montréal, Canada"],
  ["2026-09-28T10:00:00Z", "Il Lombardia", "Lombardy, Italy"],
  ["2026-10-04T10:00:00Z", "Paris–Tours (WorldTour calendar slot)", "France"],
  ["2026-10-11T10:00:00Z", "Gree–Tour of Guangxi", "Guangxi, China"],
  ["2026-10-18T10:00:00Z", "Tour of Chongming Island", "Chongming, China"],
  ["2026-10-20T10:00:00Z", "Tour of Guangxi (Finale)", "Guangxi, China"]
].map((race, index) => ({
  id: `uci-2026-${index + 1}`,
  title: race[1],
  category: "Cycling" as const,
  teamOrSeries: "UCI World Tour",
  location: race[2],
  startTimeIso: race[0],
  source: "UCI WorldTour calendar / organizer schedules"
}));

const motorsport2026: SportsEvent[] = [
  ["f1-1", "2026-03-08T04:00:00Z", "Formula 1 Australian Grand Prix", "Melbourne"],
  ["f1-2", "2026-03-22T07:00:00Z", "Formula 1 Chinese Grand Prix", "Shanghai"],
  ["f1-3", "2026-04-05T14:00:00Z", "Formula 1 Japanese Grand Prix", "Suzuka"],
  ["f1-4", "2026-05-03T19:30:00Z", "Formula 1 Miami Grand Prix", "Miami"],
  ["f1-5", "2026-05-24T13:00:00Z", "Formula 1 Monaco Grand Prix", "Monaco"],
  ["f1-6", "2026-06-14T18:00:00Z", "Formula 1 Canadian Grand Prix", "Montréal"],
  ["f1-7", "2026-07-05T14:00:00Z", "Formula 1 British Grand Prix", "Silverstone"],
  ["f1-8", "2026-09-13T19:00:00Z", "Formula 1 Italian Grand Prix", "Monza"],
  ["f1-9", "2026-10-18T19:00:00Z", "Formula 1 United States Grand Prix", "Austin"],
  ["f1-10", "2026-11-22T21:00:00Z", "Formula 1 Las Vegas Grand Prix", "Las Vegas"],
  ["f1-11", "2026-12-06T13:00:00Z", "Formula 1 Abu Dhabi Grand Prix", "Yas Marina"],
  ["nas-1", "2026-02-15T19:30:00Z", "DAYTONA 500", "Daytona"],
  ["nas-2", "2026-03-15T19:30:00Z", "NASCAR Cup at Las Vegas", "Las Vegas"],
  ["nas-3", "2026-04-12T19:30:00Z", "NASCAR Cup at Bristol", "Bristol"],
  ["nas-4", "2026-05-24T22:00:00Z", "Coca-Cola 600", "Charlotte"],
  ["nas-5", "2026-07-05T19:30:00Z", "NASCAR Chicago Street Race", "Chicago"],
  ["nas-6", "2026-09-06T23:30:00Z", "NASCAR Playoffs: Darlington", "Darlington"],
  ["nas-7", "2026-11-08T20:00:00Z", "NASCAR Championship Race", "Phoenix"]
].map((event) => ({
  id: event[0],
  title: event[2],
  category: event[0].startsWith("f1") ? ("Formula 1" as const) : ("NASCAR" as const),
  teamOrSeries: event[0].startsWith("f1") ? "F1 World Championship" : "NASCAR Cup Series",
  location: event[3],
  startTimeIso: event[1]
}));

const nyTeams2026: SportsEvent[] = [
  ["mets-1", "2026-03-30T20:10:00Z", "NY Mets vs Nationals", "Citi Field", "MLB", "NY Mets"],
  ["mets-2", "2026-04-10T23:10:00Z", "NY Mets vs Marlins", "Citi Field", "MLB", "NY Mets"],
  ["mets-3", "2026-05-22T23:10:00Z", "NY Mets vs Braves", "Citi Field", "MLB", "NY Mets"],
  ["mets-4", "2026-06-18T17:10:00Z", "NY Mets vs Phillies", "Citi Field", "MLB", "NY Mets"],
  ["mets-5", "2026-07-04T17:10:00Z", "NY Mets vs Yankees", "Citi Field", "MLB", "NY Mets"],
  ["mets-6", "2026-08-16T17:40:00Z", "NY Mets vs Dodgers", "Citi Field", "MLB", "NY Mets"],
  ["mets-7", "2026-09-20T17:40:00Z", "NY Mets vs Braves", "Citi Field", "MLB", "NY Mets"],
  ["giants-1", "2026-09-13T17:00:00Z", "NY Giants vs Cowboys", "MetLife Stadium", "NFL", "NY Giants"],
  ["giants-2", "2026-09-20T20:25:00Z", "NY Giants vs Eagles", "MetLife Stadium", "NFL", "NY Giants"],
  ["giants-3", "2026-10-11T17:00:00Z", "NY Giants vs Commanders", "MetLife Stadium", "NFL", "NY Giants"],
  ["giants-4", "2026-11-01T18:00:00Z", "NY Giants vs Packers", "MetLife Stadium", "NFL", "NY Giants"],
  ["giants-5", "2026-12-13T18:00:00Z", "NY Giants vs Patriots", "MetLife Stadium", "NFL", "NY Giants"]
].map((event) => ({
  id: event[0],
  startTimeIso: event[1],
  title: event[2],
  location: event[3],
  category: event[4] as EventCategory,
  teamOrSeries: event[5]
}));

export const sportsEvents: SportsEvent[] = [...nyTeams2026, ...uciWorldTour2026, ...motorsport2026].sort(
  (a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime()
);
