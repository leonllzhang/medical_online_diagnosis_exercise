import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const name = searchParams.get("name") || "";
    const department = searchParams.get("department") || "";

    const where: Record<string, unknown> = {};
    if (name) where.name = { contains: name };
    if (department) where.department = { contains: department };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: where as any,
        include: { role: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where: where as any }),
    ]);

    return NextResponse.json({
      code: 0,
      data: {
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          department: u.department,
          roleName: u.role?.name || "",
          isAdmin: u.isAdmin,
          createdAt: u.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取用户列表失败" },
      { status: 500 }
    );
  }
}
