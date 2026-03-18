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

const updateClientSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const client = await prisma.client.findFirst({
      where: { id: params.id, userId: session.user.id, deletedAt: null },
      include: {
        invoices: {
          include: { client: true },
          orderBy: { createdAt: "desc" },
        },
        proposals: {
          include: { client: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) return notFound("Client");

    return NextResponse.json({ data: client });
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

    const existing = await prisma.client.findFirst({
      where: { id: params.id, userId: session.user.id, deletedAt: null },
    });
    if (!existing) return notFound("Client");

    const body = await request.json();
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ data: client });
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

    const existing = await prisma.client.findFirst({
      where: { id: params.id, userId: session.user.id, deletedAt: null },
    });
    if (!existing) return notFound("Client");

    await prisma.client.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return serverError(error);
  }
}
