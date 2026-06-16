"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/hooks/useAuth";

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  department: string;
  roleName: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nameFilter, setNameFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (p: number, name?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: "20" });
      if (name) params.set("name", name);
      const res = await apiGet(`/api/admin/users?${params.toString()}`, token);
      if (res.code === 0) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setPage(res.data.page);
        setTotalPages(res.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1); }, []);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1, nameFilter);
  };

  const viewUserRecords = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const res = await apiGet(`/api/admin/users/${userId}/records`, token);
    if (res.code === 0 && res.data.length > 0) {
      alert(`${user.name} 的考试记录：\n` +
        res.data.map((r: { roleName: string; percentage: number; status: string; finished_at: string }) =>
          `${r.roleName || "考试"} — ${r.percentage}% (${r.status === "pass" ? "合格" : "不合格"})`
        ).join("\n")
      );
    } else {
      alert(`${user.name} 暂无考试记录`);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">用户管理</h1>

      <div className="flex gap-2">
        <Input
          placeholder="搜索姓名..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-xs"
        />
        <Button onClick={handleSearch}>搜索</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left p-3 font-medium">姓名</th>
                  <th className="text-left p-3 font-medium">手机号</th>
                  <th className="text-left p-3 font-medium">科室</th>
                  <th className="text-left p-3 font-medium">角色</th>
                  <th className="text-center p-3 font-medium">管理员</th>
                  <th className="text-right p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-muted-foreground">加载中...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-muted-foreground">暂无用户</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">{u.name}</td>
                      <td className="p-3 text-muted-foreground">{u.phone}</td>
                      <td className="p-3">{u.department}</td>
                      <td className="p-3">{u.roleName || "-"}</td>
                      <td className="p-3 text-center">{u.isAdmin ? "是" : "-"}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewUserRecords(u.id)}
                        >
                          记录
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => fetchUsers(page - 1, nameFilter)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => fetchUsers(page + 1, nameFilter)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
