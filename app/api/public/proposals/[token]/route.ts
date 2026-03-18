import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncDocumentLifecycles } from "@/lib/lifecycle";
import { notFound, serverError } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { publicToken: params.token },
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
          },
        },
      },
    });

    if (!proposal) return notFound("Proposal");

    await syncDocumentLifecycles(proposal.userId);

    if (proposal.status === "SENT") {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: "VIEWED" },
      });
      proposal.status = "VIEWED";
    }

    return NextResponse.json({ data: proposal });
  } catch (error) {
    return serverError(error);
  }
}
