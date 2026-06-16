import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        configs: {
          include: { chapter: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const items = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      configs: r.configs.map((c) => ({
        id: c.id,
        chapterId: c.chapterId,
        chapterTitle: c.chapter.title,
        questionCount: c.questionCount,
      })),
    }));

    return NextResponse.json({ code: 0, data: items });
  } catch (error) {
    console.error("Roles error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取角色列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json(
        { code: 1, msg: "角色名称不能为空" },
        { status: 400 }
      );
    }

    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { code: 1, msg: "角色已存在" },
        { status: 409 }
      );
    }

    const role = await prisma.role.create({
      data: { name, description },
    });

    return NextResponse.json({ code: 0, data: { id: role.id, name: role.name } });
  } catch (error) {
    console.error("Create role error:", error);
    return NextResponse.json(
      { code: 1, msg: "创建角色失败" },
      { status: 500 }
    );
  }
}
