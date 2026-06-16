"use client";

import { createContext, useContext, useCallback, useState } from "react";
import { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, name?: string) => Promise<{ success: boolean; isAdmin?: boolean }>;
  register: (data: {
    name: string;
    phone: string;
    department: string;
    roleId?: string | null;
  }) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => ({ success: false }),
  register: async () => false,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Helpers
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function apiUrl(path: string) {
  // Use relative URL for same-origin requests
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

async function apiGet(path: string, token?: string | null) {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { headers });
  return res.json();
}

async function apiPut(
  path: string,
  body: unknown,
  token?: string | null
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

export { apiPost, apiGet, apiPut };
