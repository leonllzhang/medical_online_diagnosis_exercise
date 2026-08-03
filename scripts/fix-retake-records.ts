// 一次性修复脚本：用合并计分逻辑重算历史错题补考记录
// 运行方式: npx tsx scripts/fix-retake-records.ts
//
// 背景: 旧的补考逻辑只按补考题算分（补考对 8/19 = 42% 判不合格），
//       修复后应按合并计分（原考试答对 + 补考答对）/ 原考试总题数。
//       此脚本对数据库中已存在的补考会话/记录重新计算并更新。

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AnswerItem {
  selected?: string[];
}

interface QuestionLike {
  answer?: string[];
}

function checkAnswer(q: QuestionLike, selected: string[] | undefined): boolean {
  const correctSet = new Set(q.answer || []);
  const selectedSet = new Set(selected || []);
  if (correctSet.size !== selectedSet.size) return false;
  return Array.from(correctSet).every((a) => selectedSet.has(a));
}

function countCorrect(
  questions: QuestionLike[],
  answers: AnswerItem[]
): number {
  let n = 0;
  for (let i = 0; i < questions.length; i++) {
    const ans = answers[i] || { selected: [] };
    if (checkAnswer(questions[i], ans.selected || [])) n++;
  }
  return n;
}

async function main() {
  const threshold = parseInt(process.env.PASS_THRESHOLD || "60", 10);

  const retakes = await prisma.examSession.findMany({
    where: { retakeOf: { not: null }, status: "finished" },
  });

  console.log(`找到 ${retakes.length} 条已完成的补考会话\n`);

  let fixed = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const r of retakes) {
    const original = await prisma.examSession.findUnique({
      where: { id: r.retakeOf! },
    });
    if (!original) {
      console.warn(`[跳过] 找不到原会话: ${r.retakeOf}`);
      skipped++;
      continue;
    }

    const originalQuestions = JSON.parse(original.questionsJson) as QuestionLike[];
    const originalTotal = originalQuestions.length;

    const retakeQuestions = JSON.parse(r.questionsJson) as QuestionLike[];
    const retakeAnswers = JSON.parse(r.answersJson) as AnswerItem[];

    // 补考题 = 创建补考时仍然答错的题，因此 原考试答对数 = 总题数 - 补考题数
    const originalCorrect = originalTotal - retakeQuestions.length;
    const retakeCorrect = countCorrect(retakeQuestions, retakeAnswers);
    const combinedScore = originalCorrect + retakeCorrect;
    const percentage =
      originalTotal > 0
        ? Math.round((combinedScore / originalTotal) * 1000) / 10
        : 0;
    const status = percentage >= threshold ? "pass" : "fail";

    if (
      r.score === combinedScore &&
      r.total === originalTotal &&
      r.percentage === percentage &&
      r.statusResult === status
    ) {
      unchanged++;
      continue;
    }

    await prisma.examSession.update({
      where: { id: r.id },
      data: {
        score: combinedScore,
        total: originalTotal,
        percentage,
        statusResult: status,
      },
    });

    await prisma.examRecord.updateMany({
      where: { sessionId: r.id },
      data: {
        score: combinedScore,
        total: originalTotal,
        percentage,
        status,
      },
    });

    console.log(
      `[修复] ${r.id}\n` +
        `  原考试 ${originalCorrect}/${originalTotal} + 补考对 ${retakeCorrect} → ` +
        `${combinedScore}/${originalTotal} (${percentage}%) ${status}\n`
    );
    fixed++;
  }

  console.log(
    `\n完成：修复 ${fixed} 条，无需改动 ${unchanged} 条，跳过 ${skipped} 条`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
