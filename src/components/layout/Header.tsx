"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, ShieldCheck, Menu, Palette, PenTool, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { SignaturePadModal } from "@/components/signatures/SignaturePadModal";

const titleMap: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "ภาพรวมระบบบัญชี",
    subtitle: "สรุปตัวเลขรายรับ ยอดขาย และสถานะลูกหนี้การค้าแบบเรียลไทม์",
  },
  "/invoices": {
    title: "ใบกำกับภาษี & ใบเสร็จ",
    subtitle: "บันทึกและตรวจสอบรายการขายสด ขายเชื่อ และรายการภาษีขาย",
  },
  "/quotations": {
    title: "ใบเสนอราคา",
    subtitle: "ติดตามสถานะการเปิดใบเสนอราคาและยอดขายที่รอยืนยัน",
  },
  "/billing": {
    title: "ใบวางบิล / ใบแจ้งหนี้",
    subtitle: "จัดการรอบวางบิลและกำหนดวันนัดชำระเงินของลูกค้า",
  },
  "/inventory": {
    title: "ข้อมูลคลังสินค้า & สต็อก",
    subtitle: "ตรวจสอบยอดสินค้าคงเหลือ จัดสรรตามคลัง และบัตรสินค้า",
  },
  "/customers": {
    title: "ทะเบียนลูกค้า",
    subtitle: "ข้อมูลผู้ซื้อ เลขประจำตัวผู้เสียภาษี และวงเงินเครดิตคงเหลือ",
  },
};

export function Header({
  onToggleMenu,
  isCollapsed = false,
}: {
  onToggleMenu?: () => void;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetch("/api/company")
      .then((res) => res.json())
      .then((data) => {
        if (data?.name) setCompanyName(data.name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString("th-TH", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    setCurrentDate(formatted);
  }, []);

  const currentMeta =
    titleMap[pathname] ||
    (pathname.startsWith("/invoices/")
      ? {
          title: "รายละเอียดใบกำกับภาษี",
          subtitle: "ตรวจสอบข้อมูลและสั่งพิมพ์เอกสาร PDF",
        }
      : pathname.startsWith("/quotations/")
      ? {
          title: "รายละเอียดใบเสนอราคา",
          subtitle: "ตรวจสอบข้อมูลและสั่งพิมพ์เอกสาร PDF",
        }
      : pathname.startsWith("/billing/")
      ? {
          title: "รายละเอียดใบวางบิล",
          subtitle: "ตรวจสอบข้อมูลและสั่งพิมพ์เอกสาร PDF",
        }
      : {
          title: companyName ? `ระบบบัญชี ${companyName}` : "ระบบบัญชี Express",
          subtitle: "Express Alternative Web Platform",
        });

  return (
    <>
      <header className="h-16 sm:h-18 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Toggle Button (Both Mobile and Desktop) */}
        <button
          type="button"
          onClick={onToggleMenu}
          className={`p-2 -ml-1 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
            theme === "express"
              ? "text-[#6e3e11] hover:text-[#3e2308] hover:bg-[#ebd5be]"
              : theme === "dark"
              ? "text-slate-300 hover:text-white hover:bg-slate-800"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title={isCollapsed ? "ขยายเมนูด้านข้าง (Sidebar)" : "หุบเมนูด้านข้าง (Sidebar)"}
          aria-label="สลับแถบเมนูหลัก"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate max-w-[200px] xs:max-w-xs sm:max-w-none">
            {currentMeta.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 font-medium truncate">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Theme Switcher Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
            theme === "express"
              ? "bg-[#fee2bc] text-[#6e3e11] border-[#d8b88f] hover:bg-[#fcdab0] shadow-xs"
              : theme === "dark"
              ? "bg-slate-800 text-indigo-300 border-indigo-500/30 hover:bg-slate-700/80 shadow-xs"
              : "bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200/80"
          }`}
          title={
            theme === "express"
              ? "กำลังใช้งานธีม: Express Classic (คลิกเพื่อสลับเป็น Modern)"
              : theme === "dark"
              ? "กำลังใช้งานธีม: Dark Mode (คลิกเพื่อสลับเป็น Express Classic)"
              : "กำลังใช้งานธีม: Modern (คลิกเพื่อสลับเป็น Dark Mode)"
          }
        >
          {theme === "express" ? (
            <Palette size={13} className="text-[#9c5717]" />
          ) : theme === "dark" ? (
            <Moon size={13} className="text-indigo-400" />
          ) : (
            <Sun size={13} className="text-amber-500" />
          )}
          <span className="hidden sm:inline">
            {theme === "express" ? "Express Classic" : theme === "dark" ? "Dark Mode" : "Modern"}
          </span>
          <span className="sm:hidden">
            {theme === "express" ? "Express" : theme === "dark" ? "Dark" : "Modern"}
          </span>
        </button>

        {/* Signature Settings Button */}
        <button
          type="button"
          onClick={() => setShowSignatureModal(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
            theme === "express"
              ? "border-[#d8b88f] bg-[#fee2bc]/60 text-[#6e3e11] hover:bg-[#fee2bc]"
              : theme === "dark"
              ? "border-indigo-500/40 bg-indigo-950/50 text-indigo-300 hover:bg-indigo-900/60"
              : "border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80"
          }`}
          title="ตั้งค่าและวาดลายเซ็นสำหรับเอกสาร PDF ทั้งหมด"
        >
          <PenTool
            size={13}
            className={
              theme === "express"
                ? "text-[#9c5717]"
                : theme === "dark"
                ? "text-indigo-400"
                : "text-indigo-600"
            }
          />
          <span className="hidden sm:inline">ลายเซ็น</span>
        </button>

        {/* Date Display */}
        <div
          className={`hidden md:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
            theme === "express"
              ? "text-[#6e3e11] bg-[#fee2bc]/40 border-[#dfc39e]"
              : theme === "dark"
              ? "text-slate-300 bg-slate-800/80 border-slate-700/80"
              : "text-slate-600 bg-slate-100/80 border-slate-200"
          }`}
        >
          <Calendar
            size={13}
            className={
              theme === "express"
                ? "text-[#9c5717]"
                : theme === "dark"
                ? "text-indigo-400"
                : "text-blue-600"
            }
          />
          <span>{currentDate}</span>
        </div>

        {/* Security / VPN pill */}
        <div
          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            theme === "dark"
              ? "text-emerald-400 bg-emerald-950/50 border-emerald-800/50"
              : "text-emerald-700 bg-emerald-50 border-emerald-200/60"
          }`}
        >
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span className="hidden xs:inline">Tailscale Secured</span>
          <span className="xs:hidden">VPN</span>
        </div>
      </div>
    </header>

      <SignaturePadModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        initialRole="authorized"
      />
    </>
  );
}

