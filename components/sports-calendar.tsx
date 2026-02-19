"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventCategory, SportsEvent } from "@/data/events";

type SportsCalendarProps = {
  events: SportsEvent[];
};

const TZ = "America/New_York";
const allCategoriesOption = "All categories" as const;
const allSeriesOption = "All teams/series" as const;
const year = 2026;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function formatDateTimeInEt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(iso));
}

function getDateKeyInEt(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(iso));
}

function getCurrentEtDateKey(): string {
  return getDateKeyInEt(new Date().toISOString());
}

function buildMonthDays(targetYear: number, monthIndex: number): Date[] {
  const count = new Date(targetYear, monthIndex + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => new Date(targetYear, monthIndex, i + 1));
}

function buildEtDateKeyFromLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function SportsCalendar({ events }: SportsCalendarProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    typeof allCategoriesOption | EventCategory
  >(allCategoriesOption);
  const [selectedSeries, setSelectedSeries] = useState<typeof allSeriesOption | string>(
    allSeriesOption
  );
  const [etDateKey, setEtDateKey] = useState<string>(() => getCurrentEtDateKey());

  useEffect(() => {
    const timer = setInterval(() => {
      const current = getCurrentEtDateKey();
      setEtDateKey((previous) => {
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
      );
  }, [events, selectedCategory, selectedSeries]);

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce<Record<string, SportsEvent[]>>((acc, event) => {
      const key = getDateKeyInEt(event.startTimeIso);
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      acc[key].sort(
        (a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime()
      );
      return acc;
    }, {});
  }, [filteredEvents]);

  return (
    <main className="container darkCalendar">
      <header className="hero">
        <h1>SportsCal 2026</h1>
        <p>Google/Outlook-style dark calendar for NY teams, motorsports, and UCI World Tour.</p>
        <small>All event times shown in Eastern Time (ET). Filters auto-reset daily at ET midnight.</small>
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

      <section className="yearGrid">
        {monthNames.map((monthName, monthIndex) => {
          const days = buildMonthDays(year, monthIndex);
          return (
            <article key={monthName} className="monthCard">
              <h2>{monthName}</h2>
              <div className="monthDays">
                {days.map((date) => {
                  const key = buildEtDateKeyFromLocalDate(date);
                  const dayEvents = eventsByDate[key] ?? [];
                  return (
                    <div key={key} className="dayCell">
                      <div className="dayNumber">{date.getDate()}</div>
                      <div className="dayEvents">
                        {dayEvents.map((event) => (
                          <div key={event.id} className="eventPill" title={event.location}>
                            <span className="eventTime">{formatDateTimeInEt(event.startTimeIso)}</span>
                            <span>{event.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>

      <footer className="footnote">Daily ET reset key: {etDateKey}</footer>
    </main>
  );
}
