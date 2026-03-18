import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePDF } from "@/lib/pdf";
import { renderInvoiceHtml } from "@/lib/invoice-html";
import { getAuthSession, unauthorized, notFound, serverError } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        lineItems: { orderBy: { order: "asc" } },
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

    if (!invoice) return notFound("Invoice");

    const html = renderInvoiceHtml({
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discountType: invoice.discountType,
      discountValue: invoice.discountValue,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      notes: invoice.notes,
      client: {
        name: invoice.client.name,
        email: invoice.client.email,
        company: invoice.client.company,
        address: invoice.client.address,
      },
      user: {
        name: invoice.user.name,
        businessName: invoice.user.businessName,
        businessLogo: invoice.user.businessLogo,
        address: invoice.user.address,
        phone: invoice.user.phone,
        taxNumber: invoice.user.taxNumber,
      },
    });

    // Generate PDF
    const pdfBuffer = await generatePDF(html);

    // Store as base64 data URL for local dev
    // In production, upload to Cloudinary and store URL
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    await prisma.invoice.update({
      where: { id: params.id },
      data: { pdfUrl: pdfDataUrl },
    });

    // Return the PDF as a downloadable response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
