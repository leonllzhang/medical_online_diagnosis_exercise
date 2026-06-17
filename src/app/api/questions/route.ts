import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ code: 0, data: questions });
  } catch (error) {
    console.error("Questions error:", error);
    return NextResponse.json(
      { code: 1, msg: "获取题目失败" },
      { status: 500 }
    );
  }
}
