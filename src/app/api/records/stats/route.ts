import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
    }

    const [totalRecords, passRecords, departmentStats, recentRecords] =
      await Promise.all([
        prisma.examRecord.count(),
        prisma.examRecord.count({ where: { status: "pass" } }),
        prisma.examRecord.groupBy({
          by: ["department"],
          _count: { id: true },
          _avg: { percentage: true },
          orderBy: { _count: { id: "desc" } },
        }),
        prisma.examRecord.findMany({
          orderBy: { finishedAt: "desc" },
          take: 5,
          select: {
            name: true,
            department: true,
            percentage: true,
            status: true,
            finishedAt: true,
          },
        }),
      ]);

    const passRate = totalRecords > 0
      ? Math.round((passRecords / totalRecords) * 1000) / 10
      : 0;

    return NextResponse.json({
      code: 0,
      data: {
        totalRecords,
        passRecords,
        failRecords: totalRecords - passRecords,
        passRate,
        departmentStats: departmentStats.map((d) => ({
          department: d.department,
          count: d._count.id,
          avgPercentage: Math.round((d._avg.percentage || 0) * 10) / 10,
        })),
        recentRecords: recentRecords.map((r) => ({
          name: r.name,
          department: r.department,
          percentage: r.percentage,
          status: r.status,
          finishedAt: r.finishedAt?.toISOString() || "",
        })),
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取统计失败" },
      { status: 500 }
    );
  }
}
