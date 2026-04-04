import { prisma } from "@/lib/prisma";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";

export type AnalyticsTopCategory = {
  name: string;
  color: string;
  count: number;
};

export type TenantAnalytics = {
  submissionsByMonth: Array<{ label: string; count: number }>;
  statusBreakdown: { pending: number; approved: number; rejected: number };
  topCategories: AnalyticsTopCategory[];
  thisMonthCount: number;
  totalApproved: number;
  recentActivity: Array<{
    id: string;
    action: string;
    createdAt: Date;
    user: { email: string | null; name: string | null } | null;
    event: { title: string } | null;
  }>;
};

export async function getTenantAnalytics(tenantId: string): Promise<TenantAnalytics> {
  const now = new Date();

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(now, 5 - index);
    return {
      label: format(date, "MMM"),
      start: startOfMonth(date),
      end: startOfMonth(addMonths(date, 1)),
    };
  });

  const submissionsByMonth = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const count = await prisma.event.count({
        where: {
          tenantId,
          createdAt: { gte: start, lt: end },
        },
      });

      return { label, count };
    })
  );

  const [pending, approved, rejected] = await Promise.all([
    prisma.event.count({ where: { tenantId, status: "PENDING" } }),
    prisma.event.count({ where: { tenantId, status: "APPROVED" } }),
    prisma.event.count({ where: { tenantId, status: "REJECTED" } }),
  ]);

  const categoryBreakdown = (await (prisma.event.groupBy as any)({
    by: ["categoryId"],
    where: { tenantId, status: "APPROVED" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  })) as Array<{ categoryId: string | null; _count: { id: number } }>;

  const categories: Array<{ id: string; name: string; color: string | null }> = await prisma.category.findMany({
    where: { tenantId },
  });

  const topCategories: AnalyticsTopCategory[] = categoryBreakdown.map((row) => {
    const category = categories.find((item: { id: string; name: string; color: string | null }) => item.id === row.categoryId);

    return {
      name: category?.name ?? "Uncategorized",
      color: category?.color ?? "#6366f1",
      count: row._count.id,
    };
  });

  const thisMonthStart = startOfMonth(now);
  const thisMonthCount = await prisma.event.count({
    where: {
      tenantId,
      createdAt: { gte: thisMonthStart },
    },
  });

  const recentActivity = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      user: { select: { email: true, name: true } },
      event: { select: { title: true } },
    },
  });

  return {
    submissionsByMonth,
    statusBreakdown: { pending, approved, rejected },
    topCategories,
    thisMonthCount,
    totalApproved: approved,
    recentActivity,
  };
}