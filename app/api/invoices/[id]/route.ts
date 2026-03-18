import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  notFound,
  badRequest,
  serverError,
} from "@/lib/session";

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
  order: z.number().int().min(0).optional(),
});

const updateInvoiceSchema = z.object({
  clientId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  subtotal: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discountType: z.string().nullable().optional(),
  discountValue: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
  status: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
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

    return NextResponse.json({ data: invoice });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) return notFound("Invoice");

    const body = await request.json();
    const parsed = updateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { lineItems, ...invoiceData } = parsed.data;

    if (invoiceData.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: invoiceData.clientId,
          userId: session.user.id,
          deletedAt: null,
        },
      });

      if (!client) {
        return badRequest("Client not found");
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (invoiceData.clientId !== undefined) updateData.clientId = invoiceData.clientId;
    if (invoiceData.invoiceNumber !== undefined) updateData.invoiceNumber = invoiceData.invoiceNumber;
    if (invoiceData.issueDate !== undefined) updateData.issueDate = new Date(invoiceData.issueDate);
    if (invoiceData.dueDate !== undefined) updateData.dueDate = new Date(invoiceData.dueDate);
    if (invoiceData.subtotal !== undefined) updateData.subtotal = invoiceData.subtotal;
    if (invoiceData.taxRate !== undefined) updateData.taxRate = invoiceData.taxRate;
    if (invoiceData.taxAmount !== undefined) updateData.taxAmount = invoiceData.taxAmount;
    if (invoiceData.discountType !== undefined) updateData.discountType = invoiceData.discountType;
    if (invoiceData.discountValue !== undefined) updateData.discountValue = invoiceData.discountValue;
    if (invoiceData.discountAmount !== undefined) updateData.discountAmount = invoiceData.discountAmount;
    if (invoiceData.total !== undefined) updateData.total = invoiceData.total;
    if (invoiceData.notes !== undefined) updateData.notes = invoiceData.notes;
    if (invoiceData.status !== undefined) updateData.status = invoiceData.status;

    // Replace line items if provided
    if (lineItems) {
      await prisma.lineItem.deleteMany({ where: { invoiceId: params.id } });
      updateData.lineItems = {
        create: lineItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          order: item.order ?? index,
        })),
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        lineItems: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ data: invoice });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) return notFound("Invoice");

    await prisma.invoice.delete({ where: { id: params.id } });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return serverError(error);
  }
}

// PATCH for status updates only
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) return notFound("Invoice");

    const body = await request.json();
    const { status } = body;

    const validStatuses = ["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return badRequest("Invalid status");
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status },
      include: { client: true },
    });

    return NextResponse.json({ data: invoice });
  } catch (error) {
    return serverError(error);
  }
}
