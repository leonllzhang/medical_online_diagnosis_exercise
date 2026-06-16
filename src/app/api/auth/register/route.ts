import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, department, roleId } = await request.json();

    if (!name || !phone || !department) {
      return NextResponse.json(
        { code: 1, msg: "请填写姓名、手机号和科室" },
        { status: 400 }
      );
    }

    // Check if phone already registered
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { code: 1, msg: "该手机号已注册，请直接登录" },
        { status: 409 }
      );
    }

    // Verify role exists if provided
    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return NextResponse.json(
          { code: 1, msg: "角色不存在" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.create({
      data: { name, phone, department, roleId: roleId || null },
      include: { role: true },
    });

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
    console.error("Register error:", error);
    return NextResponse.json(
      { code: 1, msg: "注册失败，请重试" },
      { status: 500 }
    );
  }
}
