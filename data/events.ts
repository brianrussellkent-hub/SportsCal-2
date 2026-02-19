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
  isTimeTbd?: boolean;
};

type StageRaceConfig = {
  raceIdPrefix: string;
  raceName: string;
  location: string;
  firstStageDateIso: string;
  stageCount: number;
  restAfterStages?: number[];
};

function atNoonUtc(dateIso: string): string {
  return `${dateIso}T12:00:00Z`;
}

function createStageRaceStages(config: StageRaceConfig): SportsEvent[] {
  const stages: SportsEvent[] = [];
  const restSet = new Set(config.restAfterStages ?? []);
  const dayCursor = new Date(`${config.firstStageDateIso}T00:00:00Z`);

  for (let stage = 1; stage <= config.stageCount; stage += 1) {
    const y = dayCursor.getUTCFullYear();
    const m = `${dayCursor.getUTCMonth() + 1}`.padStart(2, "0");
    const d = `${dayCursor.getUTCDate()}`.padStart(2, "0");

    stages.push({
      id: `${config.raceIdPrefix}-stage-${stage}`,
      title: `${config.raceName} - Stage ${stage}`,
      category: "Cycling",
      teamOrSeries: "UCI World Tour",
      location: config.location,
      startTimeIso: atNoonUtc(`${y}-${m}-${d}`),
      source: "UCI WorldTour / race organizer calendar",
      isTimeTbd: true
    });

    dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    if (restSet.has(stage)) dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
  }

  return stages;
}

const uciOneDayEvents2026: SportsEvent[] = [
  ["2026-01-25", "Cadel Evans Great Ocean Road Race", "Geelong, Australia"],
  ["2026-03-07", "Strade Bianche", "Siena, Italy"],
  ["2026-03-21", "Milano-Sanremo", "Italy"],
  ["2026-03-25", "Classic Brugge-De Panne", "Belgium"],
  ["2026-03-27", "E3 Saxo Classic", "Belgium"],
  ["2026-03-29", "Gent-Wevelgem", "Belgium"],
  ["2026-04-01", "Dwars door Vlaanderen", "Belgium"],
  ["2026-04-05", "Tour of Flanders", "Belgium"],
  ["2026-04-12", "Paris-Roubaix", "France"],
  ["2026-04-19", "Amstel Gold Race", "Netherlands"],
  ["2026-04-22", "La Fleche Wallonne", "Belgium"],
  ["2026-04-26", "Liege-Bastogne-Liege", "Belgium"],
  ["2026-05-01", "Eschborn-Frankfurt", "Germany"],
  ["2026-08-01", "Donostia San Sebastian Klasikoa", "Spain"],
  ["2026-08-16", "BEMER Cyclassics", "Hamburg, Germany"],
  ["2026-09-11", "Grand Prix Cycliste de Quebec", "Quebec, Canada"],
  ["2026-09-13", "Grand Prix Cycliste de Montreal", "Montreal, Canada"],
  ["2026-10-10", "Il Lombardia", "Italy"]
].map((race, index) => ({
  id: `uci-2026-one-day-${index + 1}`,
  title: race[1],
  category: "Cycling" as const,
  teamOrSeries: "UCI World Tour",
  location: race[2],
  startTimeIso: atNoonUtc(race[0]),
  source: "UCI WorldTour / race organizer calendar",
  isTimeTbd: true
}));

