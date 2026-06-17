import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { id: "asc" },
    });

    const chapters = await prisma.chapter.findMany({ orderBy: { id: "asc" } });

    const data = chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      count: questions.filter((q) => q.chapterId === ch.id).length,
    }));

    return NextResponse.json({ code: 0, data });
  } catch (error) {
    console.error("Chapters error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取章节题目失败" },
      { status: 500 }
    );
  }
}
