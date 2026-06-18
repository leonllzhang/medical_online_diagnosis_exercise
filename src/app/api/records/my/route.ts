import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
    }

    const records = await prisma.examRecord.findMany({
      where: { userId: auth.userId },
      orderBy: { finishedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      code: 0,
      data: records.map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        roleName: r.roleName,
        score: r.score,
        total: r.total,
        percentage: r.percentage,
        status: r.status,
        finished_at: r.finishedAt?.toISOString() || "",
      })),
    });
  } catch (error) {
    console.error("My records error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取记录失败" },
      { status: 500 }
    );
  }
}
