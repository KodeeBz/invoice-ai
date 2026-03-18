import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { anthropic } from "@/lib/anthropic";
import { applyRateLimit } from "@/lib/rate-limit";
import { getAuthSession, unauthorized, badRequest, serverError } from "@/lib/session";

const requestSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().optional(),
  projectDescription: z.string().min(1, "Project description is required"),
  projectType: z.string().min(1),
  estimatedHours: z.number().nullable().optional(),
  hourlyRate: z.number().nullable().optional(),
  fixedPrice: z.number().nullable().optional(),
  additionalContext: z.string().optional(),
});

const SYSTEM_PROMPT = `You are a professional freelance invoice assistant. When given project details, you generate realistic, itemized invoice line items that reflect industry-standard billing practices.

Always respond with ONLY a valid JSON object in this exact structure. No markdown, no backticks, no explanation:
{
  "lineItems": [
    {
      "description": "string — specific, professional description",
      "quantity": number,
      "unitPrice": number
    }
  ],
  "notes": "string — professional payment terms and thank-you note, 2-3 sentences",
  "suggestedDueDate": "number — days from today (e.g. 14 or 30)"
}

Rules:
- Line items must be specific, not generic (not "Development work" — say "Responsive frontend implementation using React and Tailwind CSS")
- Quantities represent hours, units, or milestones — pick what makes sense for the item
- Prices should be realistic for the Pakistani/South Asian freelance market but also internationally competitive
- Maximum 8 line items
- notes must mention payment method flexibility and a brief thank-you`;

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const rateLimited = applyRateLimit(
      request,
      { windowMs: 60_000, max: 8, keyPrefix: "ai:invoice" },
      session.user.id
    );
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const data = parsed.data;

    let userPrompt = `Generate invoice line items for the following project:\n\n`;
    userPrompt += `Client: ${data.clientName}\n`;
    userPrompt += `Project Type: ${data.projectType}\n`;
    userPrompt += `Description: ${data.projectDescription}\n`;

    if (data.estimatedHours) {
      userPrompt += `Estimated Hours: ${data.estimatedHours}\n`;
    }
    if (data.hourlyRate) {
      userPrompt += `Hourly Rate: $${data.hourlyRate}\n`;
    }
    if (data.fixedPrice) {
      userPrompt += `Fixed Price Budget: $${data.fixedPrice}\n`;
    }
    if (data.additionalContext) {
      userPrompt += `Additional Context: ${data.additionalContext}\n`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract text from response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return serverError(new Error("No text response from AI"));
    }

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(textBlock.text);
    } catch {
      // Try to extract JSON from potential markdown wrapping
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        return serverError(new Error("Failed to parse AI response"));
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    return serverError(error);
  }
}
