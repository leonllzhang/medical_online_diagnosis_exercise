"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/hooks/useAuth";
import { MyRecord } from "@/types/exam";

interface UserRecord {
  id: string;
  sessionId: string;
  score: number;
  total: number;
  percentage: number;
  status: string;
  finishedAt: string;
}

interface UserGroup {
  name: string;
  department: string;
  totalAttempts: number;
  bestPercentage: number | null;
  latestStatus: string;
  records: UserRecord[];
}

interface RecordsResponse {
  users: UserGroup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface StatsResponse {
  totalRegisteredUsers: number;
  totalExamUsers: number;
  passedUsers: number;
  failedUsers: number;
  passRate: number;
  totalRecords: number;
  departmentStats: { department: string; userCount: number; totalRecords: number; avgPercentage: number }[];
  recentRecords: { name: string; department: string; percentage: number; status: string; finishedAt: string }[];
}

export function useRecords(
  token: string | null,
  params: {
    page?: number;
    pageSize?: number;
    name?: string;
    department?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.name) searchParams.set("name", params.name);
  if (params.department) searchParams.set("department", params.department);
  if (params.status) searchParams.set("status", params.status);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);

  return useQuery({
    queryKey: ["records", params],
    queryFn: async () => {
      const res = await apiGet(`/api/records?${searchParams.toString()}`, token);
      if (res.code === 0) return res.data as RecordsResponse;
      throw new Error(res.msg || "获取记录失败");
    },
    enabled: !!token,
  });
}

export function useMyRecords(token: string | null) {
  return useQuery({
    queryKey: ["myRecords"],
    queryFn: async () => {
      const res = await apiGet("/api/records/my", token);
      if (res.code === 0) return res.data as MyRecord[];
      throw new Error(res.msg || "获取记录失败");
    },
    enabled: !!token,
  });
}

export function useStats(token: string | null) {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await apiGet("/api/records/stats", token);
      if (res.code === 0) return res.data as StatsResponse;
      throw new Error(res.msg || "获取统计失败");
    },
    enabled: !!token,
  });
}
