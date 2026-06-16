"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/hooks/useAuth";
import { ExamSessionData, ExamResult, AnswerState } from "@/types/exam";

export function useStartExam(token: string | null, roleId?: string | null) {
  return useMutation({
    mutationFn: async () => {
      const res = await apiPost("/api/sessions/start", { roleId }, token);
      if (res.code === 0) return res.data as ExamSessionData;
      throw new Error(res.msg || "开始考试失败");
    },
  });
}

export function useSession(token: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await apiGet(`/api/sessions/${sessionId}`, token);
      if (res.code === 0) return res.data as ExamSessionData;
      throw new Error(res.msg || "获取会话失败");
    },
    enabled: !!token && !!sessionId,
    refetchOnWindowFocus: false,
  });
}

export function useSaveAnswer(token: string | null, sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionIndex,
      selected,
      revealed,
      currentIndex,
    }: {
      questionIndex: number;
      selected: string[];
      revealed?: boolean;
      currentIndex?: number;
    }) => {
      const res = await apiPut(
        `/api/sessions/${sessionId}/answer`,
        { questionIndex, selected, revealed, currentIndex },
        token
      );
      if (res.code !== 0) throw new Error(res.msg || "保存答案失败");
    },
    onMutate: async ({ questionIndex, selected }) => {
      await queryClient.cancelQueries({ queryKey: ["session", sessionId] });
      const prev = queryClient.getQueryData<ExamSessionData>(["session", sessionId]);
      if (prev) {
        const answers = [...prev.answers];
        answers[questionIndex] = { selected, revealed: true };
        queryClient.setQueryData<ExamSessionData>(["session", sessionId], {
          ...prev,
          answers,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["session", sessionId], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}

export function useFinishExam(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiPost(`/api/sessions/${sessionId}/finish`, {}, token);
      if (res.code === 0) return res.data;
      throw new Error(res.msg || "提交失败");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["myRecords"] });
    },
  });
}

export function useResult(token: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: ["result", sessionId],
    queryFn: async () => {
      const res = await apiGet(`/api/sessions/${sessionId}/result`, token);
      if (res.code === 0) return res.data as ExamResult;
      throw new Error(res.msg || "获取结果失败");
    },
    enabled: !!token && !!sessionId,
  });
}
