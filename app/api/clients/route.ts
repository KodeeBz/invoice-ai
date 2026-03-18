import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/session";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const clients = await prisma.client.findMany({
      where: { userId: session.user.id, deletedAt: null },
      include: {
        _count: { select: { invoices: true, proposals: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: clients });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const body = await request.json();
    const parsed = clientSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const client = await prisma.client.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
