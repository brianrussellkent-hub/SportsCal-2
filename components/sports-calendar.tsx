"use client";

import { useMemo, useState } from "react";
import type { Sport, SportsEvent } from "@/data/events";

type SportsCalendarProps = {
  events: SportsEvent[];
};

const allSportsOption = "All sports" as const;

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function SportsCalendar({ events }: SportsCalendarProps) {
  const [selectedSport, setSelectedSport] = useState<typeof allSportsOption | Sport>(
    allSportsOption
  );

  const sports = useMemo(() => {
    return Array.from(new Set(events.map((event) => event.sport))).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) =>
        selectedSport === allSportsOption ? true : event.sport === selectedSport
      )
      .sort(
        (a, b) =>
          new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime()
      );
  }, [events, selectedSport]);

  return (
    <main className="container">
      <header className="hero">
        <h1>SportsCal</h1>
        <p>Track upcoming games in one clean, deploy-ready calendar.</p>
      </header>

      <section className="controls">
        <label htmlFor="sport-select">Filter by sport</label>
        <select
          id="sport-select"
          value={selectedSport}
          onChange={(event) =>
            setSelectedSport(event.target.value as typeof allSportsOption | Sport)
          }
        >
          <option value={allSportsOption}>{allSportsOption}</option>
          {sports.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
      </section>

      <section>
        <ul className="eventList">
          {filteredEvents.map((event) => (
            <li key={event.id} className="eventCard">
              <div className="eventTop">
                <span className="sportBadge">{event.sport}</span>
                <time dateTime={event.startTimeIso}>
                  {formatDateTime(event.startTimeIso)}
                </time>
              </div>
              <h2>{event.title}</h2>
              <p>{event.location}</p>
            </li>
          ))}
        </ul>
        {filteredEvents.length === 0 && (
          <p className="emptyState">No events found for this sport.</p>
        )}
      </section>
    </main>
  );
}
