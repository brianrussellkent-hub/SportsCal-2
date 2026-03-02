import { SportsCalendar } from "@/components/sports-calendar";
import { refreshSchedulesFromSources } from "@/lib/live-sources";

export const revalidate = 1_800;

export default async function Home() {
  const refreshed = await refreshSchedulesFromSources();
  return <SportsCalendar events={refreshed.events} />;
}
