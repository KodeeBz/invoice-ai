import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { syncDocumentLifecycles } from "@/lib/lifecycle";
import { getNextProposalNumber } from "@/lib/numbering";
import {
  getAuthSession,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/session";

const sectionSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  order: z.number().int().min(0).optional(),
});

const createProposalSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  proposalNumber: z.string().min(1, "Proposal number is required").optional(),
  title: z.string().min(1, "Title is required"),
  validUntil: z.string(),
  sections: z.array(sectionSchema).min(1, "At least one section is required"),
  total: z.number().min(0),
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

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          sections: { orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.proposal.count({ where }),
    ]);

    return NextResponse.json({
      data: proposals,
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
    const parsed = createProposalSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { sections, ...proposalData } = parsed.data;

    // Verify client ownership
    const client = await prisma.client.findFirst({
      where: { id: proposalData.clientId, userId: session.user.id, deletedAt: null },
    });
    if (!client) return badRequest("Client not found");

    const hasCustomNumber = Boolean(proposalData.proposalNumber);
    let candidateNumber = proposalData.proposalNumber;

    if (!candidateNumber) {
      candidateNumber = await getNextProposalNumber(session.user.id);
    }

    let proposal = null;
    const maxAttempts = hasCustomNumber ? 1 : 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (!candidateNumber) {
        candidateNumber = await getNextProposalNumber(session.user.id);
      }

      try {
        proposal = await prisma.proposal.create({
          data: {
            userId: session.user.id,
            clientId: proposalData.clientId,
            proposalNumber: candidateNumber,
            title: proposalData.title,
            status: proposalData.status || "DRAFT",
            validUntil: new Date(proposalData.validUntil),
            total: proposalData.total,
            aiGenerated: proposalData.aiGenerated ?? false,
            sections: {
              create: sections.map((section, index) => ({
                title: section.title,
                content: section.content,
                order: section.order ?? index,
              })),
            },
          },
          include: {
            client: true,
            sections: { orderBy: { order: "asc" } },
          },
        });

        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          if (hasCustomNumber) {
            return badRequest("Proposal number already exists");
          }
          candidateNumber = await getNextProposalNumber(session.user.id);
          continue;
        }

        throw error;
      }
    }

    if (!proposal) {
      return badRequest("Could not assign a unique proposal number. Please try again.");
    }

    return NextResponse.json({ data: proposal }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
