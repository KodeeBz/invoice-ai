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

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  order: z.number().int().min(0).optional(),
});

const updateProposalSchema = z.object({
  clientId: z.string().optional(),
  proposalNumber: z.string().optional(),
  title: z.string().optional(),
  validUntil: z.string().optional(),
  sections: z.array(sectionSchema).optional(),
  total: z.number().min(0).optional(),
  status: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const proposal = await prisma.proposal.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        sections: { orderBy: { order: "asc" } },
        user: {
          select: {
            name: true,
            businessName: true,
            businessLogo: true,
            address: true,
            phone: true,
            taxNumber: true,
          },
        },
      },
    });

    if (!proposal) return notFound("Proposal");

    return NextResponse.json({ data: proposal });
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

    const existing = await prisma.proposal.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) return notFound("Proposal");

    const body = await request.json();
    const parsed = updateProposalSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { sections, ...proposalData } = parsed.data;

    if (proposalData.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: proposalData.clientId,
          userId: session.user.id,
          deletedAt: null,
        },
      });

      if (!client) {
        return badRequest("Client not found");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (proposalData.clientId !== undefined) updateData.clientId = proposalData.clientId;
    if (proposalData.proposalNumber !== undefined) updateData.proposalNumber = proposalData.proposalNumber;
    if (proposalData.title !== undefined) updateData.title = proposalData.title;
    if (proposalData.validUntil !== undefined) updateData.validUntil = new Date(proposalData.validUntil);
    if (proposalData.total !== undefined) updateData.total = proposalData.total;
    if (proposalData.status !== undefined) updateData.status = proposalData.status;

    // Replace sections if provided
    if (sections) {
      await prisma.proposalSection.deleteMany({ where: { proposalId: params.id } });
      updateData.sections = {
        create: sections.map((section, index) => ({
          title: section.title,
          content: section.content,
          order: section.order ?? index,
        })),
      };
    }

    const proposal = await prisma.proposal.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        sections: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ data: proposal });
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

    const existing = await prisma.proposal.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) return notFound("Proposal");

    await prisma.proposal.delete({ where: { id: params.id } });

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

    const existing = await prisma.proposal.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) return notFound("Proposal");

    const body = await request.json();
    const { status } = body;

    const validStatuses = ["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"];
    if (!status || !validStatuses.includes(status)) {
      return badRequest("Invalid status");
    }

    const proposal = await prisma.proposal.update({
      where: { id: params.id },
      data: { status },
      include: { client: true },
    });

    return NextResponse.json({ data: proposal });
  } catch (error) {
    return serverError(error);
  }
}
