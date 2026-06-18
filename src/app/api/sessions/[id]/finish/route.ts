import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { calculateScore, checkAnswer } from "@/lib/exam";
import { PASS_THRESHOLD } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
    }

    const session = await prisma.examSession.findUnique({
      where: { id: params.id },
    });
    if (!session || session.status !== "in_progress") {
      return NextResponse.json(
        { code: 1, msg: "会话不存在或已结束" },
        { status: 404 }
      );
    }

    const questions = JSON.parse(session.questionsJson);
    const answers = JSON.parse(session.answersJson);

    const { score, detail } = calculateScore(questions, answers);
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 1000) / 10 : 0;
    const statusResult = percentage >= PASS_THRESHOLD ? "pass" : "fail";

    const now = new Date();

    await prisma.examSession.update({
      where: { id: params.id },
      data: {
        status: "finished",
        score,
        total,
        percentage,
        statusResult,
        finishedAt: now,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    // For retake sessions: combine with original score
    let finalScore = score;
    let finalTotal = total;
    let finalPercentage = percentage;
    let finalStatus = statusResult;
    let finalDetail = detail;

    if (session.retakeOf) {
      const original = await prisma.examSession.findUnique({
        where: { id: session.retakeOf },
      });
      if (original) {
        const originalQuestions = JSON.parse(original.questionsJson);
        const originalAnswers = JSON.parse(original.answersJson);
        const retakeQuestions = JSON.parse(session.questionsJson);

        // Build questionId -> retake answer map
        const retakeMap = new Map();
        for (let i = 0; i < retakeQuestions.length; i++) {
          retakeMap.set(retakeQuestions[i].id, answers[i]);
        }

        // Recalculate combined score across all original questions
        let combinedScore = 0;
        const combinedDetail = [];
        const updatedOriginalAnswers = [...originalAnswers];
        for (let i = 0; i < originalQuestions.length; i++) {
          const q = originalQuestions[i];
          const origAns = originalAnswers[i] || { selected: [] };
          const retakeAns = retakeMap.get(q.id);
          // Use retake answer if the question was retaken, otherwise keep original
          const effectiveAns = retakeAns || origAns;
          const correct = checkAnswer(q, effectiveAns.selected || []);
          if (correct) combinedScore++;
          combinedDetail.push({
            questionId: q.id,
            correct,
            correctAnswer: q.answer,
          });
          // Merge retake answer back into original for subsequent retakes
          if (retakeAns) {
            updatedOriginalAnswers[i] = retakeAns;
          }
        }

        const combinedTotal = originalQuestions.length;
        const combinedPercentage =
          combinedTotal > 0
            ? Math.round((combinedScore / combinedTotal) * 1000) / 10
            : 0;
        const combinedStatus =
          combinedPercentage >= PASS_THRESHOLD ? "pass" : "fail";

        // Update original session score + answers (so subsequent retakes see correct state)
        await prisma.examSession.update({
          where: { id: session.retakeOf },
          data: {
            score: combinedScore,
            total: combinedTotal,
            percentage: combinedPercentage,
            statusResult: combinedStatus,
            answersJson: JSON.stringify(updatedOriginalAnswers),
          },
        });

        // Update original exam record
        await prisma.examRecord.update({
          where: { sessionId: session.retakeOf },
          data: {
            score: combinedScore,
            total: combinedTotal,
            percentage: combinedPercentage,
            status: combinedStatus,
            detailsJson: JSON.stringify(combinedDetail),
          },
        });

        finalScore = combinedScore;
        finalTotal = combinedTotal;
        finalPercentage = combinedPercentage;
        finalStatus = combinedStatus;
        finalDetail = combinedDetail;
      }
    }

    // Create exam record for retake session (always)
    if (user) {
      await prisma.examRecord.create({
        data: {
          sessionId: params.id,
          userId: user.id,
          name: user.name,
          department: user.department,
          roleName: session.roleName,
          score: finalScore,
          total: finalTotal,
          percentage: finalPercentage,
          status: finalStatus,
          detailsJson: JSON.stringify(finalDetail),
          finishedAt: now,
        },
      });
    }

    return NextResponse.json({
      code: 0,
      data: {
        sessionId: params.id,
        score: finalScore,
        total: finalTotal,
        percentage: finalPercentage,
        status: finalStatus,
        isRetake: !!session.retakeOf,
        originalSessionId: session.retakeOf || undefined,
      },
    });
  } catch (error) {
    console.error("Finish exam error:", error);
    return NextResponse.json(
      { code: 1, msg: "提交失败" },
      { status: 500 }
    );
  }
}
