import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { id: "asc" },
    });

    // Strip answers for exam-mode listing
    const safe = questions.map((q) => ({
      id: q.id,
      chapterId: q.chapterId,
      type: q.type,
      stem: q.stem,
      options: q.options,
    }));

    return NextResponse.json({ code: 0, data: safe });
  } catch (error) {
    console.error("Questions error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取题目失败" },
      { status: 500 }
    );
  }
}
