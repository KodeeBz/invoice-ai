import { prisma } from "@/lib/prisma";

type MonthlyBucket = {
  key: string;
  month: string;
  revenue: number;
};

function getMonthlyBuckets(monthCount = 6): MonthlyBucket[] {
  const now = new Date();

  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1) + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    return {
      key,
      month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
      revenue: 0,
    };
  });
}

export async function getDashboardOverview(userId: string) {
  const monthlyBuckets = getMonthlyBuckets(6);
  const monthLookup = new Map(monthlyBuckets.map((bucket, index) => [bucket.key, index]));
  const firstMonthDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 5,
    1
  );

  const [paidTotals, outstandingTotals, totalInvoices, totalClients, paidInvoicesForChart, recentInvoices, recentProposals, user] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: { userId, status: "PAID" },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          userId,
          status: { in: ["SENT", "OVERDUE"] },
        },
        _sum: { total: true },
      }),
      prisma.invoice.count({ where: { userId } }),
      prisma.client.count({ where: { userId, deletedAt: null } }),
      prisma.invoice.findMany({
        where: {
          userId,
          status: "PAID",
          issueDate: { gte: firstMonthDate },
        },
        select: {
          issueDate: true,
          total: true,
        },
      }),
      prisma.invoice.findMany({
        where: { userId },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          dueDate: true,
          createdAt: true,
          client: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.proposal.findMany({
        where: { userId },
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          total: true,
          validUntil: true,
          createdAt: true,
          client: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true },
      }),
    ]);

  for (const invoice of paidInvoicesForChart) {
    const monthKey = `${invoice.issueDate.getFullYear()}-${String(
      invoice.issueDate.getMonth() + 1
    ).padStart(2, "0")}`;
    const bucketIndex = monthLookup.get(monthKey);

    if (bucketIndex !== undefined) {
      monthlyBuckets[bucketIndex].revenue += invoice.total;
    }
  }

  return {
    totalRevenue: paidTotals._sum.total ?? 0,
    outstandingAmount: outstandingTotals._sum.total ?? 0,
    totalInvoices,
    totalClients,
    currency: user?.currency ?? "USD",
    monthlyRevenue: monthlyBuckets.map(({ month, revenue }) => ({ month, revenue })),
    recentInvoices,
    recentProposals,
  };
}
