import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth";
import { canEditPage } from "@/lib/permissions";
import { extractTextFromTipTapContent } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireDbUser();
    const { id } = await params;

    const canEdit = await canEditPage(user.id, id);
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const text = extractTextFromTipTapContent(page.content);
    if (!text.trim()) {
      return NextResponse.json(
        { error: "Page has no content to summarize" },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You summarize notes for students. Return a concise study-note style summary with bullet points when helpful.",
        },
        {
          role: "user",
          content: `Title: ${page.title}\n\nContent:\n${text}`,
        },
      ],
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 },
      );
    }

    await prisma.page.update({
      where: { id },
      data: { summary },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to summarize page";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
