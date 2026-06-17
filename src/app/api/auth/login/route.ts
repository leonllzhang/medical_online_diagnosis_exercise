import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, department } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { code: 1, msg: "请输入手机号" },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { code: 1, msg: "请输入姓名" },
        { status: 400 }
      );
    }
    if (!department) {
      return NextResponse.json(
        { code: 1, msg: "请选择科室" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { code: 1, msg: "该手机号未注册，请先注册" },
        { status: 404 }
      );
    }

    if (user.name !== name) {
      return NextResponse.json(
        { code: 1, msg: "姓名与手机号不匹配" },
        { status: 400 }
      );
    }

    if (user.department !== department) {
      return NextResponse.json(
        { code: 1, msg: "科室信息不匹配" },
        { status: 400 }
      );
    }

    const token = await createToken({
      userId: user.id,
      phone: user.phone,
      isAdmin: user.isAdmin,
    });

    return NextResponse.json({
      code: 0,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          department: user.department,
          roleId: user.roleId,
          roleName: user.role?.name || null,
          isAdmin: user.isAdmin,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { code: 1, msg: "登录失败，请重试" },
      { status: 500 }
    );
  }
}
