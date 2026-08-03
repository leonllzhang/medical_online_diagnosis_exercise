"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecords } from "@/hooks/useRecords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function AdminRecordsPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({
    name: "",
    department: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(1);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const { data, isLoading } = useRecords(token, { ...filters, page, pageSize: 20 } as any);

  const getLatestPassed = (records: { status: string }[]) => {
    return records.some((r) => r.status === "pass");
  };

  const toggleExpand = (key: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.name) params.set("name", filters.name);
    if (filters.department) params.set("department", filters.department);
    if (filters.status) params.set("status", filters.status);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    params.set("pageSize", "99999");

    try {
      const res = await fetch(`/api/records?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        alert("获取记录失败");
        return;
      }
      const json = await res.json();
      if (json.code !== 0) {
        alert(json.msg || "获取记录失败");
        return;
      }

      const allRecords = json.data.users.flatMap((u: any) => u.records) as any[];
      if (allRecords.length === 0) {
        alert("没有可导出的记录");
        return;
      }

      const XLSX = await import("xlsx");
      const rows = allRecords.map((r: any) => ({
        "姓名": json.data.users.find((u: any) => u.records.includes(r))?.name || "",
        "科室": json.data.users.find((u: any) => u.records.includes(r))?.department || "",
        "得分": `${r.score}/${r.total}`,
        "正确率": `${r.percentage}%`,
        "结果": r.status === "pass" ? "合格" : "不合格",
        "完成时间": r.finishedAt ? new Date(r.finishedAt).toLocaleString("zh-CN") : "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "考核记录");

      const buf = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `考核记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("导出失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">考核记录</h1>
        <Button onClick={handleExport}>导出 Excel</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Input
              placeholder="姓名"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
            <Input
              placeholder="科室"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            />
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">全部结果</option>
              <option value="pass">合格</option>
              <option value="fail">不合格</option>
            </select>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
          <Button
            className="mt-3"
            size="sm"
            onClick={() => { setPage(1); }}
          >
            筛选
          </Button>
        </CardContent>
      </Card>

      {/* Records table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="w-8 p-3"></th>
                  <th className="text-left p-3 font-medium">姓名</th>
                  <th className="text-left p-3 font-medium">科室</th>
                  <th className="text-center p-3 font-medium">考核次数</th>
                  <th className="text-center p-3 font-medium">最高分</th>
                  <th className="text-center p-3 font-medium">最近结果</th>
                  <th className="text-center p-3 font-medium">最近时间</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-muted-foreground">加载中...</td>
                  </tr>
                ) : !data || data.users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-muted-foreground">暂无记录</td>
                  </tr>
                ) : (
                  data.users.map((user) => {
                    const key = `${user.name}|${user.department}`;
                    const expanded = expandedUsers.has(key);
                    const passed = user.latestStatus === "pass";

                    return (
                      <tr key={key} className="border-b last:border-0">
                        <td className="p-3">
                          {user.totalAttempts > 1 && (
                            <button
                              onClick={() => toggleExpand(key)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <ChevronDown className={`transition-transform ${expanded ? "" : "-rotate-90"}`} />
                            </button>
                          )}
                        </td>
                        <td className="p-3 font-medium">{user.name}</td>
                        <td className="p-3 text-muted-foreground">{user.department}</td>
                        <td className="p-3 text-center">{user.totalAttempts}</td>
                        <td className="p-3 text-center font-semibold">
                          {user.bestPercentage != null ? `${user.bestPercentage}%` : "-"}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              passed
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {passed ? "合格" : "不合格"}
                          </span>
                        </td>
                        <td className="p-3 text-center text-muted-foreground">
                          {formatDateTime(user.records[0]?.finishedAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expanded user detail cards */}
      {data && expandedUsers.size > 0 && (
        <div className="space-y-3">
          {data.users
            .filter((u) => expandedUsers.has(`${u.name}|${u.department}`))
            .map((user) => (
              <Card key={`detail-${user.name}|${user.department}`}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">
                    {user.name} — {user.department} — 共 {user.totalAttempts} 次考核
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t text-muted-foreground text-xs">
                        <th className="text-left p-3 font-medium">得分</th>
                        <th className="text-right p-3 font-medium">正确率</th>
                        <th className="text-center p-3 font-medium">结果</th>
                        <th className="text-right p-3 font-medium">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.records.map((r) => (
                        <tr key={r.id} className="border-t last:border-0">
                          <td className="p-3">{r.score}/{r.total}</td>
                          <td className="p-3 text-right font-medium">{r.percentage}%</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                r.status === "pass"
                                  ? "bg-success/10 text-success"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {r.status === "pass" ? "合格" : "不合格"}
                            </span>
                          </td>
                          <td className="p-3 text-right text-muted-foreground text-xs">
                            {formatDateTime(r.finishedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {data.page} / {data.totalPages} (共{data.total}人)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
