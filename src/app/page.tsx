import { SiteHeader } from "@/components/SiteHeader";
import { VenueFinder } from "@/components/VenueFinder";
import { getVisibleVenues } from "@/lib/venues";

export default async function HomePage() {
  const venues = await getVisibleVenues();
  return (
    <>
      <SiteHeader />
      <VenueFinder venues={venues} />
    </>
  );
}
