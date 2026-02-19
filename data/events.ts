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
  restAfterStages: number[];
};

function atNoonUtc(dateIso: string): string {
  return `${dateIso}T12:00:00Z`;
}

function createGrandTourStages(config: StageRaceConfig): SportsEvent[] {
  const stages: SportsEvent[] = [];
  const restSet = new Set(config.restAfterStages);
  const dayCursor = new Date(`${config.firstStageDateIso}T00:00:00Z`);

  for (let stage = 1; stage <= config.stageCount; stage += 1) {
    const y = dayCursor.getUTCFullYear();
    const m = `${dayCursor.getUTCMonth() + 1}`.padStart(2, "0");
    const d = `${dayCursor.getUTCDate()}`.padStart(2, "0");
    const dateIso = `${y}-${m}-${d}`;

    stages.push({
      id: `${config.raceIdPrefix}-stage-${stage}`,
      title: `${config.raceName} - Stage ${stage}`,
      category: "Cycling",
      teamOrSeries: "UCI World Tour",
      location: config.location,
      startTimeIso: atNoonUtc(dateIso),
      source: "UCI WorldTour / race organizer calendar",
      isTimeTbd: true
    });

    dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    if (restSet.has(stage)) {
      dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    }
  }

  return stages;
}

const uciOneDayAndShortStageEvents2026: SportsEvent[] = [
  ["2026-01-20", "Santos Tour Down Under", "Adelaide, Australia"],
  ["2026-01-25", "Cadel Evans Great Ocean Road Race", "Geelong, Australia"],
  ["2026-02-16", "UAE Tour", "United Arab Emirates"],
  ["2026-03-07", "Strade Bianche", "Siena, Italy"],
  ["2026-03-08", "Paris-Nice", "France"],
  ["2026-03-09", "Tirreno-Adriatico", "Italy"],
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
  ["2026-06-07", "Critérium du Dauphiné", "France"],
  ["2026-06-14", "Tour de Suisse", "Switzerland"],
  ["2026-08-01", "Donostia San Sebastian Klasikoa", "Spain"],
  ["2026-08-03", "Tour de Pologne", "Poland"],
  ["2026-08-16", "BEMER Cyclassics", "Hamburg, Germany"],
  ["2026-08-19", "Renewi Tour", "Belgium / Netherlands"],
  ["2026-09-11", "Grand Prix Cycliste de Quebec", "Quebec, Canada"],
  ["2026-09-13", "Grand Prix Cycliste de Montreal", "Montreal, Canada"],
  ["2026-10-10", "Il Lombardia", "Italy"],
  ["2026-10-13", "Gree-Tour of Guangxi", "China"]
].map((race, index) => ({
  id: `uci-2026-race-${index + 1}`,
  title: race[1],
  category: "Cycling" as const,
  teamOrSeries: "UCI World Tour",
  location: race[2],
  startTimeIso: atNoonUtc(race[0]),
  source: "UCI WorldTour / race organizer calendar",
  isTimeTbd: true
}));

const uciGrandTourStages2026: SportsEvent[] = [
  ...createGrandTourStages({
    raceIdPrefix: "giro-2026",
    raceName: "Giro d'Italia",
    location: "Italy",
    firstStageDateIso: "2026-05-09",
    stageCount: 21,
    restAfterStages: [9, 15]
  }),
  ...createGrandTourStages({
    raceIdPrefix: "tdf-2026",
    raceName: "Tour de France",
    location: "France",
    firstStageDateIso: "2026-07-04",
    stageCount: 21,
    restAfterStages: [9, 15]
  }),
  ...createGrandTourStages({
    raceIdPrefix: "vuelta-2026",
    raceName: "La Vuelta a Espana",
    location: "Spain",
    firstStageDateIso: "2026-08-22",
    stageCount: 21,
    restAfterStages: [9, 15]
  })
];

