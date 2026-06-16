"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/hooks/useAuth";
import { ChapterGroup } from "@/types/question";

export function useQuestions(token: string | null) {
  return useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const res = await apiGet("/api/questions", token);
      if (res.code === 0) return res.data as ChapterGroup[];
      throw new Error(res.msg || "获取题库失败");
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
