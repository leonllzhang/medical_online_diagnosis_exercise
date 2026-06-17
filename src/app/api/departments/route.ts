import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ code: 0, data: departments });
  } catch (error) {
    console.error("Departments error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取科室列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ code: 1, msg: "请输入科室名称" }, { status: 400 });
    }

    await prisma.department.create({ data: { name: name.trim() } });
    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error("Create department error:", error);
    return NextResponse.json(
      { code: 1, msg: "创建失败" },
      { status: 500 }
    );
  }
}
