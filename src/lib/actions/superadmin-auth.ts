"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  createSuperadminSession,
  destroySuperadminSession,
} from "@/lib/superadmin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function superadminLogin(formData: FormData): Promise<void> {
  const secret = String(formData.get("secret") ?? "");

  // The whole console sits behind one shared secret, so brute force is the
  // only attack that matters here.
  const ip = getClientIp(await headers());
  const limit = await rateLimit(`superadmin-login:${ip}`, 5, 15 * 60);
  if (!limit.allowed) {
    redirect("/superadmin/login?error=throttled");
  }

  const ok = await createSuperadminSession(secret);
  if (!ok) {
    redirect("/superadmin/login?error=invalid");
  }

  redirect("/superadmin");
}

export async function superadminLogout(): Promise<void> {
  await destroySuperadminSession();
  redirect("/superadmin/login");
}
