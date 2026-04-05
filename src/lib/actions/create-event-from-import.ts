"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createEventFromImport(input: {
  tenantId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  locationName?: string;
  address?: string;
  cost?: string;
  ticketUrl?: string;
  categoryId?: string;
  imageUrl?: string;
}) {
  await prisma.event.create({
    data: {
      tenantId: input.tenantId,
      title: input.title,
      description: input.description,
      startAt: new Date(input.startAt),
      endAt: input.endAt ? new Date(input.endAt) : null,
      locationName: input.locationName,
      address: input.address,
      cost: input.cost,
      ticketUrl: input.ticketUrl || null,
      categoryId: input.categoryId || null,
      imageUrl: input.imageUrl,
      status: "APPROVED",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/events");
}
