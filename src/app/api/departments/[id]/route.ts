import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.department.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error("Delete department error:", error);
    return NextResponse.json(
      { code: 1, msg: "删除失败" },
      { status: 500 }
    );
  }
}
