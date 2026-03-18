import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { badRequest, notFound, serverError } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const rateLimited = applyRateLimit(request, {
      windowMs: 60_000,
      max: 10,
      keyPrefix: "public:invoice:pay",
    });
    if (rateLimited) return rateLimited;

    const invoice = await prisma.invoice.findUnique({
      where: { publicToken: params.token },
      select: { id: true, status: true },
    });

    if (!invoice) return notFound("Invoice");

    if (invoice.status === "CANCELLED") {
      return badRequest("Cancelled invoices cannot be paid");
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID" },
    });

    return NextResponse.json({ data: { success: true, status: "PAID" } });
  } catch (error) {
    return serverError(error);
  }
}
