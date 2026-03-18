import { NextResponse } from "next/server";
import { getNextProposalNumber } from "@/lib/numbering";
import { getAuthSession, unauthorized, serverError } from "@/lib/session";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const nextNumber = await getNextProposalNumber(session.user.id);

    return NextResponse.json({ data: { nextNumber } });
  } catch (error) {
    return serverError(error);
  }
}
