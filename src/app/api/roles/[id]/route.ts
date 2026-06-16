import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await prisma.role.findUnique({ where: { id: params.id } });
    if (!role) {
      return NextResponse.json({ code: 1, msg: "角色不存在" }, { status: 404 });
    }

    const { name, description } = await request.json();
    const data: { name?: string; description?: string } = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;

    await prisma.role.update({ where: { id: params.id }, data });

    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { code: 1, msg: "更新角色失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await prisma.role.findUnique({ where: { id: params.id } });
    if (!role) {
      return NextResponse.json({ code: 1, msg: "角色不存在" }, { status: 404 });
    }

    await prisma.role.delete({ where: { id: params.id } });

    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error("Delete role error:", error);
    return NextResponse.json(
      { code: 1, msg: "删除角色失败" },
      { status: 500 }
    );
  }
}
