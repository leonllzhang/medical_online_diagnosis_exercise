"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("请输入姓名");
      return;
    }
    if (!phone.trim()) {
      setError("请输入手机号");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await login(phone.trim(), name.trim());
      if (result.success) {
        router.replace(result.isAdmin ? "/admin/dashboard" : "/exam");
      } else {
        setError("用户不存在，请先注册");
      }
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/bg.jpg)" }}
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pt-8 pb-2">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/logo.png" alt="logo" className="h-10 w-10" />
            <img src="/logo-title.png" alt="医护互联" className="h-8" />
          </div>
          <CardDescription className="text-base">
            北京市互联网诊疗医务人员准入考试
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">姓名</label>
              <Input
                placeholder="请输入姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">手机号</label>
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                className="h-12 text-base"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" size="xl" disabled={loading}>
              {loading ? "登录中..." : "登 录"}
            </Button>
            <p className="text-center text-sm text-muted-foreground pt-2">
              首次使用？{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                立即注册
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
