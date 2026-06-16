"use client";

import { useState, useEffect } from "react";
import { useAuth, apiGet, apiPut, apiPost } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Role, RoleConfig } from "@/types/user";

export default function AdminRolesPage() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [chapters, setChapters] = useState<{ id: number; title: string }[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, number>>({});
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const fetchRoles = async () => {
    const res = await apiGet("/api/roles", token);
    if (res.code === 0) setRoles(res.data || []);
  };

  const fetchChapters = async () => {
    const res = await apiGet("/api/questions/chapters", token);
    if (res.code === 0) setChapters(res.data || []);
  };

  useEffect(() => {
    fetchRoles();
    fetchChapters();
  }, [token]);

  const startEdit = (role: Role) => {
    setEditingRole(role.id);
    const cfg: Record<string, number> = {};
    for (const c of role.configs) {
      cfg[String(c.chapterId)] = c.questionCount;
    }
    // Initialize missing chapters
    for (const ch of chapters) {
      if (!cfg[String(ch.id)]) cfg[String(ch.id)] = 0;
    }
    setConfigs(cfg);
  };

  const saveConfig = async () => {
    if (!editingRole) return;
    const configArray = Object.entries(configs).map(([chapterId, count]) => ({
      chapterId: parseInt(chapterId),
      questionCount: count,
    }));
    await apiPut(`/api/roles/${editingRole}/config`, configArray, token);
    setEditingRole(null);
    fetchRoles();
  };

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    await apiPost("/api/roles", { name: newRoleName.trim(), description: newRoleDesc.trim() }, token);
    setNewRoleName("");
    setNewRoleDesc("");
    fetchRoles();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">角色规则配置</h1>

      {/* Add new role */}
      <Card>
        <CardHeader><CardTitle>添加角色</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="角色名称"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="描述（可选）"
            value={newRoleDesc}
            onChange={(e) => setNewRoleDesc(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={createRole}>添加</Button>
        </CardContent>
      </Card>

      {/* Role list */}
      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  )}
                </div>
                <Button
                  variant={editingRole === role.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => editingRole === role.id ? saveConfig() : startEdit(role)}
                >
                  {editingRole === role.id ? "保存" : "编辑规则"}
                </Button>
              </div>
            </CardHeader>
            {editingRole === role.id && (
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    设 0 表示使用该章节全部题目，设 N 表示随机抽取 N 题
                  </p>
                  {chapters.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-3">
                      <span className="text-sm w-40">{ch.title}</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-24"
                        value={configs[String(ch.id)] ?? 0}
                        onChange={(e) =>
                          setConfigs({ ...configs, [String(ch.id)]: parseInt(e.target.value) || 0 })
                        }
                      />
                      <span className="text-xs text-muted-foreground">题</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
