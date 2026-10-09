"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { geocode } from "@/lib/geocode";
import { hhmmToMinutes } from "@/lib/hours";
import { parseMoney } from "@/lib/money";
import { toE164 } from "@/lib/phone";
import { requireVenueUser } from "@/lib/session";
import { inviteVenueUser } from "@/lib/users";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function int(fd: FormData, key: string, fallback = 0): number {
  const n = Number(str(fd, key));
  return Number.isInteger(n) ? n : fallback;
}

async function ownerVenue() {
  const user = await requireVenueUser("OWNER");
  const venue = await db.venue.findUniqueOrThrow({ where: { id: user.venueId } });
  return venue;
}

// ---------- venue info ----------

export async function updateVenueInfo(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const name = str(fd, "name");
  const city = str(fd, "city");
  const address = str(fd, "address");
  const phone = toE164(str(fd, "phone"));
  if (!name || !city || !address) return "Заполните название, город и адрес";
  if (!phone) return "Неверный номер телефона";

  let lat = venue.lat;
  let lng = venue.lng;
  if (address !== venue.address || city !== venue.city || lat === null || lng === null) {
    const point = await geocode(`${address}, ${city}`, venue.country);
    if (!point) return "Адрес не найден на карте — уточните его";
    lat = point.lat;
    lng = point.lng;
  }

  await db.venue.update({ where: { id: venue.id }, data: { name, city, address, phone, lat, lng } });
  revalidatePath("/owner");
  return null;
}

// ---------- hours ----------

export async function saveHours(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const rows = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    if (!fd.get(`open_${weekday}`)) continue;
    const opensAt = hhmmToMinutes(str(fd, `from_${weekday}`));
    const closesAt = hhmmToMinutes(str(fd, `to_${weekday}`));
    if (opensAt === null || closesAt === null) return "Укажите время в формате ЧЧ:ММ";
    rows.push({ venueId: venue.id, weekday, opensAt: opensAt % 1440, closesAt });
  }
  await db.$transaction([
    db.openingHours.deleteMany({ where: { venueId: venue.id } }),
    db.openingHours.createMany({ data: rows }),
  ]);
  revalidatePath("/owner/hours");
  return null;
}

// ---------- categories ----------

export async function createCategory(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const name = str(fd, "name");
  if (!name) return "Введите название";
  const count = await db.menuCategory.count({ where: { venueId: venue.id } });
  await db.menuCategory.create({ data: { venueId: venue.id, name, sortOrder: count } });
  revalidatePath("/owner/menu");
  return null;
}

export async function updateCategory(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const name = str(fd, "name");
  if (!name) return "Введите название";
  await db.menuCategory.updateMany({
    where: { id: str(fd, "id"), venueId: venue.id },
    data: { name, sortOrder: int(fd, "sortOrder") },
  });
  revalidatePath("/owner/menu");
  return null;
}

export async function deleteCategory(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  await db.menuCategory.deleteMany({ where: { id: str(fd, "id"), venueId: venue.id } });
  revalidatePath("/owner/menu");
  return null;
}

// ---------- items ----------

export async function createItem(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const name = str(fd, "name");
  const price = parseMoney(str(fd, "price"), venue.currency);
  const category = await db.menuCategory.findFirst({ where: { id: str(fd, "categoryId"), venueId: venue.id } });
  if (!name) return "Введите название";
  if (price === null) return "Неверная цена";
  if (!category) return "Выберите категорию";
  const item = await db.menuItem.create({
    data: { venueId: venue.id, categoryId: category.id, name, price, description: str(fd, "description") },
  });
  redirect(`/owner/menu/${item.id}`);
}

export async function updateItem(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const price = parseMoney(str(fd, "price"), venue.currency);
  const category = await db.menuCategory.findFirst({ where: { id: str(fd, "categoryId"), venueId: venue.id } });
  if (!name) return "Введите название";
  if (price === null) return "Неверная цена";
  if (!category) return "Выберите категорию";
  await db.menuItem.updateMany({
    where: { id, venueId: venue.id },
    data: {
      name,
      price,
      categoryId: category.id,
      description: str(fd, "description"),
      available: fd.get("available") === "on",
      sortOrder: int(fd, "sortOrder"),
    },
  });
  revalidatePath(`/owner/menu/${id}`);
  revalidatePath("/owner/menu");
  return null;
}

