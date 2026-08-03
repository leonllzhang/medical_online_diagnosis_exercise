// 一次性清理脚本：删除"已及格后又重新考试且不及格"的记录
// 运行方式:
//   npx tsx scripts/cleanup-failed-after-pass.ts          # 预览模式（不删除）
//   npx tsx scripts/cleanup-failed-after-pass.ts --execute # 真正删除
//
// 背景: 用户及格后仍可在考试页点击"开始考试"重新考试，
//       若做一半就交卷会产生一条不及格记录，污染统计和记录页。
//       此脚本删除满足以下条件的记录:
//       1. 状态为 fail（不及格）
//       2. 非补考会话（session.retakeOf 为空，即完整重新考试的）
//       3. 该用户在本次不及格之前已有及格记录

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const execute = process.argv.includes("--execute");

  const failRecords = await prisma.examRecord.findMany({
    where: { status: "fail" },
    orderBy: { finishedAt: "asc" },
    select: {
      id: true,
      sessionId: true,
      userId: true,
      name: true,
      score: true,
      total: true,
      percentage: true,
      finishedAt: true,
    },
  });

  if (failRecords.length === 0) {
    console.log("没有不及格记录");
    return;
  }

  // 查出这些记录对应会话的 retakeOf，过滤掉补考会话
  const sessionIds = failRecords.map((r) => r.sessionId);
  const sessions = await prisma.examSession.findMany({
    where: { id: { in: sessionIds } },
    select: { id: true, retakeOf: true },
  });
  const retakeOfMap = new Map(sessions.map((s) => [s.id, s.retakeOf]));
  const referencedSessionIds = new Set(
    sessions.filter((s) => s.retakeOf).map((s) => s.retakeOf)
  );

  const candidates = [];
  for (const r of failRecords) {
    if (retakeOfMap.get(r.sessionId)) continue; // 补考会话，跳过
    if (!r.userId || !r.finishedAt) continue;
    const priorPass = await prisma.examRecord.findFirst({
      where: {
        userId: r.userId,
        status: "pass",
        finishedAt: { lt: r.finishedAt },
      },
    });
    if (priorPass) candidates.push(r);
  }

  console.log(
    `共 ${failRecords.length} 条不及格记录，其中 ${candidates.length} 条为"已及格后又重考"的记录\n`
  );

  for (const c of candidates) {
    const sessionKept = referencedSessionIds.has(c.sessionId);
    console.log(
      `[${execute ? "已删除" : "待删除"}] ${c.name} ${c.score}/${c.total} (${c.percentage}%) ` +
        `${c.finishedAt?.toISOString().slice(0, 10) || ""}` +
        (sessionKept ? " | 会话被补考引用，仅删除记录" : "")
    );
  }

  if (!execute) {
    console.log("\n以上是预览，未做任何修改。确认无误后加 --execute 执行。");
    return;
  }

  for (const c of candidates) {
    await prisma.examRecord.delete({ where: { id: c.id } });
    if (!referencedSessionIds.has(c.sessionId)) {
      await prisma.examSession.delete({ where: { id: c.sessionId } });
    }
  }
  console.log(`\n已删除 ${candidates.length} 条记录及对应会话`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
