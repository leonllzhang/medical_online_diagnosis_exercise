"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, apiGet } from "@/hooks/useAuth";
import { useStartExam, useCancelExam } from "@/hooks/useExam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Role } from "@/types/user";
import { AppShell } from "@/components/shared/AppShell";

export default function ExamPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);
  const startExam = useStartExam(token);
  const cancelExam = useCancelExam(token);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const pendingStartRef = useRef(false);

  useEffect(() => {
    apiGet("/api/roles", token).then((res) => {
      if (res.code === 0) setRoles(res.data || []);
    });
  }, [token]);

  useEffect(() => {
    if (user?.roleId && roles.length > 0) {
      setSelectedRole(user.roleId);
    }
  }, [user, roles]);

  const handleStart = async () => {
    if (!selectedRole || pendingStartRef.current) return;
    pendingStartRef.current = true;
    try {
      const data = await startExam.mutateAsync();
      if (data.resume) {
        setResumeSessionId(data.sessionId);
        setShowResumeDialog(true);
      } else {
        router.push(`/exam/start?sessionId=${data.sessionId}`);
      }
    } catch {
      // Error handled by mutation
    } finally {
      pendingStartRef.current = false;
    }
  };

  const handleResume = () => {
    setShowResumeDialog(false);
    if (resumeSessionId) {
      router.push(`/exam/start?sessionId=${resumeSessionId}`);
    }
  };

  const handleRestart = async () => {
    setShowResumeDialog(false);
    if (resumeSessionId) {
      await cancelExam.mutateAsync(resumeSessionId);
      // Re-start to create new session
      pendingStartRef.current = true;
      try {
        const data = await startExam.mutateAsync();
        router.push(`/exam/start?sessionId=${data.sessionId}`);
      } finally {
        pendingStartRef.current = false;
      }
    }
  };

  const isPending = startExam.isPending || cancelExam.isPending;

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
              disabled={!selectedRole || isPending}
              onClick={handleStart}
            >
              {isPending ? "处理中..." : "开始考试"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              如存在未完成的考试，将自动续做
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resume dialog */}
      {showResumeDialog && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">检测到未完成的考试</div>
                <p className="text-sm text-muted-foreground">
                  是否继续上次答题，还是重新开始？
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleRestart} disabled={isPending}>
                  重新开始
                </Button>
                <Button className="flex-1" onClick={handleResume}>
                  继续答题
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
