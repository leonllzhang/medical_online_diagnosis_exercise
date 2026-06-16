import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { id: "asc" },
    });

    const chapters = await prisma.chapter.findMany({ orderBy: { id: "asc" } });

    const grouped = chapters.map((ch) => ({
      chapterId: ch.id,
      chapterTitle: ch.title,
      questions: questions
        .filter((q) => q.chapterId === ch.id)
        .map((q) => ({
          id: q.id,
          type: q.type,
          stem: q.stem,
          options: q.options,
          answer: q.answer,
        })),
    }));

    return NextResponse.json({ code: 0, data: grouped });
  } catch (error) {
    console.error("Chapters error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取章节题目失败" },
      { status: 500 }
    );
  }
}