const uciStageRaces2026: SportsEvent[] = [
  ...createStageRaceStages({ raceIdPrefix: "tdu-2026", raceName: "Santos Tour Down Under", location: "Australia", firstStageDateIso: "2026-01-20", stageCount: 6 }),
  ...createStageRaceStages({ raceIdPrefix: "uae-2026", raceName: "UAE Tour", location: "UAE", firstStageDateIso: "2026-02-16", stageCount: 7 }),
  ...createStageRaceStages({ raceIdPrefix: "paris-nice-2026", raceName: "Paris-Nice", location: "France", firstStageDateIso: "2026-03-08", stageCount: 8 }),
  ...createStageRaceStages({ raceIdPrefix: "tirreno-2026", raceName: "Tirreno-Adriatico", location: "Italy", firstStageDateIso: "2026-03-09", stageCount: 7 }),
  ...createStageRaceStages({ raceIdPrefix: "giro-2026", raceName: "Giro d'Italia", location: "Italy", firstStageDateIso: "2026-05-09", stageCount: 21, restAfterStages: [9, 15] }),
  ...createStageRaceStages({ raceIdPrefix: "dauphine-2026", raceName: "Criterium du Dauphine", location: "France", firstStageDateIso: "2026-06-07", stageCount: 8 }),
  ...createStageRaceStages({ raceIdPrefix: "suisse-2026", raceName: "Tour de Suisse", location: "Switzerland", firstStageDateIso: "2026-06-14", stageCount: 8 }),
  ...createStageRaceStages({ raceIdPrefix: "tdf-2026", raceName: "Tour de France", location: "France", firstStageDateIso: "2026-07-04", stageCount: 21, restAfterStages: [9, 15] }),
  ...createStageRaceStages({ raceIdPrefix: "pologne-2026", raceName: "Tour de Pologne", location: "Poland", firstStageDateIso: "2026-08-03", stageCount: 7 }),
  ...createStageRaceStages({ raceIdPrefix: "renewi-2026", raceName: "Renewi Tour", location: "Belgium / Netherlands", firstStageDateIso: "2026-08-19", stageCount: 5 }),
  ...createStageRaceStages({ raceIdPrefix: "vuelta-2026", raceName: "La Vuelta a Espana", location: "Spain", firstStageDateIso: "2026-08-22", stageCount: 21, restAfterStages: [9, 15] }),
  ...createStageRaceStages({ raceIdPrefix: "guangxi-2026", raceName: "Gree-Tour of Guangxi", location: "China", firstStageDateIso: "2026-10-13", stageCount: 6 })
];

