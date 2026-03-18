import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  getAuthSession,
  unauthorized,
  notFound,
  badRequest,
  serverError,
} from "@/lib/session";

const sendSchema = z.object({
  personalMessage: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const rateLimited = applyRateLimit(
      request,
      { windowMs: 60_000, max: 6, keyPrefix: "invoice:send" },
      session.user.id
    );
    if (rateLimited) return rateLimited;

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        lineItems: { orderBy: { order: "asc" } },
        user: {
          select: {
            name: true,
            email: true,
            businessName: true,
            businessLogo: true,
          },
        },
      },
    });

    if (!invoice) return notFound("Invoice");

    if (!invoice.pdfUrl) {
      return badRequest(
        "PDF must be generated before sending. Generate the PDF first."
      );
    }

    const body = await request.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const businessName =
      invoice.user.businessName || invoice.user.name;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    await sendInvoiceEmail({
      to: invoice.client.email,
      cc: invoice.user.email ?? undefined,
      invoiceNumber: invoice.invoiceNumber,
      businessName,
      businessLogo: invoice.user.businessLogo,
      clientName: invoice.client.name,
      total: invoice.total,
      dueDate: invoice.dueDate.toISOString(),
      pdfUrl: invoice.pdfUrl,
      publicViewUrl: `${appUrl}/view/invoice/${invoice.publicToken}`,
      personalMessage: parsed.data.personalMessage,
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        total: item.total,
      })),
    });

    // Update status to SENT
    await prisma.invoice.update({
      where: { id: params.id },
      data: { status: "SENT" },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return serverError(error);
  }
}
