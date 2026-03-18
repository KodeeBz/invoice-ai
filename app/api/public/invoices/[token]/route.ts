import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncDocumentLifecycles } from "@/lib/lifecycle";
import { notFound, serverError } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { publicToken: params.token },
      include: {
        client: true,
        lineItems: { orderBy: { order: "asc" } },
        user: {
          select: {
            name: true,
            businessName: true,
            businessLogo: true,
            address: true,
            phone: true,
            taxNumber: true,
            currency: true,
          },
        },
      },
    });

    if (!invoice) return notFound("Invoice");

    await syncDocumentLifecycles(invoice.userId);

    if (invoice.status === "SENT") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "VIEWED" },
      });
      invoice.status = "VIEWED";
    }

    return NextResponse.json({ data: invoice });
  } catch (error) {
    return serverError(error);
  }
}
