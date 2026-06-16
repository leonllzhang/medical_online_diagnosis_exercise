"use client";

import { useAuth } from "@/hooks/useAuth";
import { useStats } from "@/hooks/useRecords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const { token } = useAuth();
  const { data: stats, isLoading } = useStats(token);

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">加载中...</div>;
  }

  if (!stats) {
    return <div className="text-center py-20 text-muted-foreground">暂无数据</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">统计大盘</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{stats.totalRecords}</div>
            <div className="text-sm text-muted-foreground mt-1">考核总人次</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-success">{stats.passRecords}</div>
            <div className="text-sm text-muted-foreground mt-1">合格人数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-destructive">{stats.failRecords}</div>
            <div className="text-sm text-muted-foreground mt-1">不合格人数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-warning">{stats.passRate}%</div>
            <div className="text-sm text-muted-foreground mt-1">合格率</div>
          </CardContent>
        </Card>
      </div>

      {/* Department stats */}
      <Card>
        <CardHeader>
          <CardTitle>科室统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">科室</th>
                  <th className="text-right py-2 font-medium">考核人次</th>
                  <th className="text-right py-2 font-medium">平均正确率</th>
                </tr>
              </thead>
              <tbody>
                {stats.departmentStats.map((d, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{d.department}</td>
                    <td className="text-right py-2">{d.count}</td>
                    <td className="text-right py-2">{d.avgPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent records */}
      <Card>
        <CardHeader>
          <CardTitle>最近考核</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">姓名</th>
                  <th className="text-left py-2 font-medium">科室</th>
                  <th className="text-right py-2 font-medium">正确率</th>
                  <th className="text-center py-2 font-medium">结果</th>
                  <th className="text-right py-2 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRecords.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2">{r.department}</td>
                    <td className="text-right py-2">{r.percentage}%</td>
                    <td className="text-center py-2">
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
                    <td className="text-right py-2 text-muted-foreground">
                      {formatDateTime(r.finishedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
