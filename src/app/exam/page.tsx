"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, apiGet } from "@/hooks/useAuth";
import { useStartExam } from "@/hooks/useExam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Role } from "@/types/user";
import { AppShell } from "@/components/shared/AppShell";

export default function ExamPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const startExam = useStartExam(token);

  useEffect(() => {
    apiGet("/api/roles", token).then((res) => {
      if (res.code === 0) setRoles(res.data || []);
    });
  }, [token]);

  // Pre-select user's role
  useEffect(() => {
    if (user?.roleId && roles.length > 0) {
      setSelectedRole(user.roleId);
    }
  }, [user, roles]);

  const handleStart = async () => {
    if (!selectedRole) return;
    try {
      const data = await startExam.mutateAsync();
      router.push(`/exam/start?sessionId=${data.sessionId}`);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 pt-8">
        <Card>
          <CardHeader>
            <CardTitle>准入资格考试</CardTitle>
            <CardDescription>
              北京市互联网诊疗医务人员准入考试 — 在线练习系统
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  选择考试角色
                </label>
                <div className="grid gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      className={`text-left p-4 rounded-lg border-2 transition-colors ${
                        selectedRole === r.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium">{r.name}</div>
                      {r.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {r.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedRole || startExam.isPending}
              onClick={handleStart}
            >
              {startExam.isPending ? "准备中..." : "开始考试"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              如存在未完成的考试，将自动续做
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
