import { prisma } from "@/lib/prisma";

export async function markOverdueInvoices(userId: string) {
  const now = new Date();

  const updateResult = await prisma.invoice.updateMany({
    where: {
      userId,
      status: { in: ["SENT", "VIEWED"] },
      dueDate: { lt: now },
    },
    data: {
      status: "OVERDUE",
    },
  });

  return updateResult.count;
}

export async function markExpiredProposals(userId: string) {
  const now = new Date();

  const updateResult = await prisma.proposal.updateMany({
    where: {
      userId,
      status: { in: ["SENT", "VIEWED"] },
      validUntil: { lt: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  return updateResult.count;
}

export async function syncDocumentLifecycles(userId: string) {
  const [newlyOverdueCount, newlyExpiredCount] = await Promise.all([
    markOverdueInvoices(userId),
    markExpiredProposals(userId),
  ]);

  return {
    newlyOverdueCount,
    newlyExpiredCount,
  };
}
