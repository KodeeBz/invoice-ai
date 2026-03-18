import { prisma } from "@/lib/prisma";

function computeNextNumber(prefix: string, currentYear: number, numbers: string[]) {
  const yearPrefix = `${prefix}-${currentYear}-`;

  const maxForYear = numbers
    .filter((number) => number.startsWith(yearPrefix))
    .map((number) => Number.parseInt(number.replace(yearPrefix, ""), 10))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);

  return `${yearPrefix}${String(maxForYear + 1).padStart(3, "0")}`;
}

export async function getNextInvoiceNumber(userId: string) {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      invoiceNumber: { startsWith: prefix },
    },
    select: { invoiceNumber: true },
  });

  return computeNextNumber(
    "INV",
    currentYear,
    invoices.map((invoice) => invoice.invoiceNumber)
  );
}

export async function getNextProposalNumber(userId: string) {
  const currentYear = new Date().getFullYear();
  const prefix = `PROP-${currentYear}-`;

  const proposals = await prisma.proposal.findMany({
    where: {
      userId,
      proposalNumber: { startsWith: prefix },
    },
    select: { proposalNumber: true },
  });

  return computeNextNumber(
    "PROP",
    currentYear,
    proposals.map((proposal) => proposal.proposalNumber)
  );
}
