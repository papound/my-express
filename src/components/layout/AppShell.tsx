"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleMenu = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileMenuOpen((v) => !v);
    } else {
      setIsCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("sidebar_collapsed", String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <SessionProvider>
      <ThemeProvider>
        <div className="flex min-h-screen bg-slate-50/60 font-sans antialiased text-slate-900 app-root-layout">
          <Sidebar
            isOpen={isMobileMenuOpen}
            isCollapsed={isCollapsed}
            onClose={() => setIsMobileMenuOpen(false)}
            onToggleCollapse={handleToggleCollapse}
          />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              onToggleMenu={handleToggleMenu}
              isCollapsed={isCollapsed}
            />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}

