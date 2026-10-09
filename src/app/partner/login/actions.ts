"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function loginAction(_prev: string | null, formData: FormData): Promise<string | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/partner",
    });
    return null;
  } catch (e) {
    if (e instanceof AuthError) return "Неверный email или пароль";
    throw e;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/partner/login" });
}
