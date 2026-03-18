import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { sendProposalEmail } from "@/lib/email";
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
      { windowMs: 60_000, max: 6, keyPrefix: "proposal:send" },
      session.user.id
    );
    if (rateLimited) return rateLimited;

    const proposal = await prisma.proposal.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        sections: { orderBy: { order: "asc" } },
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

    if (!proposal) return notFound("Proposal");

    if (!proposal.pdfUrl) {
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
      proposal.user.businessName || proposal.user.name;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    await sendProposalEmail({
      to: proposal.client.email,
      cc: proposal.user.email ?? undefined,
      proposalNumber: proposal.proposalNumber,
      title: proposal.title,
      businessName,
      businessLogo: proposal.user.businessLogo,
      clientName: proposal.client.name,
      total: proposal.total,
      validUntil: proposal.validUntil.toISOString(),
      pdfUrl: proposal.pdfUrl,
      publicViewUrl: `${appUrl}/view/proposal/${proposal.publicToken}`,
      personalMessage: parsed.data.personalMessage,
    });

    // Update status to SENT
    await prisma.proposal.update({
      where: { id: params.id },
      data: { status: "SENT" },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return serverError(error);
  }
}
