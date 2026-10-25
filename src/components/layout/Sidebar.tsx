"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  CreditCard,
  LogOut,
  Building2,
  Database,
  Calendar,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Boxes,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
  {
    href: "/",
    label: "ภาพรวมระบบ (Dashboard)",
    icon: LayoutDashboard,
    badge: "สรุปผล",
  },
  {
    href: "/invoices",
    label: "ใบกำกับภาษี / ขาย",
    icon: FileText,
  },
  {
    href: "/quotations",
    label: "ใบเสนอราคา",
    icon: ShoppingCart,
  },
  {
    href: "/billing",
    label: "ใบวางบิล",
    icon: CreditCard,
  },
  {
    href: "/inventory",
    label: "ข้อมูลคลังสินค้า",
    icon: Boxes,
  },
  {
    href: "/customers",
    label: "ฐานข้อมูลลูกค้า",
    icon: Users,
  },
];

export function Sidebar({
  isOpen,
  isCollapsed = false,
  onClose,
  onToggleCollapse,
}: {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const isExpress = theme === "express";
  const [company, setCompany] = useState<{
    name: string;
    engName?: string;
    workingDate?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/company")
      .then((res) => res.json())
      .then((data) => setCompany(data))
      .catch((err) => console.error("Failed to load company info:", err));
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen flex flex-col border-r shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          isExpress
            ? "bg-gradient-to-b from-[#241a12] via-[#2d2117] to-[#1c140e] text-[#eed8c0] border-[#453323]"
            : "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200 border-slate-800/80"
        } ${
          isOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-[72px]" : "lg:w-64"}`}
      >
        {/* Brand Header */}
        <div
          className={`p-4 border-b flex items-center ${
            isExpress ? "border-[#3f2c1d]" : "border-slate-800/60"
          } ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 cursor-pointer ${
                isExpress
                  ? "bg-gradient-to-tr from-[#ab6528] to-[#d08342] shadow-[#a86226]/30 ring-1 ring-[#fde0ba]/35"
                  : "bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-blue-500/25 ring-1 ring-white/20"
              }`}
              onClick={isCollapsed ? onToggleCollapse : undefined}
              title={company?.name || "ระบบบัญชี Express"}
            >
              <Building2 size={19} className="stroke-[2.2]" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div
                  className={`font-bold text-xs sm:text-sm tracking-wide truncate max-w-[140px] ${
                    isExpress ? "text-[#fdf2e4]" : "text-white"
                  }`}
                  title={company?.name || "ระบบบัญชี Express"}
                >
                  {company?.name || "ระบบบัญชี Express"}
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] font-medium truncate max-w-[140px] ${
                    isExpress ? "text-[#bfa285]" : "text-slate-400"
                  }`}
                  title={company?.engName || "Express Web Suite"}
                >
                  {company?.engName || "Express Web Suite"}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button (When expanded) */}
          {!isCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`hidden lg:flex p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                isExpress
                  ? "text-[#bfa285] hover:text-[#fdf2e4] hover:bg-[#3f2c1d]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
              title="หุบเมนูด้านข้าง (Collapse Sidebar)"
            >
              <PanelLeftClose size={18} />
            </button>
          )}

          {/* Close button on Mobile */}
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg lg:hidden shrink-0 cursor-pointer ${
              isExpress ? "text-[#bfa285] hover:text-[#fdf2e4]" : "text-slate-400 hover:text-white"
            }`}
            title="ปิดเมนู"
          >
            <X size={20} />
          </button>
        </div>

        {/* Working Date & Database Status */}
        {!isCollapsed ? (
          <div className="px-3 pt-3 space-y-2">
            {/* Working Date */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] border ${
                isExpress
                  ? "bg-[#332418]/80 border-[#543b27] text-[#f5e3d0]"
                  : "bg-blue-950/40 border-blue-800/40 text-blue-200"
              }`}
            >
              <Calendar
                size={13}
                className={`shrink-0 ${isExpress ? "text-[#df9a56]" : "text-blue-400"}`}
              />
              <div className="truncate">
                <span className={`mr-1 ${isExpress ? "text-[#ab8e70]" : "text-slate-400"}`}>
                  วันที่ทำการ:
                </span>
                <strong className={isExpress ? "text-[#fdf2e4]" : "text-white"}>
                  {new Date(company?.workingDate || Date.now()).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </div>
            </div>

            {/* Database Status Pill */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] border ${
                isExpress
                  ? "bg-[#2e2015]/80 border-[#4a3422] text-[#dfcaaf]"
                  : "bg-slate-800/60 border-slate-700/50 text-slate-300"
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database size={13} className="text-emerald-400 shrink-0" />
              <span className="truncate">{company?.name ? `${company.name} (DBF Live)` : "Express (DBF Live)"}</span>
            </div>
          </div>
        ) : (
          /* Collapsed Mini Status Icons */
          <div className="px-2 pt-3 flex flex-col items-center gap-2">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center text-emerald-400 relative cursor-pointer ${
                isExpress ? "bg-[#2e2015] border-[#4a3422]" : "bg-slate-800/80 border-slate-700/60"
              }`}
              title={`${company?.name || "Express"} (DBF Live) - วันที่ทำการ: ${new Date(
                company?.workingDate || Date.now()
              ).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`}
            >
              <span className="animate-ping absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <Database size={16} />
            </div>

            {/* Expand button in collapsed mode */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={`hidden lg:flex p-1.5 rounded-lg transition cursor-pointer ${
                  isExpress
                    ? "text-[#bfa285] hover:text-[#fdf2e4] hover:bg-[#3f2c1d]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
                title="ขยายเมนูด้านข้าง (Expand Sidebar)"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div
              className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-wider ${
                isExpress ? "text-[#a88a6d]" : "text-slate-500"
              }`}
            >
              โมดูลการทำงาน
            </div>
          )}
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                title={isCollapsed ? label : undefined}
                className={`group flex items-center ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                } rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? isExpress
                      ? "bg-gradient-to-r from-[#ab6528] to-[#92541e] text-white shadow-lg shadow-[#ab6528]/35 ring-1 ring-[#fcdab0]/30 font-semibold"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20"
                    : isExpress
                    ? "text-[#cbb398] hover:text-[#fff6ea] hover:bg-[#3f2c1d]/75"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                  <Icon
                    size={isCollapsed ? 20 : 17}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? "text-white"
                        : isExpress
                        ? "text-[#a4886c] group-hover:text-[#f3a863]"
                        : "text-slate-400 group-hover:text-blue-400"
                    }`}
                  />
                  {!isCollapsed && <span>{label}</span>}
                </div>
                {!isCollapsed && badge && !isActive && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      isExpress
                        ? "bg-[#3d2b1c] text-[#fcdab0] border-[#5a412c]"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {badge}
                  </span>
                )}
                {!isCollapsed && isActive && (
                  <ChevronRight size={14} className={isExpress ? "text-[#fcdab0]/90" : "text-white/80"} />
                )}
              </Link>
            );
          })}
        </div>

        {/* User & Logout Footer */}
        <div
          className={`p-2.5 border-t ${
            isExpress
              ? "border-[#3f2c1d] bg-[#1c140e]/60"
              : "border-slate-800/80 bg-slate-950/40"
          }`}
        >
          {!isCollapsed ? (
            <>
              {/* Theme Toggle in Sidebar */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border mb-2 transition cursor-pointer ${
                  isExpress
                    ? "text-[#e6cfb5] hover:text-white hover:bg-[#3f2c1d] border-[#4d3624]"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-slate-800/80"
                }`}
                title="คลิกเพื่อสลับธีมแสดงผล"
              >
                <div className="flex items-center gap-2">
                  {theme === "express" ? (
                    <Palette size={14} className="text-amber-400" />
                  ) : theme === "dark" ? (
                    <Moon size={14} className="text-indigo-400" />
                  ) : (
                    <Sun size={14} className="text-amber-400" />
                  )}
                  <span>ธีมแสดงผล</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  theme === "express"
                    ? "bg-[#fee2bc] text-[#7a4816] border-[#dfc39e]"
                    : theme === "dark"
                    ? "bg-indigo-950/70 text-indigo-300 border-indigo-700/60"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}>
                  {theme === "express" ? "Express Classic" : theme === "dark" ? "Dark Mode" : "Modern"}
                </span>
              </button>

              <div
                className={`flex items-center justify-between p-2 rounded-xl border mb-2 ${
                  isExpress
                    ? "bg-[#2e2015]/80 border-[#4a3422]"
                    : "bg-slate-900/60 border border-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white uppercase ring-1 shrink-0 ${
                      isExpress
                        ? "bg-gradient-to-tr from-[#ab6528] to-[#d18443] ring-[#fcdab0]/30 shadow-xs"
                        : "bg-gradient-to-tr from-indigo-500 to-purple-500 ring-white/10"
                    }`}
                  >
                    {session?.user?.name?.[0] || "A"}
                  </div>
                  <div className="truncate text-left">
                    <div className={`text-xs font-semibold truncate ${isExpress ? "text-[#fdf2e4]" : "text-white"}`}>
                      {session?.user?.name || "Administrator"}
                    </div>
                    <div className={`text-[10px] truncate ${isExpress ? "text-[#a4886c]" : "text-slate-400"}`}>
                      {session?.user?.email || "admin@express"}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-transparent transition-all duration-200 cursor-pointer ${
                  isExpress
                    ? "text-[#bfa285] hover:text-[#ff9888] hover:bg-[#3f2c1d] hover:border-[#5a3a2a]"
                    : "text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                }`}
              >
                <LogOut size={14} />
                ออกจากระบบ
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <button
                type="button"
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isExpress
                    ? "text-[#bfa285] hover:text-white hover:bg-[#3f2c1d]"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                title={`ธีม: ${
                  theme === "express"
                    ? "Express Classic"
                    : theme === "dark"
                    ? "Dark Mode"
                    : "Modern"
                } (คลิกเพื่อสลับ)`}
              >
                {theme === "express" ? (
                  <Palette size={16} className="text-amber-400" />
                ) : theme === "dark" ? (
                  <Moon size={16} className="text-indigo-400" />
                ) : (
                  <Sun size={16} className="text-amber-400" />
                )}
              </button>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white uppercase ring-1 shadow-sm cursor-pointer ${
                  isExpress
                    ? "bg-gradient-to-tr from-[#ab6528] to-[#d18443] ring-[#fcdab0]/30"
                    : "bg-gradient-to-tr from-indigo-500 to-purple-500 ring-white/10"
                }`}
                title={`${session?.user?.name || "Administrator"} (${session?.user?.email || "admin@express"})`}
              >
                {session?.user?.name?.[0] || "A"}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isExpress
                    ? "text-[#bfa285] hover:text-[#ff9888] hover:bg-[#3f2c1d]"
                    : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                }`}
                title="ออกจากระบบ"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
