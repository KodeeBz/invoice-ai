import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/session";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PUT(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { currentPassword, newPassword } = parsed.data;

    if (currentPassword === newPassword) {
      return badRequest("New password must be different from current password");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user) return unauthorized();

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return badRequest("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    return serverError(error);
  }
}
