"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authService } from "../services/auth.service";
import { loginSchema, registerSchema } from "../types/auth.zod";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  try {
    const data = await authService.login(parsed.data);
    
    const cookieStore = await cookies();
    cookieStore.set("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

  } catch (err: any) {
    return { error: err.message || "Login failed" };
  }
  
  redirect("/todos");
}

export async function registerAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const parsed = registerSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  try {
    const data = await authService.register(parsed.data);
    const cookieStore = await cookies();
    cookieStore.set("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

  } catch (err: any) {
    return { error: err.message || "Registration failed" };
  }

  redirect("/todos");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/login");
}
