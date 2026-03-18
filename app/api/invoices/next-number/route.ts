import { NextResponse } from "next/server";
import { getNextInvoiceNumber } from "@/lib/numbering";
import { getAuthSession, unauthorized, serverError } from "@/lib/session";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const nextNumber = await getNextInvoiceNumber(session.user.id);

    return NextResponse.json({ data: { nextNumber } });
  } catch (error) {
    return serverError(error);
  }
}
