import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePDF } from "@/lib/pdf";
import { renderProposalHtml } from "@/lib/proposal-html";
import { getAuthSession, unauthorized, notFound, serverError } from "@/lib/session";

export async function POST(
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

    const html = renderProposalHtml({
      proposalNumber: proposal.proposalNumber,
      status: proposal.status,
      title: proposal.title,
      validUntil: proposal.validUntil.toISOString(),
      sections: proposal.sections.map((s) => ({
        title: s.title,
        content: s.content,
      })),
      total: proposal.total,
      client: {
        name: proposal.client.name,
        email: proposal.client.email,
        company: proposal.client.company,
        address: proposal.client.address,
      },
      user: {
        name: proposal.user.name,
        businessName: proposal.user.businessName,
        businessLogo: proposal.user.businessLogo,
        address: proposal.user.address,
        phone: proposal.user.phone,
        taxNumber: proposal.user.taxNumber,
      },
    });

    const pdfBuffer = await generatePDF(html);

    // Store as base64 data URL for local dev
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    await prisma.proposal.update({
      where: { id: params.id },
      data: { pdfUrl: pdfDataUrl },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${proposal.proposalNumber}.pdf"`,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
