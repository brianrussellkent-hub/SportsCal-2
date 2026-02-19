"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventCategory, SportsEvent } from "@/data/events";

type SportsCalendarProps = {
  events: SportsEvent[];
};

const TZ = "America/New_York";
const allCategoriesOption = "All categories" as const;
const allSeriesOption = "All teams/series" as const;

function formatDateTimeInEst(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(iso));
}

function getCurrentEstDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function SportsCalendar({ events }: SportsCalendarProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    typeof allCategoriesOption | EventCategory
  >(allCategoriesOption);
  const [selectedSeries, setSelectedSeries] = useState<typeof allSeriesOption | string>(
    allSeriesOption
  );
  const [estDateKey, setEstDateKey] = useState<string>(() => getCurrentEstDateKey());

  useEffect(() => {
    const timer = setInterval(() => {
      const current = getCurrentEstDateKey();
      setEstDateKey((previous) => {
        if (previous !== current) {
          setSelectedCategory(allCategoriesOption);
          setSelectedSeries(allSeriesOption);
          return current;
        }
        return previous;
      });
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(events.map((event) => event.category))).sort();
  }, [events]);

  const seriesList = useMemo(() => {
    return Array.from(new Set(events.map((event) => event.teamOrSeries))).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) =>
        selectedCategory === allCategoriesOption
          ? true
          : event.category === selectedCategory
      )
      .filter((event) =>
        selectedSeries === allSeriesOption ? true : event.teamOrSeries === selectedSeries
      )
      .sort(
        (a, b) =>
          new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime()
      );
  }, [events, selectedCategory, selectedSeries]);

  return (
    <main className="container">
      <header className="hero">
        <h1>SportsCal</h1>
        <p>
          NY Mets, NY Giants, UCI World Tour, Formula 1, and NASCAR schedule tracker.
        </p>
        <small>All times shown in Eastern Time (ET).</small>
      </header>

      <section className="controls">
        <label htmlFor="category-select">Category</label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={(event) =>
            setSelectedCategory(event.target.value as typeof allCategoriesOption | EventCategory)
          }
        >
          <option value={allCategoriesOption}>{allCategoriesOption}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label htmlFor="series-select">Team / Series</label>
        <select
          id="series-select"
          value={selectedSeries}
          onChange={(event) => setSelectedSeries(event.target.value)}
        >
          <option value={allSeriesOption}>{allSeriesOption}</option>
          {seriesList.map((series) => (
            <option key={series} value={series}>
              {series}
            </option>
          ))}
        </select>
      </section>

      <section>
        <ul className="eventList">
          {filteredEvents.map((event) => (
            <li key={event.id} className="eventCard">
              <div className="eventTop">
                <span className="sportBadge">{event.category}</span>
                <time dateTime={event.startTimeIso}>{formatDateTimeInEst(event.startTimeIso)}</time>
              </div>
              <h2>{event.title}</h2>
              <p>{event.location}</p>
              <small>{event.teamOrSeries}</small>
            </li>
          ))}
        </ul>
        {filteredEvents.length === 0 && (
          <p className="emptyState">No events match your current filters.</p>
        )}
      </section>

      <footer className="footnote">
        Calendar state auto-resets daily (ET) for schedule updates. Date key: {estDateKey}
      </footer>
    </main>
  );
}
