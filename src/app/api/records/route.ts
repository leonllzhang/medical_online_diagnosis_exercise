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

    const [records, total] = await Promise.all([
      prisma.examRecord.findMany({
        where: where as any,
        orderBy: { finishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.examRecord.count({ where: where as any }),
    ]);

    return NextResponse.json({
      code: 0,
      data: {
        records: records.map((r) => ({
          id: r.id,
          name: r.name,
          department: r.department,
          roleName: r.roleName,
          score: r.score,
          total: r.total,
          percentage: r.percentage,
          status: r.status,
          finishedAt: r.finishedAt?.toISOString() || "",
        })),
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
