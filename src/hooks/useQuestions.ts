"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/hooks/useAuth";
import { Question, ChapterGroup } from "@/types/question";

export function useQuestions(token: string | null) {
  return useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const [questionsRes, chaptersRes] = await Promise.all([
        apiGet("/api/questions", token),
        apiGet("/api/questions/chapters", token),
      ]);
      if (questionsRes.code !== 0) throw new Error(questionsRes.msg || "获取题库失败");
      if (chaptersRes.code !== 0) throw new Error(chaptersRes.msg || "获取章节失败");

      const questions = questionsRes.data as (Question & { chapterId: number })[];
      const chapters = chaptersRes.data as { id: number; title: string }[];

      return chapters.map((ch) => ({
        chapterId: ch.id,
        chapterTitle: ch.title,
        questions: questions.filter((q) => q.chapterId === ch.id),
      })) as ChapterGroup[];
    },
    enabled: !!token,
  });
}

export function useChapters(token: string | null) {
  return useQuery({
    queryKey: ["chapters"],
    queryFn: async () => {
      const res = await apiGet("/api/questions/chapters", token);
      if (res.code === 0) return res.data as { id: number; title: string; description: string | null; count: number }[];
      throw new Error(res.msg || "获取章节失败");
    },
    enabled: !!token,
  });
}
