import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(
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

    const { questionIndex, selected, revealed, currentIndex } =
      await request.json();

    const answers = JSON.parse(session.answersJson);
    if (
      questionIndex !== undefined &&
      questionIndex >= 0 &&
      questionIndex < answers.length
    ) {
      answers[questionIndex] = {
        selected: selected || [],
        revealed: revealed !== undefined ? revealed : true,
      };
    }

    await prisma.examSession.update({
      where: { id: params.id },
      data: {
        answersJson: JSON.stringify(answers),
        currentIndex:
          currentIndex !== undefined ? currentIndex : session.currentIndex,
      },
    });

    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ code: 1, msg: "保存答案失败" }, { status: 500 });
  }
}
