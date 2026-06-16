import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import type { Question } from "@/types/question";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
    }

    const session = await prisma.examSession.findUnique({
      where: { id: params.id },
    });
    if (!session) {
      return NextResponse.json({ code: 1, msg: "会话不存在" }, { status: 404 });
    }

    const questions = JSON.parse(session.questionsJson);
    const answers = JSON.parse(session.answersJson);

    return NextResponse.json({
      code: 0,
      data: {
        sessionId: session.id,
        status: session.status,
        currentIndex: session.currentIndex,
        questions: questions.map((q: Question) => ({
          id: q.id,
          chapterId: q.chapterId,
          type: q.type,
          stem: q.stem,
          options: q.options,
          answer: q.answer,
        })),
        answers,
        roleName: session.roleName,
      },
    });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取会话失败" },
      { status: 500 }
    );
  }
}
