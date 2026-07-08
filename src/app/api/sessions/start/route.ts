import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { generatePaper } from "@/lib/exam";
import type { Question } from "@/types/question";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json(
        { code: 1, msg: "未登录" },
        { status: 401 }
      );
    }

    const { roleId } = await request.json();
    const userId = auth.userId;

    // Check for existing in-progress session
    const existing = await prisma.examSession.findFirst({
      where: { userId, status: "in_progress" },
    });

    if (existing) {
      const questions = JSON.parse(existing.questionsJson);
      const answers = JSON.parse(existing.answersJson);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      return NextResponse.json({
        code: 0,
        data: {
          sessionId: existing.id,
          resume: true,
          currentIndex: existing.currentIndex,
          questions: questions.map((q: Question) => ({
            id: q.id,
            chapterId: q.chapterId,
            chapterTitle: q.chapterTitle,
            type: q.type,
            stem: q.stem,
            options: q.options,
            answer: q.answer,
          })),
          answers,
          roleName: user?.role?.name || null,
        },
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      return NextResponse.json(
        { code: 1, msg: "用户不存在" },
        { status: 404 }
      );
    }

    // Determine role config — default to 医生 if none specified
    let activeRoleId = roleId || user.roleId;
    if (!activeRoleId) {
      const doctorRole = await prisma.role.findFirst({ where: { name: "医生" } });
      if (doctorRole) activeRoleId = doctorRole.id;
    }
    let configs: { chapterId: number; questionCount: number }[] = [];
    let roleName = "";

    if (activeRoleId) {
      const role = await prisma.role.findUnique({
        where: { id: activeRoleId },
        include: { configs: true },
      });
      if (role) {
        configs = role.configs.map((c) => ({
          chapterId: c.chapterId,
          questionCount: c.questionCount,
        }));
        roleName = role.name;
      }
    }

    // Get all questions
    const allQuestions = await prisma.question.findMany();

    // Generate paper using rule engine
    let selectedQuestions: Question[];
    if (configs.length > 0) {
      const mapped = allQuestions.map((q) => ({
        id: q.id,
        chapterId: q.chapterId,
        type: q.type as "single" | "multiple" | "truefalse",
        stem: q.stem,
        options: q.options as { label: string; text: string }[],
        answer: q.answer,
      }));
      selectedQuestions = generatePaper(mapped, configs);
    } else {
      // No config → all questions
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);
      selectedQuestions = shuffled.map((q) => ({
        id: q.id,
        chapterId: q.chapterId,
        type: q.type as "single" | "multiple" | "truefalse",
        stem: q.stem,
        options: q.options as { label: string; text: string }[],
        answer: q.answer,
      }));
    }

    // Create session
    const session = await prisma.examSession.create({
      data: {
        userId,
        roleId: activeRoleId,
        roleName,
        questionsJson: JSON.stringify(selectedQuestions),
        answersJson: JSON.stringify(
          selectedQuestions.map(() => ({ selected: [], revealed: false }))
        ),
        status: "in_progress",
        currentIndex: 0,
      },
    });

    return NextResponse.json({
      code: 0,
      data: {
        sessionId: session.id,
        resume: false,
        currentIndex: 0,
        questions: selectedQuestions.map((q) => ({
          id: q.id,
          chapterId: q.chapterId,
          type: q.type,
          stem: q.stem,
          options: q.options,
          answer: q.answer,
        })),
        answers: selectedQuestions.map(() => ({
          selected: [],
          revealed: false,
        })),
        roleName,
      },
    });
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json(
      { code: 1, msg: "开始考试失败" },
      { status: 500 }
    );
  }
}
