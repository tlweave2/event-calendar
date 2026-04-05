"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteEvent(eventId: string): Promise<void> {
  const session = await auth();
  if (!session) return;

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: session.user.tenantId },
  });
  if (!event) return;

  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath("/admin/events");
  revalidatePath("/admin");
  redirect("/admin/events");
}