export async function toggleItemAvailable(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  await db.menuItem.updateMany({
    where: { id: str(fd, "id"), venueId: venue.id },
    data: { available: fd.get("available") === "true" },
  });
  revalidatePath("/owner/menu");
  return null;
}

export async function deleteItem(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  await db.menuItem.deleteMany({ where: { id: str(fd, "id"), venueId: venue.id } });
  redirect("/owner/menu");
}

// ---------- modifier groups & options ----------

function groupLimits(fd: FormData): { minSelect: number; maxSelect: number } | string {
  const minSelect = int(fd, "minSelect", -1);
  const maxSelect = int(fd, "maxSelect", -1);
  if (minSelect < 0 || maxSelect < 1 || minSelect > maxSelect) return "Минимум ≥ 0, максимум ≥ 1 и не меньше минимума";
  return { minSelect, maxSelect };
}

export async function createGroup(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const menuItemId = str(fd, "menuItemId");
  const name = str(fd, "name");
  const limits = groupLimits(fd);
  if (!name) return "Введите название группы";
  if (typeof limits === "string") return limits;
  const item = await db.menuItem.findFirst({ where: { id: menuItemId, venueId: venue.id }, select: { id: true } });
  if (!item) return "Позиция не найдена";
  const count = await db.modifierGroup.count({ where: { menuItemId } });
  await db.modifierGroup.create({ data: { menuItemId, name, ...limits, sortOrder: count } });
  revalidatePath(`/owner/menu/${menuItemId}`);
  return null;
}

export async function updateGroup(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const name = str(fd, "name");
  const limits = groupLimits(fd);
  if (!name) return "Введите название группы";
  if (typeof limits === "string") return limits;
  const group = await db.modifierGroup.findFirst({
    where: { id: str(fd, "id"), menuItem: { venueId: venue.id } },
    include: { _count: { select: { options: true } } },
  });
  if (!group) return "Группа не найдена";
  if (limits.minSelect > group._count.options) return "Минимум больше, чем вариантов в группе";
  await db.modifierGroup.update({ where: { id: group.id }, data: { name, ...limits } });
  revalidatePath(`/owner/menu/${group.menuItemId}`);
  return null;
}

export async function deleteGroup(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const menuItemId = str(fd, "menuItemId");
  await db.modifierGroup.deleteMany({ where: { id: str(fd, "id"), menuItem: { venueId: venue.id } } });
  revalidatePath(`/owner/menu/${menuItemId}`);
  return null;
}

export async function createOption(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const name = str(fd, "name");
  const rawDelta = str(fd, "priceDelta");
  const priceDelta = rawDelta ? parseMoney(rawDelta, venue.currency) : 0;
  if (!name) return "Введите название";
  if (priceDelta === null) return "Неверная доплата";
  const group = await db.modifierGroup.findFirst({
    where: { id: str(fd, "groupId"), menuItem: { venueId: venue.id } },
    include: { _count: { select: { options: true } } },
  });
  if (!group) return "Группа не найдена";
  await db.modifier.create({
    data: { groupId: group.id, name, priceDelta, sortOrder: group._count.options },
  });
  revalidatePath(`/owner/menu/${group.menuItemId}`);
  return null;
}

export async function deleteOption(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const option = await db.modifier.findFirst({
    where: { id: str(fd, "id"), group: { menuItem: { venueId: venue.id } } },
    include: { group: { include: { _count: { select: { options: true } } } } },
  });
  if (!option) return null;
  if (option.group._count.options - 1 < option.group.minSelect) {
    return "Нельзя удалить: в группе станет меньше вариантов, чем минимум";
  }
  await db.modifier.delete({ where: { id: option.id } });
  revalidatePath(`/owner/menu/${option.group.menuItemId}`);
  return null;
}

// ---------- staff ----------

export async function inviteStaff(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  const error = await inviteVenueUser(venue.id, str(fd, "email"), str(fd, "name"), "STAFF");
  revalidatePath("/owner");
  return error;
}

export async function removeStaff(_prev: string | null, fd: FormData): Promise<string | null> {
  const venue = await ownerVenue();
  await db.user.deleteMany({ where: { id: str(fd, "id"), venueId: venue.id, role: "STAFF" } });
  revalidatePath("/owner");
  return null;
}
