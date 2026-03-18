import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/session";

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  businessName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  currency: z.string().trim().min(3, "Currency is required").max(10),
  businessLogo: z.string().trim().optional(),
  defaultTaxRate: z.number().min(0).max(100),
  defaultPaymentTerms: z.string().trim().min(1, "Default payment terms are required"),
  defaultDueDays: z.number().int().min(1).max(365),
  aiContext: z.string().trim().optional(),
});

function emptyToNull(value?: string) {
  if (!value || value.length === 0) return null;
  return value;
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        businessLogo: true,
        address: true,
        phone: true,
        taxNumber: true,
        currency: true,
        defaultTaxRate: true,
        defaultPaymentTerms: true,
        defaultDueDays: true,
        aiContext: true,
      },
    });

    if (!user) return unauthorized();

    return NextResponse.json({ data: user });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const {
      name,
      businessName,
      address,
      phone,
      taxNumber,
      currency,
      businessLogo,
      defaultTaxRate,
      defaultPaymentTerms,
      defaultDueDays,
      aiContext,
    } = parsed.data;

    if (
      businessLogo &&
      !businessLogo.startsWith("data:image/") &&
      !/^https?:\/\//i.test(businessLogo)
    ) {
      return badRequest("Business logo must be an image URL or base64 image string");
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        businessName: emptyToNull(businessName),
        address: emptyToNull(address),
        phone: emptyToNull(phone),
        taxNumber: emptyToNull(taxNumber),
        currency,
        businessLogo: emptyToNull(businessLogo),
        defaultTaxRate,
        defaultPaymentTerms,
        defaultDueDays,
        aiContext: emptyToNull(aiContext),
      },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        businessLogo: true,
        address: true,
        phone: true,
        taxNumber: true,
        currency: true,
        defaultTaxRate: true,
        defaultPaymentTerms: true,
        defaultDueDays: true,
        aiContext: true,
      },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    return serverError(error);
  }
}
