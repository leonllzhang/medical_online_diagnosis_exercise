import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
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

    const records = await prisma.examRecord.findMany({
      where: where as any,
      orderBy: { finishedAt: "desc" },
    });

    const data = records.map((r) => ({
      "姓名": r.name,
      "科室": r.department,
      "角色": r.roleName || "",
      "得分": `${r.score}/${r.total}`,
      "正确率": `${r.percentage}%`,
      "结果": r.status === "pass" ? "合格" : "不合格",
      "完成时间": r.finishedAt?.toISOString().slice(0, 19).replace("T", " ") || "",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "考核记录");

    // Auto-fit column widths
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...data.map((row) => String(row[key as keyof typeof row]).length)
      ) + 2,
    }));
    worksheet["!cols"] = colWidths;

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="考核记录_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { code: 1, msg: "导出失败" },
      { status: 500 }
    );
  }
}
