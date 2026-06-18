import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkAnswer } from "@/lib/exam";
import type { Question } from "@/types/question";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
    }

    const { originalSessionId } = await request.json();
    if (!originalSessionId) {
      return NextResponse.json(
        { code: 1, msg: "缺少原考试会话ID" },
        { status: 400 }
      );
    }

    // Get original finished session
    const original = await prisma.examSession.findUnique({
      where: { id: originalSessionId },
    });
    if (!original || original.status !== "finished") {
      return NextResponse.json(
        { code: 1, msg: "原考试未完成或不存在" },
        { status: 404 }
      );
    }
    if (original.userId !== auth.userId) {
      return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
    }

    const originalQuestions = JSON.parse(original.questionsJson);
    const originalAnswers = JSON.parse(original.answersJson);

    // Find wrong questions
    const wrongQuestions: Question[] = [];
    for (let i = 0; i < originalQuestions.length; i++) {
      const q = originalQuestions[i];
      const ans = originalAnswers[i] || { selected: [] };
      if (!checkAnswer(q, ans.selected || [])) {
        wrongQuestions.push(q);
      }
    }

    if (wrongQuestions.length === 0) {
      return NextResponse.json(
        { code: 1, msg: "没有需要重考的错题" },
        { status: 400 }
      );
    }

    // Create retake session
    const session = await prisma.examSession.create({
      data: {
        userId: auth.userId,
        roleId: original.roleId,
        roleName: original.roleName,
        retakeOf: originalSessionId,
        questionsJson: JSON.stringify(wrongQuestions),
        answersJson: JSON.stringify(
          wrongQuestions.map(() => ({ selected: [], revealed: false }))
        ),
        status: "in_progress",
        currentIndex: 0,
      },
    });

    return NextResponse.json({
      code: 0,
      data: {
        sessionId: session.id,
        resume: false,
        currentIndex: 0,
        questions: wrongQuestions.map((q) => ({
          id: q.id,
          chapterId: q.chapterId,
          type: q.type,
          stem: q.stem,
          options: q.options,
          answer: q.answer,
        })),
        answers: wrongQuestions.map(() => ({
          selected: [],
          revealed: false,
        })),
        roleName: original.roleName,
        totalOriginal: originalQuestions.length,
        originalScore: original.score,
        originalCorrectCount: originalQuestions.length - wrongQuestions.length,
      },
    });
  } catch (error) {
    console.error("Retake error:", error);
    return NextResponse.json(
      { code: 1, msg: "创建错题重考失败" },
      { status: 500 }
    );
  }
}
