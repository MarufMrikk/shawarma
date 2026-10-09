"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isValidCurrency, isValidTimezone } from "@/lib/countries";
import { geocode } from "@/lib/geocode";
import { newInvite } from "@/lib/invite";
import { requireRole } from "@/lib/session";
import { SLUG_RE } from "@/lib/slug";
import { inviteVenueUser } from "@/lib/users";
import { LeadStatus, Role } from "@/generated/prisma/enums";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function parseCommission(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 100) / 100 : null;
}

// ---------- leads ----------

export async function updateLead(_prev: string | null, fd: FormData): Promise<string | null> {
  const admin = await requireRole("ADMIN");
  const id = str(fd, "id");
  const status = str(fd, "status") as LeadStatus;
  if (!Object.values(LeadStatus).includes(status)) return "Неизвестный статус";
  const lead = await db.lead.findUnique({ where: { id }, include: { venue: { select: { id: true } } } });
  if (!lead) return "Заявка не найдена";
  if (status === "connected" && !lead.venue) return "Чтобы подключить, одобрите заявку формой ниже";

  const rawDate = str(fd, "nextContactAt");
  const nextContactAt = rawDate ? new Date(`${rawDate}T00:00:00Z`) : null;
  if (nextContactAt && Number.isNaN(nextContactAt.getTime())) return "Неверная дата";

  await db.lead.update({ where: { id }, data: { status, nextContactAt } });
  if (lead.status !== status) {
    await db.leadNote.create({
      data: { leadId: id, authorId: admin.id, text: `Статус: ${lead.status} → ${status}` },
    });
  }
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
  return null;
}

export async function addLeadNote(_prev: string | null, fd: FormData): Promise<string | null> {
  const admin = await requireRole("ADMIN");
  const leadId = str(fd, "leadId");
  const text = str(fd, "text");
  if (!text) return "Пустая заметка";
  await db.leadNote.create({ data: { leadId, authorId: admin.id, text: text.slice(0, 2000) } });
  revalidatePath(`/admin/leads/${leadId}`);
  return null;
}

export async function approveLead(_prev: string | null, fd: FormData): Promise<string | null> {
  await requireRole("ADMIN");
  const leadId = str(fd, "leadId");
  const slug = str(fd, "slug").toLowerCase();
  const name = str(fd, "name");
  const ownerEmail = str(fd, "ownerEmail").toLowerCase();
  const ownerName = str(fd, "ownerName");
  const currency = str(fd, "currency").toUpperCase();
  const timezone = str(fd, "timezone");
  const commission = parseCommission(str(fd, "commission"));

  if (!name) return "Укажите название";
  if (!SLUG_RE.test(slug)) return "Адрес страницы: латиница, цифры и дефисы";
  if (!isValidCurrency(currency)) return "Неверный код валюты";
  if (!isValidTimezone(timezone)) return "Неверный часовой пояс";
  if (commission === null) return "Комиссия — число от 0 до 100";

  const lead = await db.lead.findUnique({ where: { id: leadId }, include: { venue: { select: { id: true } } } });
  if (!lead) return "Заявка не найдена";
  if (lead.venue) return "Заявка уже одобрена";
  if (await db.venue.findUnique({ where: { slug }, select: { id: true } })) return "Такой адрес страницы уже занят";
  if (await db.user.findUnique({ where: { email: ownerEmail }, select: { id: true } })) {
    return "Пользователь с таким email уже есть";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) return "Неверный email владельца";

  const point = await geocode(`${lead.address}, ${lead.city}`, lead.country);

  const venue = await db.$transaction(async (tx) => {
    const created = await tx.venue.create({
      data: {
        slug,
        name,
        country: lead.country,
        currency,
        timezone,
        city: lead.city,
        address: lead.address,
        phone: lead.phone,
        lat: point?.lat ?? null,
        lng: point?.lng ?? null,
        approved: true,
        commissionPercent: commission,
        leadId: lead.id,
      },
    });
    await tx.user.create({
      data: { email: ownerEmail, name: ownerName || lead.contactName, role: "OWNER", venueId: created.id, ...newInvite() },
    });
    await tx.lead.update({ where: { id: lead.id }, data: { status: "connected" } });
    return created;
  });

  redirect(`/admin/venues/${venue.id}`);
}

// ---------- venues ----------

export async function updateVenueAdmin(_prev: string | null, fd: FormData): Promise<string | null> {
  await requireRole("ADMIN");
  const id = str(fd, "id");
  const currency = str(fd, "currency").toUpperCase();
  const timezone = str(fd, "timezone");
  const commission = parseCommission(str(fd, "commission"));
  if (!isValidCurrency(currency)) return "Неверный код валюты";
  if (!isValidTimezone(timezone)) return "Неверный часовой пояс";
  if (commission === null) return "Комиссия — число от 0 до 100";

  const venue = await db.venue.findUnique({ where: { id }, include: { _count: { select: { items: true } } } });
  if (!venue) return "Заведение не найдено";
  if (currency !== venue.currency && venue._count.items > 0) {
    return "Нельзя сменить валюту, пока в меню есть позиции";
  }

  await db.venue.update({
    where: { id },
    data: { approved: fd.get("approved") === "on", currency, timezone, commissionPercent: commission },
  });
  revalidatePath(`/admin/venues/${id}`);
  revalidatePath("/admin/venues");
  return null;
}

export async function adminInviteUser(_prev: string | null, fd: FormData): Promise<string | null> {
  await requireRole("ADMIN");
  const venueId = str(fd, "venueId");
  const role = str(fd, "role") as Role;
  if (role !== "OWNER" && role !== "STAFF") return "Неверная роль";
  const error = await inviteVenueUser(venueId, str(fd, "email"), str(fd, "name"), role);
  revalidatePath(`/admin/venues/${venueId}`);
  return error;
}
