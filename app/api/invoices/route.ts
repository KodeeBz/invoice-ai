import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { syncDocumentLifecycles } from "@/lib/lifecycle";
import { getNextInvoiceNumber } from "@/lib/numbering";
import {
  getAuthSession,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/session";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
  order: z.number().int().min(0).optional(),
});

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required").optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discountType: z.string().nullable().optional(),
  discountValue: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  total: z.number().min(0),
  notes: z.string().optional(),
  status: z.string().optional(),
  aiGenerated: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();
    await syncDocumentLifecycles(session.user.id);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: session.user.id };
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          lineItems: { orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { lineItems, ...invoiceData } = parsed.data;

    // Verify client ownership
    const client = await prisma.client.findFirst({
      where: { id: invoiceData.clientId, userId: session.user.id, deletedAt: null },
    });
    if (!client) return badRequest("Client not found");

    const hasCustomNumber = Boolean(invoiceData.invoiceNumber);
    let candidateNumber = invoiceData.invoiceNumber;

    if (!candidateNumber) {
      candidateNumber = await getNextInvoiceNumber(session.user.id);
    }

    let invoice = null;
    const maxAttempts = hasCustomNumber ? 1 : 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (!candidateNumber) {
        candidateNumber = await getNextInvoiceNumber(session.user.id);
      }

      try {
        invoice = await prisma.invoice.create({
          data: {
            userId: session.user.id,
            clientId: invoiceData.clientId,
            invoiceNumber: candidateNumber,
            status: invoiceData.status || "DRAFT",
            issueDate: new Date(invoiceData.issueDate),
            dueDate: new Date(invoiceData.dueDate),
            subtotal: invoiceData.subtotal,
            taxRate: invoiceData.taxRate ?? 0,
            taxAmount: invoiceData.taxAmount ?? 0,
            discountType: invoiceData.discountType ?? null,
            discountValue: invoiceData.discountValue ?? 0,
            discountAmount: invoiceData.discountAmount ?? 0,
            total: invoiceData.total,
            notes: invoiceData.notes ?? null,
            aiGenerated: invoiceData.aiGenerated ?? false,
            lineItems: {
              create: lineItems.map((item, index) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                order: item.order ?? index,
              })),
            },
          },
          include: {
            client: true,
            lineItems: { orderBy: { order: "asc" } },
          },
        });

        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          if (hasCustomNumber) {
            return badRequest("Invoice number already exists");
          }
          candidateNumber = await getNextInvoiceNumber(session.user.id);
          continue;
        }

        throw error;
      }
    }

    if (!invoice) {
      return badRequest("Could not assign a unique invoice number. Please try again.");
    }

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
