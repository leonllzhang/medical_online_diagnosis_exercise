"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuestions, useChapters } from "@/hooks/useQuestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TYPE_LABELS } from "@/types/question";

export default function AdminQuestionsPage() {
  const { token } = useAuth();
  const { data: chapters } = useChapters(token);
  const { data: questionGroups } = useQuestions(token);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const chapterList = chapters || [];
  const groups = questionGroups || [];

  const activeGroup = groups.find((g) => g.chapterId === activeChapter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">题库浏览</h1>

      {/* Chapter tabs */}
      <div className="flex flex-wrap gap-2">
        {chapterList.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveChapter(activeChapter === ch.id ? null : ch.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChapter === ch.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {ch.title}
            {ch.count !== undefined && (
              <span className="ml-1.5 text-xs opacity-70">({ch.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Questions */}
      {activeGroup ? (
        <div className="space-y-3">
          {activeGroup.questions.map((q) => (
            <Card key={q.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setExpandedQuestion(expandedQuestion === q.id ? null : q.id)
                }
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                    #{q.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {TYPE_LABELS[q.type]}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{q.stem}</div>
                  </div>
                </div>
              </CardHeader>
              {expandedQuestion === q.id && (
                <CardContent>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                          q.answer.includes(opt.label)
                            ? "bg-success/10 text-success-foreground"
                            : "bg-muted/50"
                        }`}
                      >
                        <span className="font-mono text-xs w-5 text-center">{opt.label}</span>
                        <span>{opt.text}</span>
                        {q.answer.includes(opt.label) && (
                          <span className="text-xs text-success ml-auto">正确答案</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            {chapterList.length > 0 ? "请选择一个章节查看题目" : "加载中..."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
