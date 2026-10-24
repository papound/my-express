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
} from "lucide-react";

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
    href: "/customers",
    label: "ฐานข้อมูลลูกค้า",
    icon: Users,
  },
];

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
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
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200 flex flex-col border-r border-slate-800/80 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20 shrink-0">
              <Building2 size={18} className="stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div
                className="font-bold text-xs sm:text-sm tracking-wide text-white truncate max-w-[145px]"
                title={company?.name || "บริษัท ธงธัญ99 จำกัด"}
              >
                {company?.name || "บริษัท ธงธัญ99 จำกัด"}
              </div>
              <p
                className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate max-w-[145px]"
                title={company?.engName || "Express Web Suite"}
              >
                {company?.engName || "Express Web Suite"}
              </p>
            </div>
          </div>

          {/* Close button on Mobile */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden shrink-0"
            title="ปิดเมนู"
          >
            <X size={20} />
          </button>
        </div>

        {/* Working Date & Database Status */}
        <div className="px-3 pt-3 space-y-2">
          {/* Working Date */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200">
            <Calendar size={13} className="text-blue-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 mr-1">วันที่ทำการ:</span>
              <strong className="text-white">
                {new Date(company?.workingDate || Date.now()).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </div>
          </div>

          {/* Database Status Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Database size={13} className="text-emerald-400 shrink-0" />
            <span className="truncate">ThongTha (DBF Live)</span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            โมดูลการทำงาน
          </div>
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-blue-400"
                    }`}
                  />
                  <span>{label}</span>
                </div>
                {badge && !isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight size={14} className="text-white/80" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User & Logout Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white uppercase ring-1 ring-white/10 shrink-0">
                {session?.user?.name?.[0] || "A"}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-semibold text-white truncate">
                  {session?.user?.name || "Administrator"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {session?.user?.email || "admin@thongtha"}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
          >
            <LogOut size={14} />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
