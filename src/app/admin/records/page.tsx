"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecords } from "@/hooks/useRecords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

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

  const { data, isLoading } = useRecords(token, { ...filters, page, pageSize: 20 } as any);

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

      const records = json.data.records as any[];
      if (records.length === 0) {
        alert("没有可导出的记录");
        return;
      }

      const XLSX = await import("xlsx");
      const rows = records.map((r: any) => ({
        "姓名": r.name,
        "科室": r.department,
        "角色": r.roleName || "",
        "得分": `${r.score}/${r.total}`,
        "正确率": `${r.percentage}%`,
        "结果": r.status === "pass" ? "合格" : "不合格",
        "完成时间": r.finished_at ? new Date(r.finished_at).toLocaleString("zh-CN") : "",
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
                  <th className="text-left p-3 font-medium">姓名</th>
                  <th className="text-left p-3 font-medium">科室</th>
                  <th className="text-left p-3 font-medium">角色</th>
                  <th className="text-right p-3 font-medium">得分</th>
                  <th className="text-right p-3 font-medium">正确率</th>
                  <th className="text-center p-3 font-medium">结果</th>
                  <th className="text-right p-3 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-muted-foreground">加载中...</td>
                  </tr>
                ) : !data || data.records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-muted-foreground">暂无记录</td>
                  </tr>
                ) : (
                  data.records.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">{r.name}</td>
                      <td className="p-3">{r.department}</td>
                      <td className="p-3">{r.roleName || "-"}</td>
                      <td className="p-3 text-right">{r.score}/{r.total}</td>
                      <td className="p-3 text-right">{r.percentage}%</td>
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
                        {formatDateTime(r.finished_at || r.finishedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
            {data.page} / {data.totalPages} (共{data.total}条)
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
