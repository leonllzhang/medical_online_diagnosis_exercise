"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMyRecords } from "@/hooks/useRecords";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/shared/AppShell";
import { formatDateTime } from "@/lib/utils";

export default function HistoryPage() {
  const { token } = useAuth();
  const { data: records, isLoading } = useMyRecords(token);
  const router = useRouter();

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">考试记录</h1>
          <Button variant="outline" onClick={() => router.push("/exam")}>
            返回考试
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">加载中...</div>
        ) : !records || records.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center text-muted-foreground">
              暂无考试记录
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/exam/result/${r.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.roleName || "考试"}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDateTime(r.finished_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {r.percentage}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {r.score}/{r.total}
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          r.status === "pass" ? "text-success" : "text-destructive"
                        }`}
                      >
                        {r.status === "pass" ? "合格" : "不合格"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
