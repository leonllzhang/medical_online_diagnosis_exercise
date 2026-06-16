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

    const { chapters } = await request.json();

    // Delete old configs
    await prisma.roleConfig.deleteMany({ where: { roleId: params.id } });

    // Create new configs
    for (const ch of chapters) {
      await prisma.roleConfig.create({
        data: {
          roleId: params.id,
          chapterId: ch.chapterId,
          questionCount: ch.questionCount || 0,
        },
      });
    }

    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error("Save config error:", error);
    return NextResponse.json(
      { code: 1, msg: "保存配置失败" },
      { status: 500 }
    );
  }
}
