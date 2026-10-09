"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function acceptInvite(_prev: string | null, fd: FormData): Promise<string | null> {
  const token = String(fd.get("token") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!name) return "Укажите имя";
  if (password.length < 8) return "Пароль — минимум 8 символов";
  if (password !== fd.get("password2")) return "Пароли не совпадают";

  const passwordHash = await bcrypt.hash(password, 10);
  const { count } = await db.user.updateMany({
    where: { inviteToken: token, inviteExpiresAt: { gt: new Date() } },
    data: { name, passwordHash, inviteToken: null, inviteExpiresAt: null },
  });
  if (count === 0) return "Приглашение недействительно или истекло";
  redirect("/login?invited=1");
}
