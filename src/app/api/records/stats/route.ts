import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
    }

    const [
      totalRegisteredUsers,
      totalRecords,
      passedUserIds,
      allUserIds,
      userDeptPairs,
      deptStats,
      recentRecords,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.examRecord.count(),
      prisma.examRecord.findMany({
        where: { status: "pass", userId: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.examRecord.findMany({
        where: { userId: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.examRecord.findMany({
        where: { userId: { not: null } },
        select: { userId: true, department: true },
        distinct: ["userId", "department"],
      }),
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

    const passedUsers = passedUserIds.length;
    const totalExamUsers = allUserIds.length;
    const failedUsers = totalExamUsers - passedUsers;
    const passRate =
      totalExamUsers > 0
        ? Math.round((passedUsers / totalExamUsers) * 1000) / 10
        : 0;

    // Compute unique user count per department
    const userCountByDept = new Map<string, number>();
    for (const pair of userDeptPairs) {
      userCountByDept.set(
        pair.department,
        (userCountByDept.get(pair.department) || 0) + 1
      );
    }

    const departmentStats = deptStats.map((d) => ({
      department: d.department,
      userCount: userCountByDept.get(d.department) || 0,
      totalRecords: d._count.id,
      avgPercentage: Math.round((d._avg.percentage || 0) * 10) / 10,
    }));

    return NextResponse.json({
      code: 0,
      data: {
        totalRegisteredUsers,
        totalExamUsers,
        passedUsers,
        failedUsers,
        passRate,
        totalRecords,
        departmentStats,
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
