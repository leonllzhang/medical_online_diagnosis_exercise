import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
    }

    const records = await prisma.examRecord.findMany({
      where: { userId: params.id },
      orderBy: { finishedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      code: 0,
      data: records.map((r) => ({
        id: r.id,
        roleName: r.roleName,
        score: r.score,
        total: r.total,
        percentage: r.percentage,
        status: r.status,
        finished_at: r.finishedAt?.toISOString() || "",
      })),
    });
  } catch (error) {
    console.error("User records error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取用户记录失败" },
      { status: 500 }
    );
  }
}
