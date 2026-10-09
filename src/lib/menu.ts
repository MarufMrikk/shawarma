import { db } from "@/lib/db";
import type { MenuItemData } from "@/lib/pricing";

export type MenuCategoryData = { id: string; name: string; items: MenuItemData[] };

/** Available menu of a venue, grouped by category, in display order. */
export async function getVenueMenu(venueId: string): Promise<MenuCategoryData[]> {
  const categories = await db.menuCategory.findMany({
    where: { venueId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      items: {
        where: { available: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          groups: {
            orderBy: { sortOrder: "asc" },
            include: { options: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });

  return categories
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price,
        groups: i.groups.map((g) => ({
          id: g.id,
          name: g.name,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          options: g.options.map((o) => ({ id: o.id, name: o.name, priceDelta: o.priceDelta })),
        })),
      })),
    }));
}
