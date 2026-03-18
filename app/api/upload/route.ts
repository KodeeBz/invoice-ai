import { NextResponse } from "next/server";
import { getAuthSession, unauthorized, badRequest, serverError } from "@/lib/session";
import { cloudinary } from "@/lib/cloudinary";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return badRequest("File is required");
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return badRequest("Only JPEG, PNG, and WEBP images are allowed");
    }

    if (file.size > MAX_SIZE_BYTES) {
      return badRequest("File size must be 5MB or smaller");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: "invoice-ai/logos",
      public_id: `${session.user.id}-${Date.now()}`,
      resource_type: "image",
      overwrite: true,
    });

    return NextResponse.json({ data: { url: uploaded.secure_url } }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