const motorsport2026: SportsEvent[] = [
  ["f1-1", "2026-03-08T04:00:00Z", "Formula 1 Australian Grand Prix", "Melbourne"],
  ["f1-2", "2026-03-22T07:00:00Z", "Formula 1 Chinese Grand Prix", "Shanghai"],
  ["f1-3", "2026-04-05T05:00:00Z", "Formula 1 Japanese Grand Prix", "Suzuka"],
  ["f1-4", "2026-05-03T20:00:00Z", "Formula 1 Miami Grand Prix", "Miami"],
  ["f1-5", "2026-05-24T13:00:00Z", "Formula 1 Monaco Grand Prix", "Monaco"],
  ["f1-6", "2026-06-14T18:00:00Z", "Formula 1 Canadian Grand Prix", "Montreal"],
  ["f1-7", "2026-07-05T14:00:00Z", "Formula 1 British Grand Prix", "Silverstone"],
  ["f1-8", "2026-09-13T13:00:00Z", "Formula 1 Italian Grand Prix", "Monza"],
  ["f1-9", "2026-10-18T19:00:00Z", "Formula 1 United States Grand Prix", "Austin"],
  ["f1-10", "2026-11-22T04:00:00Z", "Formula 1 Las Vegas Grand Prix", "Las Vegas"],
  ["f1-11", "2026-12-06T13:00:00Z", "Formula 1 Abu Dhabi Grand Prix", "Yas Marina"],
  ["nas-1", "2026-02-15T19:30:00Z", "DAYTONA 500", "Daytona"],
  ["nas-2", "2026-03-15T19:30:00Z", "NASCAR Cup at Las Vegas", "Las Vegas"],
  ["nas-3", "2026-04-12T23:00:00Z", "NASCAR Cup at Bristol", "Bristol"],
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

const nyGiantsFallback2026: SportsEvent[] = [
  ["giants-1", "2026-09-13T17:00:00Z", "Dallas Cowboys at NY Giants", "MetLife Stadium"],
  ["giants-2", "2026-09-20T20:25:00Z", "NY Giants at Philadelphia Eagles", "Lincoln Financial Field"],
  ["giants-3", "2026-09-27T17:00:00Z", "Washington Commanders at NY Giants", "MetLife Stadium"],
  ["giants-4", "2026-10-04T17:00:00Z", "NY Giants at Chicago Bears", "Soldier Field"],
  ["giants-5", "2026-10-11T17:00:00Z", "Green Bay Packers at NY Giants", "MetLife Stadium"],
  ["giants-6", "2026-10-18T20:05:00Z", "NY Giants at Detroit Lions", "Ford Field"],
  ["giants-7", "2026-10-25T17:00:00Z", "San Francisco 49ers at NY Giants", "MetLife Stadium"],
  ["giants-8", "2026-11-01T18:00:00Z", "NY Giants at New England Patriots", "Gillette Stadium"],
  ["giants-9", "2026-11-08T18:00:00Z", "Minnesota Vikings at NY Giants", "MetLife Stadium"],
  ["giants-10", "2026-11-15T18:00:00Z", "NY Giants at Buffalo Bills", "Highmark Stadium"],
  ["giants-11", "2026-11-22T18:00:00Z", "Las Vegas Raiders at NY Giants", "MetLife Stadium"],
  ["giants-12", "2026-11-26T21:30:00Z", "NY Giants at Dallas Cowboys", "AT&T Stadium"],
  ["giants-13", "2026-12-06T18:00:00Z", "Philadelphia Eagles at NY Giants", "MetLife Stadium"],
  ["giants-14", "2026-12-13T18:00:00Z", "NY Giants at Washington Commanders", "Northwest Stadium"],
  ["giants-15", "2026-12-20T18:00:00Z", "Seattle Seahawks at NY Giants", "MetLife Stadium"],
  ["giants-16", "2026-12-27T18:00:00Z", "NY Giants at Miami Dolphins", "Hard Rock Stadium"],
  ["giants-17", "2027-01-03T18:00:00Z", "NY Giants at Dallas Cowboys", "AT&T Stadium"]
].map((event) => ({
  id: event[0],
  startTimeIso: event[1],
  title: event[2],
  location: event[3],
  category: "NFL" as const,
  teamOrSeries: "NY Giants"
}));

const nyMetsFallbackSubset2026: SportsEvent[] = [
  ["mets-fallback-1", "2026-03-30T20:10:00Z", "NY Mets vs Nationals", "Citi Field"],
  ["mets-fallback-2", "2026-04-10T23:10:00Z", "NY Mets vs Marlins", "Citi Field"],
  ["mets-fallback-3", "2026-05-22T23:10:00Z", "NY Mets vs Braves", "Citi Field"],
  ["mets-fallback-4", "2026-06-18T17:10:00Z", "NY Mets vs Phillies", "Citi Field"],
  ["mets-fallback-5", "2026-07-04T17:10:00Z", "NY Mets vs Yankees", "Citi Field"],
  ["mets-fallback-6", "2026-08-16T17:40:00Z", "NY Mets vs Braves", "Citi Field"],
  ["mets-fallback-7", "2026-09-20T17:40:00Z", "NY Mets vs Braves", "Citi Field"]
].map((event) => ({
  id: event[0],
  startTimeIso: event[1],
  title: event[2],
  location: event[3],
  category: "MLB" as const,
  teamOrSeries: "NY Mets"
}));

export const sportsEvents: SportsEvent[] = [
  ...nyMetsFallbackSubset2026,
  ...nyGiantsFallback2026,
  ...uciOneDayEvents2026,
  ...uciStageRaces2026,
  ...motorsport2026
].sort((a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime());
