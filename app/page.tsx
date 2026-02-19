import { SportsCalendar } from "@/components/sports-calendar";
import { sportsEvents } from "@/data/events";

export default function Home() {
  return <SportsCalendar events={sportsEvents} />;
}
