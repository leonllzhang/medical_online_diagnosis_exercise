import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
    if (!session || session.status !== "finished") {
      return NextResponse.json(
        { code: 1, msg: "考试未完成或不存在" },
        { status: 404 }
      );
    }

    const questions = JSON.parse(session.questionsJson);
    const answers = JSON.parse(session.answersJson);

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    const detail = questions.map(
      (q: { id: number; stem?: string; type?: string; options?: unknown[]; answer: string[] }, i: number) => {
        const ans = answers[i] || { selected: [] };
        return {
          questionId: q.id,
          stem: q.stem || "",
          type: q.type || "",
          options: q.options || [],
          selected: ans.selected || [],
          correctAnswer: q.answer || [],
          correct:
            JSON.stringify([...(ans.selected || [])].sort()) ===
            JSON.stringify([...q.answer].sort()),
        };
      }
    );

    return NextResponse.json({
      code: 0,
      data: {
        sessionId: session.id,
        name: user?.name || "",
        department: user?.department || "",
        roleName: session.roleName,
        score: session.score,
        total: session.total,
        percentage: session.percentage,
        status: session.statusResult,
        finished_at: session.finishedAt?.toISOString() || "",
        details: detail,
      },
    });
  } catch (error) {
    console.error("Get result error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取结果失败" },
      { status: 500 }
    );
  }
}
