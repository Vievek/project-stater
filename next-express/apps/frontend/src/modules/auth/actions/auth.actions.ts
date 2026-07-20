"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authService } from "../services/auth.service";
import * as z from "zod";
import { loginSchema, registerSchema } from "../types/auth.zod";
export async function loginAction(data: z.infer<typeof loginSchema>) {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const response = await authService.login(parsed.data);
  const cookieStore = await cookies();
  cookieStore.set("token", response.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  redirect("/todos");
}

export async function registerAction(data: z.infer<typeof registerSchema>) {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const response = await authService.register(parsed.data);
  const cookieStore = await cookies();
  cookieStore.set("token", response.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  redirect("/todos");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/login");
}
