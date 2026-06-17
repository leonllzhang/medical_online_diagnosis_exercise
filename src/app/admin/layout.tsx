"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const sidebarItems = [
  { href: "/admin/dashboard", label: "统计大盘", icon: "📊" },
  { href: "/admin/users", label: "用户管理", icon: "👥" },
  { href: "/admin/roles", label: "角色规则", icon: "⚙️" },
  { href: "/admin/questions", label: "题库浏览", icon: "📝" },
  { href: "/admin/records", label: "考核记录", icon: "📋" },
  { href: "/admin/departments", label: "科室管理", icon: "🏥" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.replace("/exam");
    }
  }, [user, router]);

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">无权限访问</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r">
        <div className="p-4 border-b">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" className="h-7 w-7" />
            <img src="/logo-title.png" alt="管理后台" className="h-6 max-w-[9rem] object-contain" />
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {user.name}
            </div>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              退出
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" className="h-6 w-6" />
            <span className="font-semibold">管理后台</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{user.name}</span>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="text-muted-foreground"
            >
              退出
            </button>
          </div>
        </div>
        <div className="flex overflow-x-auto gap-1 px-3 pb-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-lg text-sm",
                pathname === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 md:pt-6 pt-[4.5rem] p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
