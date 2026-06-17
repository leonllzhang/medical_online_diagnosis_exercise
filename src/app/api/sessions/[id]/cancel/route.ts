import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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

    if (!session || session.userId !== auth.userId) {
      return NextResponse.json(
        { code: 1, msg: "会话不存在" },
        { status: 404 }
      );
    }

    await prisma.examSession.update({
      where: { id: params.id },
      data: { status: "abandoned" },
    });

    return NextResponse.json({ code: 0, msg: "已放弃当前考试" });
  } catch (error) {
    console.error("Cancel session error:", error);
    return NextResponse.json(
      { code: 1, msg: "操作失败" },
      { status: 500 }
    );
  }
}
