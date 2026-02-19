"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventCategory, SportsEvent } from "@/data/events";

type SportsCalendarProps = {
  events: SportsEvent[];
};

type ViewMode = "month" | "week" | "day";

type RefreshResponse = {
  events: SportsEvent[];
  refreshedAtIso: string;
  sourceStatus: string[];
};

const TZ = "America/New_York";
const allCategoriesOption = "All categories" as const;
const allSeriesOption = "All teams/series" as const;
const mondayFirstLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function mondayBasedWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function categoryClass(category: string): string {
  return `event-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function SportsCalendar({ events }: SportsCalendarProps) {
  const [eventsState, setEventsState] = useState(events);
  const [selectedCategory, setSelectedCategory] = useState<
    typeof allCategoriesOption | EventCategory
  >(allCategoriesOption);
  const [selectedSeries, setSelectedSeries] = useState<typeof allSeriesOption | string>(
    allSeriesOption
  );
  const [etDateKey, setEtDateKey] = useState<string>(() => getCurrentEtDateKey());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDateKey, setSelectedDateKey] = useState<string>(getCurrentEtDateKey());
  const [refreshStatus, setRefreshStatus] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = getCurrentEtDateKey();
      setEtDateKey((previous) => {
        if (previous !== current) {
          setSelectedCategory(allCategoriesOption);
          setSelectedSeries(allSeriesOption);
          setSelectedDateKey(current);
          return current;
        }
        return previous;
      });
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(eventsState.map((event) => event.category))).sort(),
    [eventsState]
  );
  const seriesList = useMemo(
    () => Array.from(new Set(eventsState.map((event) => event.teamOrSeries))).sort(),
    [eventsState]
  );

  const filteredEvents = useMemo(() => {
    return eventsState
      .filter((event) =>
        selectedCategory === allCategoriesOption ? true : event.category === selectedCategory
      )
      .filter((event) =>
        selectedSeries === allSeriesOption ? true : event.teamOrSeries === selectedSeries
      )
      .sort((a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime());
  }, [eventsState, selectedCategory, selectedSeries]);

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
    const monday = new Date(selectedDate);
    monday.setDate(monday.getDate() - mondayBasedWeekday(monday));
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      keys.push(keyFromLocalDate(d));
    }
    return keys;
  }, [selectedDateKey]);

  const monthDateCells = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const leadingPadding = mondayBasedWeekday(first);
    const cells: Array<string | null> = [];

    for (let i = 0; i < leadingPadding; i += 1) cells.push(null);
    for (let day = 1; day <= last.getDate(); day += 1) {
      cells.push(keyFromLocalDate(new Date(year, month, day)));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [selectedDateKey]);

  const jumpMonth = (direction: 1 | -1) => {
    const d = parseDateKey(selectedDateKey);
    d.setMonth(d.getMonth() + direction);
    setSelectedDateKey(keyFromLocalDate(new Date(d.getFullYear(), d.getMonth(), 1)));
  };

  const handleToday = () => setSelectedDateKey(getCurrentEtDateKey());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/refresh-schedules", { cache: "no-store" });
      if (!res.ok) throw new Error("refresh failed");
      const payload: RefreshResponse = await res.json();
      setEventsState(payload.events);
      setRefreshStatus(`Updated ${new Date(payload.refreshedAtIso).toLocaleString()} • ${payload.sourceStatus.join(" | ")}`);
    } catch {
      setRefreshStatus("Refresh failed. Keeping existing schedule data.");
    } finally {
      setIsRefreshing(false);
    }
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
            <article key={event.id} className={`eventPill ${categoryClass(event.category)}`} title={event.location}>
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
        <p>Dark calendar with Month / Week / Day views and Monday-first week layout.</p>
        <small>All times shown in ET. Only events with unpublished times are marked Time TBD.</small>
      </header>

      <section className="controls">
        <button type="button" onClick={handleToday}>Today</button>
        <button type="button" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh schedules"}
        </button>
        <label htmlFor="view-select">View</label>
        <select id="view-select" value={viewMode} onChange={(event) => setViewMode(event.target.value as ViewMode)}>
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
        </select>

        <label htmlFor="date-select">Date</label>
        <input id="date-select" type="date" min="2026-01-01" max="2026-12-31" value={selectedDateKey} onChange={(event) => setSelectedDateKey(event.target.value)} />

        <label htmlFor="category-select">Category</label>
        <select id="category-select" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value as typeof allCategoriesOption | EventCategory)}>
          <option value={allCategoriesOption}>{allCategoriesOption}</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <label htmlFor="series-select">Team / Series</label>
        <select id="series-select" value={selectedSeries} onChange={(event) => setSelectedSeries(event.target.value)}>
          <option value={allSeriesOption}>{allSeriesOption}</option>
          {seriesList.map((series) => (
            <option key={series} value={series}>{series}</option>
          ))}
        </select>
      </section>

      {refreshStatus && <p className="refreshStatus">{refreshStatus}</p>}

      {viewMode === "month" && (
        <section>
          <div className="subheader">
            <button onClick={() => jumpMonth(-1)} type="button">Previous month</button>
            <h2>{monthName(selectedDate.getMonth())} {selectedDate.getFullYear()}</h2>
            <button onClick={() => jumpMonth(1)} type="button">Next month</button>
          </div>
          <div className="weekdayHeader">{mondayFirstLabels.map((label) => <span key={label}>{label}</span>)}</div>
          <div className="monthGrid">
            {monthDateCells.map((dateKey, index) =>
              dateKey ? <div key={dateKey} className="monthCell">{renderDayColumn(dateKey)}</div> : <div key={`blank-${index}`} className="monthBlank" />
            )}
          </div>
        </section>
      )}

      {viewMode === "week" && (
        <section>
          <div className="weekdayHeader">{mondayFirstLabels.map((label) => <span key={label}>{label}</span>)}</div>
          <div className="weekGrid">{weekDateKeys.map(renderDayColumn)}</div>
        </section>
      )}

      {viewMode === "day" && <section className="dayGrid">{renderDayColumn(selectedDateKey)}</section>}

      <footer className="footnote">Daily ET reset key: {etDateKey}</footer>
    </main>
  );
}
