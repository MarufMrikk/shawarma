/** Line pictograms for menu categories: shawarma in foil, fries box, cup. */
export type PictogramKind = "roll" | "fries" | "cup";

export function pictogramFor(category: string): PictogramKind {
  const c = category.toLowerCase();
  if (/напит|чай|кофе|морс|лимонад|айран/.test(c)) return "cup";
  if (/гарнир|картоф|фри|закуск|хумус|салат/.test(c)) return "fries";
  return "roll";
}

export function Pictogram({ kind, className = "h-10 w-10" }: { kind: PictogramKind; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      {kind === "roll" && (
        <>
          {/* lavash roll, foil wrapped bottom half */}
          <path d="M17 6c4-2 10-2 14 0l3 6-2 6H16l-2-6z" />
          <path d="M19 10c2 1 5 1 7-1M22 14c2 1 5 0 6-2" />
          <path d="M14 18h20l-2 24H16z" fill="currentColor" fillOpacity=".12" />
          <path d="M15 24l18 6M15.5 31l16.5 6M16 38l9 3" />
        </>
      )}
      {kind === "fries" && (
        <>
          <path d="M16 20l-2-12 3-1 2 13M22 20l-1-14 3 0 1 14M28 20l1-13 3 .5-1 12.5M33 21l2-9 3 1-2 9" />
          <path d="M11 20h26l-3 22H14z" fill="currentColor" fillOpacity=".12" />
          <path d="M11 20c4 5 22 5 26 0" />
        </>
      )}
      {kind === "cup" && (
        <>
          <path d="M14 14h20l-2.5 28h-15z" fill="currentColor" fillOpacity=".12" />
          <path d="M12 10h24v4H12zM26 10l3-6h4" />
          <path d="M15 24h18" />
        </>
      )}
    </svg>
  );
}
