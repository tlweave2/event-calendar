"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const moderateSchema = z.object({
  eventId: z.string().uuid(),
  action: z.enum(["APPROVED", "REJECTED"]),
});

export async function moderateEvent(input: {
  eventId: string;
  action: "APPROVED" | "REJECTED";
}) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = moderateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { eventId, action } = parsed.data;
  const tenantId = session.user.tenantId;

  // Confirm event belongs to this tenant
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
  });
  if (!event) return { success: false, error: "Event not found" };

  await prisma.$transaction([
    prisma.event.update({
      where: { id: eventId },
      data: { status: action },
    }),
    prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        eventId,
        action: `event.${action.toLowerCase()}`,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/events");

  return { success: true };
}