const motorsport2026: SportsEvent[] = [
  ["f1-1", "2026-03-08", "Formula 1 Australian Grand Prix", "Melbourne"],
  ["f1-2", "2026-03-22", "Formula 1 Chinese Grand Prix", "Shanghai"],
  ["f1-3", "2026-04-05", "Formula 1 Japanese Grand Prix", "Suzuka"],
  ["f1-4", "2026-05-03", "Formula 1 Miami Grand Prix", "Miami"],
  ["f1-5", "2026-05-24", "Formula 1 Monaco Grand Prix", "Monaco"],
  ["f1-6", "2026-06-14", "Formula 1 Canadian Grand Prix", "Montreal"],
  ["f1-7", "2026-07-05", "Formula 1 British Grand Prix", "Silverstone"],
  ["f1-8", "2026-09-13", "Formula 1 Italian Grand Prix", "Monza"],
  ["f1-9", "2026-10-18", "Formula 1 United States Grand Prix", "Austin"],
  ["f1-10", "2026-11-22", "Formula 1 Las Vegas Grand Prix", "Las Vegas"],
  ["f1-11", "2026-12-06", "Formula 1 Abu Dhabi Grand Prix", "Yas Marina"],
  ["nas-1", "2026-02-15", "DAYTONA 500", "Daytona"],
  ["nas-2", "2026-03-15", "NASCAR Cup at Las Vegas", "Las Vegas"],
  ["nas-3", "2026-04-12", "NASCAR Cup at Bristol", "Bristol"],
  ["nas-4", "2026-05-24", "Coca-Cola 600", "Charlotte"],
  ["nas-5", "2026-07-05", "NASCAR Chicago Street Race", "Chicago"],
  ["nas-6", "2026-09-06", "NASCAR Playoffs: Darlington", "Darlington"],
  ["nas-7", "2026-11-08", "NASCAR Championship Race", "Phoenix"]
].map((event) => ({
  id: event[0],
  title: event[2],
  category: event[0].startsWith("f1") ? ("Formula 1" as const) : ("NASCAR" as const),
  teamOrSeries: event[0].startsWith("f1") ? "F1 World Championship" : "NASCAR Cup Series",
  location: event[3],
  startTimeIso: atNoonUtc(event[1]),
  isTimeTbd: true
}));

const nyTeams2026: SportsEvent[] = [
  ["mets-1", "2026-03-30", "NY Mets vs Nationals", "Citi Field", "MLB", "NY Mets"],
  ["mets-2", "2026-04-10", "NY Mets vs Marlins", "Citi Field", "MLB", "NY Mets"],
  ["mets-3", "2026-05-22", "NY Mets vs Braves", "Citi Field", "MLB", "NY Mets"],
  ["mets-4", "2026-06-18", "NY Mets vs Phillies", "Citi Field", "MLB", "NY Mets"],
  ["mets-5", "2026-07-04", "NY Mets vs Yankees", "Citi Field", "MLB", "NY Mets"],
  ["mets-6", "2026-08-16", "NY Mets vs Dodgers", "Citi Field", "MLB", "NY Mets"],
  ["mets-7", "2026-09-20", "NY Mets vs Braves", "Citi Field", "MLB", "NY Mets"],
  ["giants-1", "2026-09-13", "NY Giants vs Cowboys", "MetLife Stadium", "NFL", "NY Giants"],
  ["giants-2", "2026-09-20", "NY Giants vs Eagles", "MetLife Stadium", "NFL", "NY Giants"],
  ["giants-3", "2026-10-11", "NY Giants vs Commanders", "MetLife Stadium", "NFL", "NY Giants"],
  ["giants-4", "2026-11-01", "NY Giants vs Packers", "MetLife Stadium", "NFL", "NY Giants"],
  ["giants-5", "2026-12-13", "NY Giants vs Patriots", "MetLife Stadium", "NFL", "NY Giants"]
].map((event) => ({
  id: event[0],
  startTimeIso: atNoonUtc(event[1]),
  title: event[2],
  location: event[3],
  category: event[4] as EventCategory,
  teamOrSeries: event[5],
  isTimeTbd: true
}));

export const sportsEvents: SportsEvent[] = [
  ...nyTeams2026,
  ...uciOneDayAndShortStageEvents2026,
  ...uciGrandTourStages2026,
  ...motorsport2026
].sort((a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime());
