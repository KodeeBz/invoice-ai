import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { anthropic } from "@/lib/anthropic";
import { applyRateLimit } from "@/lib/rate-limit";
import { getAuthSession, unauthorized, badRequest, serverError } from "@/lib/session";

const requestSchema = z.object({
  clientName: z.string().min(1),
  projectTitle: z.string().min(1, "Project title is required"),
  projectDescription: z.string().min(1, "Project description is required"),
  timeline: z.string().min(1),
  budget: z.number().nullable().optional(),
  projectType: z.string().min(1),
  yourExperience: z.string().optional(),
});

const SYSTEM_PROMPT = `You are a professional freelance proposal writer. When given project details, you generate compelling, well-structured proposal sections that win clients.

Always respond with ONLY a valid JSON object in this exact structure. No markdown, no backticks, no explanation:
{
  "title": "string — professional proposal title",
  "sections": [
    {
      "title": "string — section heading",
      "content": "string — detailed section content, use bullet points with - for lists, use \\n\\n for paragraph breaks"
    }
  ],
  "total": number
}

Required sections (in this order):
1. Executive Summary — 2-3 sentences hooking the client
2. Project Understanding — Show you understand their needs
3. Scope of Work — Detailed breakdown of deliverables (use bullet points)
4. Timeline & Milestones — Phase-by-phase breakdown
5. Investment — Cost breakdown with justification
6. Why Choose Us — Your unique value proposition
7. Next Steps — Clear call to action

Rules:
- Content should be professional, persuasive, and specific to the project type
- Use bullet points (- prefix) for lists within sections
- Each section should be substantial (3-8 sentences or equivalent bullet points)
- The "total" should be a realistic price based on the project scope and any budget hint
- Tailor language to the industry and project type`;

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const rateLimited = applyRateLimit(
      request,
      { windowMs: 60_000, max: 8, keyPrefix: "ai:proposal" },
      session.user.id
    );
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const data = parsed.data;

    let userPrompt = `Generate a professional proposal for the following project:\n\n`;
    userPrompt += `Client: ${data.clientName}\n`;
    userPrompt += `Project Title: ${data.projectTitle}\n`;
    userPrompt += `Project Type: ${data.projectType}\n`;
    userPrompt += `Description: ${data.projectDescription}\n`;
    userPrompt += `Timeline: ${data.timeline}\n`;

    if (data.budget) {
      userPrompt += `Budget Range: $${data.budget}\n`;
    }
    if (data.yourExperience) {
      userPrompt += `Our Relevant Experience: ${data.yourExperience}\n`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return serverError(new Error("No text response from AI"));
    }

    let result;
    try {
      result = JSON.parse(textBlock.text);
    } catch {
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
