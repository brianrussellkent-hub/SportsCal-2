"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventCategory, SportsEvent } from "@/data/events";

type SportsCalendarProps = {
  events: SportsEvent[];
};

type ViewMode = "month" | "week" | "day";

const TZ = "America/New_York";
const allCategoriesOption = "All categories" as const;
const allSeriesOption = "All teams/series" as const;

function formatDateTimeInEt(iso: string, isTimeTbd?: boolean): string {
  if (isTimeTbd) return "Time TBD (ET)";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(iso));
}

function getDateKeyInEt(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(iso));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getCurrentEtDateKey(): string {
  return getDateKeyInEt(new Date().toISOString());
}

function keyFromLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthName(monthIndex: number): string {
  return new Date(2026, monthIndex, 1).toLocaleDateString("en-US", { month: "long" });
}

export function SportsCalendar({ events }: SportsCalendarProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    typeof allCategoriesOption | EventCategory
  >(allCategoriesOption);
  const [selectedSeries, setSelectedSeries] = useState<typeof allSeriesOption | string>(
    allSeriesOption
  );
  const [etDateKey, setEtDateKey] = useState<string>(() => getCurrentEtDateKey());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDateKey, setSelectedDateKey] = useState<string>("2026-01-01");

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

  const categories = useMemo(
    () => Array.from(new Set(events.map((event) => event.category))).sort(),
    [events]
  );

  const seriesList = useMemo(
    () => Array.from(new Set(events.map((event) => event.teamOrSeries))).sort(),
    [events]
  );

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) =>
        selectedCategory === allCategoriesOption ? true : event.category === selectedCategory
      )
      .filter((event) =>
        selectedSeries === allSeriesOption ? true : event.teamOrSeries === selectedSeries
      )
      .sort((a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime());
  }, [events, selectedCategory, selectedSeries]);

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce<Record<string, SportsEvent[]>>((acc, event) => {
      const key = getDateKeyInEt(event.startTimeIso);
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [filteredEvents]);

  const selectedDate = parseDateKey(selectedDateKey);

  const weekDateKeys = useMemo(() => {
    const keys: string[] = [];
    const sunday = new Date(selectedDate);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      keys.push(keyFromLocalDate(d));
    }
    return keys;
  }, [selectedDateKey]);

  const monthDateKeys = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const keys: string[] = [];

    for (let day = first.getDate(); day <= last.getDate(); day += 1) {
      keys.push(keyFromLocalDate(new Date(year, month, day)));
    }

    return keys;
  }, [selectedDateKey]);

  const jumpMonth = (direction: 1 | -1) => {
    const d = parseDateKey(selectedDateKey);
    d.setMonth(d.getMonth() + direction);
    setSelectedDateKey(keyFromLocalDate(new Date(d.getFullYear(), d.getMonth(), 1)));
  };

  const renderDayColumn = (dateKey: string) => {
    const dayEvents = eventsByDate[dateKey] ?? [];
    const date = parseDateKey(dateKey);
    return (
      <div key={dateKey} className="timeColumn">
        <h3>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</h3>
        {dayEvents.length === 0 ? (
          <p className="emptyCell">No events</p>
        ) : (
          dayEvents.map((event) => (
            <article key={event.id} className="eventPill" title={event.location}>
              <strong>{event.title}</strong>
              <span>{formatDateTimeInEt(event.startTimeIso, event.isTimeTbd)}</span>
              <span>{event.teamOrSeries}</span>
            </article>
          ))
        )}
      </div>
    );
  };

  return (
    <main className="container darkCalendar">
      <header className="hero">
        <h1>SportsCal 2026</h1>
        <p>Dark calendar with Month / Week / Day views and stage-by-stage grand tours.</p>
        <small>All times shown in ET. Where official start times are unpublished, events are marked Time TBD.</small>
      </header>

      <section className="controls">
        <label htmlFor="view-select">View</label>
        <select
          id="view-select"
          value={viewMode}
          onChange={(event) => setViewMode(event.target.value as ViewMode)}
        >
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
        </select>

        <label htmlFor="date-select">Date</label>
        <input
          id="date-select"
          type="date"
          min="2026-01-01"
          max="2026-12-31"
          value={selectedDateKey}
          onChange={(event) => setSelectedDateKey(event.target.value)}
        />

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

      {viewMode === "month" && (
        <section>
          <div className="subheader">
            <button onClick={() => jumpMonth(-1)} type="button">Previous month</button>
            <h2>
              {monthName(selectedDate.getMonth())} {selectedDate.getFullYear()}
            </h2>
            <button onClick={() => jumpMonth(1)} type="button">Next month</button>
          </div>
          <div className="calendarGrid">{monthDateKeys.map((dateKey) => renderDayColumn(dateKey))}</div>
        </section>
      )}

      {viewMode === "week" && <section className="calendarGrid">{weekDateKeys.map(renderDayColumn)}</section>}

      {viewMode === "day" && <section className="calendarGrid">{renderDayColumn(selectedDateKey)}</section>}

      <footer className="footnote">Daily ET reset key: {etDateKey}</footer>
    </main>
  );
}
