import { SportsCalendar } from "@/components/sports-calendar";
import { sportsEvents } from "@/data/events";

export const revalidate = 86_400;

export default function Home() {
  return <SportsCalendar events={sportsEvents} />;
}
