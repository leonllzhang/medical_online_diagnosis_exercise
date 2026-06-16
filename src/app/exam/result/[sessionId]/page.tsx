"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useResult } from "@/hooks/useExam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/shared/AppShell";
import { TYPE_LABELS } from "@/types/question";

export default function ExamResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token } = useAuth();
  const { data: result, isLoading } = useResult(token, sessionId);
  const router = useRouter();

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </AppShell>
    );
  }

  if (!result) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-muted-foreground">结果未找到</p>
        </div>
      </AppShell>
    );
  }

  const passed = result.status === "pass";

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Score Card */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">考试结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center text-3xl font-bold ${
                  passed
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {result.percentage}%
              </div>
            </div>

            <div
              className={`text-xl font-bold ${
                passed ? "text-success" : "text-destructive"
              }`}
            >
              {passed ? "合格" : "不合格"}
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">得分</div>
                <div className="text-xl font-semibold">
                  {result.score}/{result.total}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">正确率</div>
                <div className="text-xl font-semibold">{result.percentage}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">角色</div>
                <div className="text-xl font-semibold">{result.roleName}</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push("/exam")}>
                返回首页
              </Button>
              <Button onClick={() => router.push("/exam/history")}>
                历史记录
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Review */}
        <Card>
          <CardHeader>
            <CardTitle>逐题回顾</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.details.map((d, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${
                  d.correct ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-medium text-sm min-w-[2rem]">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {TYPE_LABELS[d.type || ""] || d.type}
                      </span>
                      <span className={`text-xs font-medium ${d.correct ? "text-success" : "text-destructive"}`}>
                        {d.correct ? "正确" : "错误"}
                      </span>
                    </div>
                    <div className="text-sm mb-2 whitespace-pre-wrap">{d.stem}</div>

                    <div className="space-y-1 text-sm">
                      {d.options?.map((opt) => {
                        const isSelected = d.selected.includes(opt.label);
                        const isCorrect = d.correctAnswer.includes(opt.label);
                        return (
                          <div
                            key={opt.label}
                            className={`flex items-center gap-2 p-2 rounded text-sm ${
                              isCorrect
                                ? "bg-success/20 text-success-foreground"
                                : isSelected && !isCorrect
                                ? "bg-destructive/20 text-destructive-foreground"
                                : "bg-muted/50"
                            }`}
                          >
                            <span className="font-mono text-xs w-5 text-center">{opt.label}</span>
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
