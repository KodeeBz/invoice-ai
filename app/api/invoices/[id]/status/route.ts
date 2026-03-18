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

const statusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE", "CANCELLED"]),
});

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
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      include: { client: true },
    });

    return NextResponse.json({ data: invoice });
  } catch (error) {
    return serverError(error);
  }
}
