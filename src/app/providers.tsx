"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { AuthContext, getStoredToken, getStoredUser, clearStoredAuth } from "@/hooks/useAuth";
import { User } from "@/types/user";

function apiUrl(path: string) {
  return path;
}

async function apiPost(path: string, body: unknown, token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30000, retry: 2 },
          mutations: { retry: 1 },
        },
      })
  );

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setInitialized(true);
  }, []);

  const login = useCallback(async (phone: string, name?: string): Promise<{ success: boolean; isAdmin?: boolean }> => {
    try {
      const res = await apiPost("/api/auth/login", { phone, name }, null);
      if (res.code === 0 && res.data) {
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return { success: true, isAdmin: userData.isAdmin };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }, []);

  const register = useCallback(
    async (data: {
      name: string;
      phone: string;
      department: string;
      roleId?: string | null;
    }): Promise<boolean> => {
      try {
        const res = await apiPost("/api/auth/register", data);
        if (res.code === 0 && res.data) {
          const { token: newToken, user: userData } = res.data;
          localStorage.setItem("token", newToken);
          localStorage.setItem("user", JSON.stringify(userData));
          setToken(newToken);
          setUser(userData);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  if (!initialized) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen items-center justify-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, token, login, register, logout }}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
