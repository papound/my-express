"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, ShieldCheck, Menu } from "lucide-react";

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
  "/customers": {
    title: "ทะเบียนลูกค้า",
    subtitle: "ข้อมูลผู้ซื้อ เลขประจำตัวผู้เสียภาษี และวงเงินเครดิตคงเหลือ",
  },
};

export function Header({ onToggleMenu }: { onToggleMenu?: () => void }) {
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState("");

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
          title: "ระบบบัญชีธงธัญ",
          subtitle: "Express Alternative Web Platform",
        });

  return (
    <header className="h-16 sm:h-18 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu on Mobile */}
        <button
          type="button"
          onClick={onToggleMenu}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition"
          aria-label="เปิดเมนูหลัก"
        >
          <Menu size={22} />
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
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
          <Calendar size={13} className="text-blue-600" />
          <span>{currentDate}</span>
        </div>

        {/* Security / VPN pill */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
          <span className="hidden xs:inline">Tailscale Secured</span>
          <span className="xs:hidden">VPN</span>
        </div>
      </div>
    </header>
  );
}

