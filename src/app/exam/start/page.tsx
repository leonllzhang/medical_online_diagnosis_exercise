"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSession, useSaveAnswer, useFinishExam } from "@/hooks/useExam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { TYPE_LABELS } from "@/types/question";
import { cn } from "@/lib/utils";

function QuestionCard({
  question,
  index,
  selected,
  revealed,
  onSelect,
  onConfirm,
  total,
}: {
  question: { id: number; type: string; stem: string; options: { label: string; text: string }[]; answer: string[] };
  index: number;
  selected: string[];
  revealed: boolean;
  onSelect: (labels: string[]) => void;
  onConfirm?: () => void;
  total: number;
}) {
  const handleOptionClick = (label: string) => {
    if (revealed) return;
    if (question.type === "single" || question.type === "truefalse") {
      onSelect([label]);
    } else {
      const next = selected.includes(label)
        ? selected.filter((l) => l !== label)
        : [...selected, label];
      onSelect(next);
    }
  };

  const isCorrect =
    revealed &&
    question.answer.length === selected.length &&
    question.answer.every((a: string) => selected.includes(a));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="px-2 py-0.5 rounded bg-muted font-medium">
          {TYPE_LABELS[question.type] || question.type}
        </span>
        <span>
          第 {index + 1} / {total} 题
        </span>
      </div>

      <div className="text-base leading-relaxed whitespace-pre-wrap">
        {question.stem}
      </div>

      <div className="space-y-2">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.label);
          const isCorrectOpt = question.answer.includes(opt.label);
          const showCorrect = revealed && isCorrectOpt;
          const showWrong = revealed && isSelected && !isCorrectOpt;

          return (
            <button
              key={opt.label}
              onClick={() => handleOptionClick(opt.label)}
              disabled={revealed}
              className={cn(
                "w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                revealed
                  ? showCorrect
                    ? "border-success bg-success/10"
                    : showWrong
                    ? "border-destructive bg-destructive/10"
                    : "border-muted bg-muted/30 opacity-60"
                  : isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  revealed && showCorrect
                    ? "bg-success text-white"
                    : revealed && showWrong
                    ? "bg-destructive text-white"
                    : isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {revealed && showCorrect ? "✓" : revealed && showWrong ? "✗" : opt.label}
              </span>
              <span className="text-sm">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {question.type === "multiple" && !revealed && selected.length > 0 && (
        <Button
          className="w-full mt-4"
          size="lg"
          onClick={onConfirm}
        >
          确认答案
        </Button>
      )}

      {revealed && (
        <div
          className={cn(
            "p-4 rounded-lg text-sm",
            isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          {isCorrect ? "回答正确！" : `回答错误。正确答案：${question.answer.join("、")}`}
        </div>
      )}
    </div>
  );
}

function QuestionPalette({
  answers,
  questions,
  currentIndex,
  onJump,
}: {
  answers: { selected: string[]; revealed: boolean }[];
  questions: { answer: string[] }[];
  currentIndex: number;
  onJump: (i: number) => void;
}) {
  const isCorrect = (i: number) => {
    const a = answers[i];
    if (!a || !a.revealed) return false;
    const q = questions[i];
    if (!q) return false;
    if (a.selected.length !== q.answer.length) return false;
    return a.selected.every((s) => q.answer.includes(s));
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {answers.map((a, i) => {
        const correct = isCorrect(i);
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            className={cn(
              "w-full aspect-square rounded-lg text-base font-medium transition-colors",
              i === currentIndex
                ? "ring-2 ring-primary ring-offset-2"
                : "",
              a.revealed
                ? correct
                  ? "bg-success/20 text-success"
                  : "bg-destructive/20 text-destructive"
                : a.selected.length > 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

export default function ExamStartPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { token } = useAuth();
  const router = useRouter();

  const { data: session, isLoading } = useSession(token, sessionId);
  const saveAnswer = useSaveAnswer(token, sessionId || "");
  const finishExam = useFinishExam(token);

  const [localAnswers, setLocalAnswers] = useState<{ selected: string[]; revealed: boolean }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const initializedRef = useRef(false);
  const localAnswersRef = useRef(localAnswers);
  localAnswersRef.current = localAnswers;

  // Initialize local state from session (first load only)
  useEffect(() => {
    if (session && !initializedRef.current) {
      const answers = session.answers.map((a) => ({ selected: a.selected || [], revealed: a.revealed || false }));
      setLocalAnswers(answers);
      localAnswersRef.current = answers;
      setCurrentIndex(session.currentIndex || 0);
      initializedRef.current = true;
    }
  }, [session]);

  const handleSelect = useCallback(
    (labels: string[]) => {
      const q = session?.questions[currentIndex];
      const isMultiple = q?.type === "multiple";

      setLocalAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = { selected: labels, revealed: isMultiple ? false : true };
        return next;
      });

      // Debounced save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        saveAnswer.mutate(
          { questionIndex: currentIndex, selected: labels, revealed: !isMultiple },
          { onSettled: () => { isSavingRef.current = false; } }
        );
      }, 300);
    },
    [currentIndex, session, saveAnswer]
  );

  const handleConfirm = useCallback(() => {
    const ans = localAnswersRef.current[currentIndex];
    setLocalAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], revealed: true };
      return next;
    });

    if (ans) {
      saveAnswer.mutate(
        { questionIndex: currentIndex, selected: ans.selected, revealed: true },
      );
    }
  }, [currentIndex, saveAnswer]);

  const handleJump = useCallback((i: number) => {
    setCurrentIndex(i);
    setShowPalette(false);
  }, []);

  const handleSubmit = async () => {
    if (!sessionId) return;
    setShowConfirm(false);
    try {
      const result = await finishExam.mutateAsync(sessionId);
      router.push(`/exam/result/${sessionId}`);
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const question = session.questions[currentIndex];
  const answer = localAnswers[currentIndex] || { selected: [], revealed: false };
  const answeredCount = localAnswers.filter((a) => a.revealed).length;
  const allAnswered = localAnswers.length > 0 && localAnswers.every((a) => a.revealed);
  const correctCount = localAnswers.filter((a, i) => {
    if (!a.revealed) return false;
    const q = session?.questions[i];
    if (!q) return false;
    if (a.selected.length !== q.answer.length) return false;
    return a.selected.every((s) => q.answer.includes(s));
  }).length;
  const wrongCount = answeredCount - correctCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/exam" className="flex items-center gap-2">
              <img src="/logo.png" alt="logo" className="h-7 w-7" />
              <img src="/logo-title.png" alt="医护互联" className="h-6 hidden sm:block" />
            </Link>
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="sm:hidden p-2 hover:bg-muted rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-medium">考试中</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Progress bar - desktop */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(answeredCount / session.questions.length) * 100}%` }}
                />
              </div>
              <span>{answeredCount}/{session.questions.length}</span>
            </div>
            <Button
              size="sm"
              variant={allAnswered ? "default" : "outline"}
              disabled={finishExam.isPending}
              onClick={() => setShowConfirm(true)}
            >
              {finishExam.isPending ? "提交中..." : "交卷"}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile palette overlay */}
      {showPalette && (
        <div className="fixed inset-0 z-30 bg-black/30 sm:hidden" onClick={() => setShowPalette(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[50vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">题目列表</span>
              <button onClick={() => setShowPalette(false)} className="text-muted-foreground">关闭</button>
            </div>
            <QuestionPalette answers={localAnswers} questions={session.questions} currentIndex={currentIndex} onJump={handleJump} />
          </div>
        </div>
      )}

      <div className="container py-6">
        <div className="flex gap-6 max-w-7xl mx-auto">
          {/* Main question area */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardContent className="p-4 sm:p-6">
                {question && (
                  <QuestionCard
                    question={question}
                    index={currentIndex}
                    selected={answer.selected}
                    revealed={answer.revealed}
                    onSelect={handleSelect}
                    onConfirm={handleConfirm}
                    total={session.questions.length}
                  />
                )}
              </CardContent>
              <CardFooter className="border-t p-4 sm:p-6">
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="outline"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => i - 1)}
                  >
                    上一题
                  </Button>
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {currentIndex + 1} / {session.questions.length}
                  </span>
                  {currentIndex < session.questions.length - 1 ? (
                    <Button onClick={() => setCurrentIndex((i) => i + 1)}>
                      下一题
                    </Button>
                  ) : (
                    <Button
                      variant={allAnswered ? "default" : "outline"}
                      onClick={() => setShowConfirm(true)}
                      disabled={finishExam.isPending}
                    >
                      {finishExam.isPending ? "提交中..." : "交卷"}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Desktop palette sidebar */}
          <div className="hidden sm:block w-72 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              {/* Chapter info */}
              {question?.chapterTitle && (
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">当前章节</div>
                    <div className="text-sm font-medium truncate">{question.chapterTitle}</div>
                  </CardContent>
                </Card>
              )}

              {/* Progress card */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">答题进度</span>
                    <span className="text-sm text-muted-foreground">
                      {answeredCount}/{session.questions.length}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(answeredCount / session.questions.length) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="text-center">
                      <div className="text-lg font-bold text-success">{correctCount}</div>
                      <div className="text-xs text-muted-foreground">正确</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-destructive">{wrongCount}</div>
                      <div className="text-xs text-muted-foreground">错误</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{answeredCount}</div>
                      <div className="text-xs text-muted-foreground">已答</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-muted-foreground">{session.questions.length - answeredCount}</div>
                      <div className="text-xs text-muted-foreground">未答</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question palette */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-3">题目列表</div>
                  <QuestionPalette answers={localAnswers} questions={session.questions} currentIndex={currentIndex} onJump={handleJump} />
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-primary" /> 已答（未批）
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-muted" /> 未答
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-success/40" /> 正确
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-destructive/40" /> 错误
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">确认交卷</div>
                <p className="text-sm text-muted-foreground">
                  已答 {answeredCount}/{session.questions.length} 题
                  {!allAnswered && "，还有未作答题目"}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                  继续答题
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={finishExam.isPending}>
                  {finishExam.isPending ? "提交中..." : "确认交卷"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
