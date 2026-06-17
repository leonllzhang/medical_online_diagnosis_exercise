"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Department {
  id: number;
  name: string;
}

interface DepartmentSelectProps {
  token: string | null;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DepartmentSelect({
  token,
  value,
  onChange,
  placeholder = "请选择科室",
}: DepartmentSelectProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((res) => {
        if (res.code === 0) setDepartments(res.data);
      });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "flex h-12 w-full items-center rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-pointer",
          value ? "text-foreground" : "text-muted-foreground"
        )}
        onClick={() => setOpen(!open)}
      >
        {value || placeholder}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-60 overflow-hidden flex flex-col">
          <input
            className="w-full px-3 py-2.5 text-sm border-b outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="搜索科室..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                无匹配科室
              </div>
            ) : (
              filtered.map((d) => (
                <button
                  key={d.id}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors",
                    value === d.name && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => {
                    onChange(d.name);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {d.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
