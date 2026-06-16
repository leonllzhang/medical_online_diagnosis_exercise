import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { calculateScore } from "@/lib/exam";
import { PASS_THRESHOLD } from "@/lib/utils";

export async function POST(
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
    if (!session || session.status !== "in_progress") {
      return NextResponse.json(
        { code: 1, msg: "会话不存在或已结束" },
        { status: 404 }
      );
    }

    const questions = JSON.parse(session.questionsJson);
    const answers = JSON.parse(session.answersJson);

    const { score, detail } = calculateScore(questions, answers);
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 1000) / 10 : 0;
    const statusResult = percentage >= PASS_THRESHOLD ? "pass" : "fail";

    const now = new Date();

    await prisma.examSession.update({
      where: { id: params.id },
      data: {
        status: "finished",
        score,
        total,
        percentage,
        statusResult,
        finishedAt: now,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (user) {
      await prisma.examRecord.create({
        data: {
          sessionId: params.id,
          userId: user.id,
          name: user.name,
          department: user.department,
          roleName: session.roleName,
          score,
          total,
          percentage,
          status: statusResult,
          detailsJson: JSON.stringify(detail),
          finishedAt: now,
        },
      });
    }

    return NextResponse.json({
      code: 0,
      data: {
        sessionId: params.id,
        score,
        total,
        percentage,
        status: statusResult,
      },
    });
  } catch (error) {
    console.error("Finish exam error:", error);
    return NextResponse.json(
      { code: 1, msg: "提交失败" },
      { status: 500 }
    );
  }
}
