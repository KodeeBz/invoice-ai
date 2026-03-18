import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { badRequest, notFound, serverError } from "@/lib/session";

const responseSchema = z.object({
  action: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const rateLimited = applyRateLimit(request, {
      windowMs: 60_000,
      max: 10,
      keyPrefix: "public:proposal:respond",
    });
    if (rateLimited) return rateLimited;

    const proposal = await prisma.proposal.findUnique({
      where: { publicToken: params.token },
      select: { id: true, status: true },
    });

    if (!proposal) return notFound("Proposal");

    if (proposal.status === "EXPIRED") {
      return badRequest("Expired proposals cannot be updated");
    }

    const body = await request.json();
    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: parsed.data.action },
    });

    return Response.json({ data: { success: true, status: parsed.data.action } });
  } catch (error) {
    return serverError(error);
  }
}
