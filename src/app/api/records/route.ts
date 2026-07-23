import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const name = searchParams.get("name") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const where: Record<string, unknown> = {};
    if (name) where.name = { contains: name };
    if (department) where.department = { contains: department };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.finishedAt = {};
      if (dateFrom) (where.finishedAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.finishedAt as Record<string, unknown>).lte = new Date(dateTo + "T23:59:59");
    }

    // Get paginated user groups (name + department as compound key)
    const groups = await prisma.examRecord.groupBy({
      by: ["name", "department"],
      where: where as any,
      _count: { id: true },
      _max: { percentage: true, finishedAt: true },
      orderBy: { _max: { finishedAt: "desc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get total group count for pagination
    const allGroups = await prisma.examRecord.groupBy({
      by: ["name", "department"],
      where: where as any,
      _count: { id: true },
    });
    const total = allGroups.length;

    // Fetch all records for the groups on current page
    const wherePairs = groups.map((g) => ({
      name: g.name,
      department: g.department,
    }));

    const allRecords =
      wherePairs.length > 0
        ? await prisma.examRecord.findMany({
            where: {
              ...(where as any),
              OR: wherePairs.map((p) => ({
                name: p.name,
                department: p.department,
              })),
            },
            orderBy: [{ name: "asc" }, { finishedAt: "desc" }],
          })
        : [];

    // Group records on server side
    const users = groups.map((g) => {
      const records = allRecords.filter(
        (r) => r.name === g.name && r.department === g.department
      );
      return {
        name: g.name,
        department: g.department,
        totalAttempts: g._count.id,
        bestPercentage: g._max.percentage,
        latestStatus: records[0]?.status || "",
        records: records.map((r) => ({
          id: r.id,
          sessionId: r.sessionId,
          score: r.score,
          total: r.total,
          percentage: r.percentage,
          status: r.status,
          finishedAt: r.finishedAt?.toISOString() || "",
        })),
      };
    });

    return NextResponse.json({
      code: 0,
      data: {
        users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Records error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取记录失败" },
      { status: 500 }
    );
  }
}
