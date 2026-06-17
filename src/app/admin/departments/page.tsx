"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminDepartmentsPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [newName, setNewName] = useState("");

  const fetchDepartments = async () => {
    const res = await fetch("/api/departments").then((r) => r.json());
    if (res.code === 0) setDepartments(res.data);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    fetchDepartments();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除该科室？")) return;
    await fetch(`/api/departments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchDepartments();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">科室管理</h1>

      <Card>
        <CardHeader><CardTitle>添加科室</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="科室名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="max-w-xs"
          />
          <Button onClick={handleAdd}>添加</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left p-3 font-medium">科室名称</th>
                  <th className="text-right p-3 font-medium w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">{d.name}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                        删除
                      </Button>
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
