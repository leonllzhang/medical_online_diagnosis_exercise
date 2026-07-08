"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DepartmentSelect } from "@/components/shared/DepartmentSelect";

export default function RegisterPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", department: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.department.trim()) {
      setError("请填写所有必填项");
      return;
    }
    if (!/^1\d{10}$/.test(form.phone.trim())) {
      setError("请输入正确的手机号");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const ok = await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        department: form.department.trim(),
      });
      if (ok) {
        router.replace("/exam");
      } else {
        setError("注册失败，手机号可能已被使用");
      }
    } catch {
      setError("注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/bg.jpg)" }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">用户注册</CardTitle>
          <CardDescription>请填写基本信息完成注册</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">姓名 *</label>
              <Input
                placeholder="请输入姓名"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">手机号 *</label>
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={11}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">科室 *</label>
              <DepartmentSelect
                token={token}
                value={form.department}
                onChange={(v) => setForm({ ...form, department: v })}
                placeholder="请选择或搜索科室"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              已有账号？{" "}
              <Link href="/login" className="text-primary hover:underline">
                立即登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
