"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  Banknote,
  Users,
  FileText,
  Printer,
  Eye,
  AlertCircle,
  AlertTriangle,
  Clock,
  CalendarClock,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Building2,
  Calendar,
  MapPin,
  Download,
  Bookmark,
  Link2,
} from "lucide-react";
import { printPdf, downloadPdf } from "@/lib/pdf/client";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";

interface SalesPeriodData {
  total: number;
  cash: number;
  credit: number;
  count: number;
}

interface AgingBucket {
  amount: number;
  count: number;
}

interface OverdueInvoice {
  DOCNUM: string;
  DOCDAT: string | null;
  DUEDAT: string | null;
  daysOverdue: number;
  REMAMT: number;
  NETAMT: number;
  RECTYP: string;
  CUSCOD: string;
  customer?: {
    CUSNAM: string;
    PRENAM: string;
  };
}

interface DueSoonInvoice {
  DOCNUM: string;
  DOCDAT: string | null;
  DUEDAT: string | null;
  daysRemaining: number;
  REMAMT: number;
  NETAMT: number;
  RECTYP: string;
  CUSCOD: string;
  customer?: {
    CUSNAM: string;
    PRENAM: string;
  };
}

interface UnappliedDeposit {
  DOCNUM: string;
  DOCDAT: string | null;
  NETAMT: number;
  REMAMT: number;
  CUSCOD: string;
  customer?: {
    CUSNAM: string;
    PRENAM: string;
  };
}

interface DashboardData {
  company?: {
    name: string;
    engName?: string;
    taxId?: string;
    address?: string;
    tel?: string;
  };
  workingDate?: string;
  stats: {
    totalSales: number;
    cashSales: number;
    creditSales: number;
    totalOutstanding: number;
    invoiceCount: number;
    customerCount: number;
    quotationCount: number;
    billingCount: number;
    totalUnappliedDepositAmount?: number;
    unappliedDepositCount?: number;
  };
  salesPeriods?: {
    all: SalesPeriodData;
    month: SalesPeriodData;
    week: SalesPeriodData;
    today: SalesPeriodData;
  };
  aging?: {
    notDue: AgingBucket;
    days1_30: AgingBucket;
    days31_60: AgingBucket;
    days61_90: AgingBucket;
    daysOver90: AgingBucket;
    totalAmount: number;
    totalCount: number;
  };
  alerts?: {
    overdueCount: number;
    overdueTotal: number;
    overdueList: OverdueInvoice[];
    dueSoonCount: number;
    dueSoonTotal: number;
    dueSoonList: DueSoonInvoice[];
    unappliedDeposits: UnappliedDeposit[];
  };
  recentInvoices: Array<{
    DOCNUM: string;
    DOCDAT: string | null;
    RECTYP: string;
    CUSCOD: string;
    NETAMT: number;
    REMAMT: number;
    ADVNUM?: string | null;
    ADVAMT?: number;
    appliedInvoices?: Array<{
      DOCNUM: string;
      RECTYP: string;
      ADVAMT: number;
      DOCDAT: string | null;
    }>;
    DOCSTAT: string;
    customer?: {
      CUSNAM: string;
      PRENAM: string;
    };
  }>;
  topDebtors: Array<{
    CUSCOD: string;
    PRENAM: string;
    CUSNAM: string;
    BALANCE: number;
    TELNUM: string;
  }>;
}

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtPct(part: number, total: number) {
  if (!total || total <= 0) return "0.0%";
  return ((part / total) * 100).toFixed(1) + "%";
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [popupDocnum, setPopupDocnum] = useState<string | null>(null);
  const [salesPeriod, setSalesPeriod] = useState<"all" | "month" | "week" | "today">("all");
  const [alertTab, setAlertTab] = useState<"overdue" | "dueSoon" | "deposits">("overdue");

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="animate-spin mb-3 text-blue-600" size={32} />
        <p className="text-sm font-medium">กำลังรวบรวมตัวเลขจาก Express DBF...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalSales: 0,
    cashSales: 0,
    creditSales: 0,
    totalOutstanding: 0,
    invoiceCount: 0,
    customerCount: 0,
    quotationCount: 0,
    billingCount: 0,
    totalUnappliedDepositAmount: 0,
    unappliedDepositCount: 0,
  };

  const activeSales = data?.salesPeriods?.[salesPeriod] || {
    total: stats.totalSales,
    cash: stats.cashSales,
    credit: stats.creditSales,
    count: stats.invoiceCount,
  };

  const aging = data?.aging || {
    notDue: { amount: 0, count: 0 },
    days1_30: { amount: 0, count: 0 },
    days31_60: { amount: 0, count: 0 },
    days61_90: { amount: 0, count: 0 },
    daysOver90: { amount: 0, count: 0 },
    totalAmount: stats.totalOutstanding,
    totalCount: 0,
  };

  const alerts = data?.alerts || {
    overdueCount: 0,
    overdueTotal: 0,
    overdueList: [],
    dueSoonCount: 0,
    dueSoonTotal: 0,
    dueSoonList: [],
    unappliedDeposits: [],
  };

  const agingTotal = aging.totalAmount || stats.totalOutstanding || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-5 sm:p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 max-w-3xl">
          {/* Company Badge & Working Date */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-sm">
              <Building2 size={13} className="text-blue-200" />
              <span>{data?.company?.name || "ระบบบัญชี Express"}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/40 backdrop-blur-md border border-white/10 text-xs text-blue-100">
              <Calendar size={13} className="text-blue-300" />
              <span>วันที่ทำการ:</span>
              <strong className="text-white font-semibold">
                {new Date(data?.workingDate || Date.now()).toLocaleDateString("th-TH", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </div>
            {data?.company?.taxId && (
              <span className="hidden sm:inline-flex text-[11px] text-blue-200/80 px-2 py-0.5 rounded bg-black/20">
                เลขประจำตัวผู้เสียภาษี: {data.company.taxId}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            ยินดีต้อนรับสู่ระบบบัญชี {data?.company?.name || "Express"}
          </h2>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl">
            ระบบบริหารจัดการบัญชีและการเงินแบบเรียลไทม์ เชื่อมโยงฐานข้อมูล Express อัตโนมัติ
            {data?.company?.address && (
              <span className="block mt-1 text-[11px] sm:text-xs text-blue-200/80">
                <MapPin size={12} className="inline mr-1 text-blue-300 -mt-0.5" />
                {data.company.address} {data.company.tel ? `• ${data.company.tel}` : ""}
              </span>
            )}
          </p>
        </div>

        {/* Quick link button on banner */}
        <div className="mt-5 sm:mt-6 flex flex-col xs:flex-row flex-wrap gap-2.5 sm:gap-3 relative z-10">
          <Link
            href="/invoices"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 font-semibold text-xs shadow-md hover:bg-blue-50 transition"
          >
            <FileText size={16} />
            ดูใบกำกับภาษีทั้งหมด
          </Link>
          <Link
            href="/billing"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-semibold text-xs hover:bg-white/25 transition"
          >
            <CreditCard size={16} />
            ตรวจสอบรอบวางบิล
          </Link>
          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-xs hover:bg-white/20 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            รีเฟรชข้อมูล
          </button>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
        <div className="absolute right-40 -top-10 w-48 h-48 rounded-full bg-indigo-500/10 pointer-events-none blur-xl"></div>
      </div>

      {/* KPI Section with Period Selector */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ภาพรวมยอดขาย & สภาพคล่องทางการค้า
            </h3>
            <p className="text-xs text-slate-500">
              ตัวเลขสรุปจากระบบขาย Express DBF แบบเรียลไทม์
            </p>
          </div>

          {/* Period Selector Tabs */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
            {[
              { id: "all", label: "ทั้งหมด" },
              { id: "month", label: "เดือนนี้" },
              { id: "week", label: "7 วันนี้" },
              { id: "today", label: "วันนี้" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSalesPeriod(tab.id as typeof salesPeriod)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  salesPeriod === tab.id
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards Grid (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total Sales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                ยอดขายรวม ({salesPeriod === "all" ? "ทั้งหมด" : salesPeriod === "month" ? "เดือนนี้" : salesPeriod === "week" ? "7 วัน" : "วันนี้"})
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-slate-900">
                ฿{fmtMoney(activeSales.total)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>จำนวน</span>
                <strong className="text-slate-700 font-mono font-bold">{activeSales.count}</strong>
                <span>ฉบับ</span>
              </div>
            </div>
          </div>

          {/* Cash Sales (HS) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                ขายสด (Cash - HS)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                <Banknote size={16} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-emerald-700">
                ฿{fmtMoney(activeSales.cash)}
              </div>
              <div className="mt-1 text-[11px] text-emerald-600">
                <span>เงินสดรับชำระทันที</span>
              </div>
            </div>
          </div>

          {/* Credit Sales (IV) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                ขายเชื่อ (Credit - IV)
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-indigo-700">
                ฿{fmtMoney(activeSales.credit)}
              </div>
              <div className="mt-1 text-[11px] text-indigo-600">
                <span>มีกำหนดเครดิตเทอม</span>
              </div>
            </div>
          </div>

          {/* Total Outstanding Receivables (AR) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                ลูกหนี้คงค้างรวม (AR)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-amber-700">
                ฿{fmtMoney(stats.totalOutstanding)}
              </div>
              <div className="mt-1 text-[11px] text-amber-600">
                <span>ยอดที่ยังรอเรียกเก็บเงิน</span>
              </div>
            </div>
          </div>

          {/* Unapplied Deposits (AI) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                มัดจำค้างรับ (AI)
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
                <Bookmark size={16} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-purple-700">
                ฿{fmtMoney(stats.totalUnappliedDepositAmount || 0)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-purple-600">
                <span>รอหักในบิลขาย</span>
                <strong className="font-mono font-bold">{stats.unappliedDepositCount || 0}</strong>
                <span>ใบ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AR Aging Schedule Widget */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock size={18} className="text-blue-600" />
              <span>โครงสร้างอายุลูกหนี้การค้า (AR Aging Schedule)</span>
            </h3>
            <p className="text-xs text-slate-500">
              วิเคราะห์ความเสี่ยงและกำหนดนัดชำระเงินของลูกหนี้คงค้างรวม ฿{fmtMoney(aging.totalAmount)} ({aging.totalCount} ฉบับ)
            </p>
          </div>
          <Link
            href="/invoices?rectyp=3"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            เปิดดูบิลขายเชื่อทั้งหมด <ChevronRight size={14} />
          </Link>
        </div>

        {/* Visual Distribution Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: fmtPct(aging.notDue.amount, agingTotal) }}
              className="bg-emerald-500 transition-all"
              title={`ยังไม่ถึงกำหนด: ฿${fmtMoney(aging.notDue.amount)} (${fmtPct(aging.notDue.amount, agingTotal)})`}
            />
            <div
              style={{ width: fmtPct(aging.days1_30.amount, agingTotal) }}
              className="bg-amber-400 transition-all"
              title={`1–30 วัน: ฿${fmtMoney(aging.days1_30.amount)} (${fmtPct(aging.days1_30.amount, agingTotal)})`}
            />
            <div
              style={{ width: fmtPct(aging.days31_60.amount, agingTotal) }}
              className="bg-orange-400 transition-all"
              title={`31–60 วัน: ฿${fmtMoney(aging.days31_60.amount)} (${fmtPct(aging.days31_60.amount, agingTotal)})`}
            />
            <div
              style={{ width: fmtPct(aging.days61_90.amount, agingTotal) }}
              className="bg-rose-400 transition-all"
              title={`61–90 วัน: ฿${fmtMoney(aging.days61_90.amount)} (${fmtPct(aging.days61_90.amount, agingTotal)})`}
            />
            <div
              style={{ width: fmtPct(aging.daysOver90.amount, agingTotal) }}
              className="bg-rose-600 transition-all"
              title={`เกิน 90 วัน: ฿${fmtMoney(aging.daysOver90.amount)} (${fmtPct(aging.daysOver90.amount, agingTotal)})`}
            />
          </div>
        </div>

        {/* Aging Breakdown Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
          {/* Not Due */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between text-emerald-800 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ยังไม่ถึงกำหนด
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">
                {fmtPct(aging.notDue.amount, agingTotal)}
              </span>
            </div>
            <div className="text-sm sm:text-base font-mono font-bold text-emerald-900">
              ฿{fmtMoney(aging.notDue.amount)}
            </div>
            <div className="text-[10.5px] text-emerald-700 mt-0.5">
              {aging.notDue.count} ฉบับ
            </div>
          </div>

          {/* 1-30 Days */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between text-amber-800 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                1 – 30 วัน
              </span>
              <span className="text-[10px] text-amber-600 font-bold">
                {fmtPct(aging.days1_30.amount, agingTotal)}
              </span>
            </div>
            <div className="text-sm sm:text-base font-mono font-bold text-amber-900">
              ฿{fmtMoney(aging.days1_30.amount)}
            </div>
            <div className="text-[10.5px] text-amber-700 mt-0.5">
              {aging.days1_30.count} ฉบับ
            </div>
          </div>

          {/* 31-60 Days */}
          <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80">
            <div className="flex items-center justify-between text-orange-800 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                31 – 60 วัน
              </span>
              <span className="text-[10px] text-orange-600 font-bold">
                {fmtPct(aging.days31_60.amount, agingTotal)}
              </span>
            </div>
            <div className="text-sm sm:text-base font-mono font-bold text-orange-900">
              ฿{fmtMoney(aging.days31_60.amount)}
            </div>
            <div className="text-[10.5px] text-orange-700 mt-0.5">
              {aging.days31_60.count} ฉบับ
            </div>
          </div>

          {/* 61-90 Days */}
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80">
            <div className="flex items-center justify-between text-rose-800 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                61 – 90 วัน
              </span>
              <span className="text-[10px] text-rose-600 font-bold">
                {fmtPct(aging.days61_90.amount, agingTotal)}
              </span>
            </div>
            <div className="text-sm sm:text-base font-mono font-bold text-rose-900">
              ฿{fmtMoney(aging.days61_90.amount)}
            </div>
            <div className="text-[10.5px] text-rose-700 mt-0.5">
              {aging.days61_90.count} ฉบับ
            </div>
          </div>

          {/* >90 Days */}
          <div className="p-3 rounded-xl bg-rose-100/70 border border-rose-300/80">
            <div className="flex items-center justify-between text-rose-900 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                เกิน 90 วัน
              </span>
              <span className="text-[10px] text-rose-700 font-bold">
                {fmtPct(aging.daysOver90.amount, agingTotal)}
              </span>
            </div>
            <div className="text-sm sm:text-base font-mono font-bold text-rose-950">
              ฿{fmtMoney(aging.daysOver90.amount)}
            </div>
            <div className="text-[10.5px] text-rose-800 mt-0.5">
              {aging.daysOver90.count} ฉบับ
            </div>
          </div>
        </div>
      </div>

      {/* Financial Actionable Alerts & Risk Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-600" />
              <span>ศูนย์ติดตามหนี้และการเงิน (Cashflow & Risk Alerts)</span>
            </h3>
            <p className="text-xs text-slate-500">
              รายการที่ต้องดำเนินการด่วน: บิลเลยกำหนด, บิลใกล้ครบกำหนด และเงินมัดจำคงค้าง
            </p>
          </div>

          {/* Alert Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto self-start sm:self-auto max-w-full">
            <button
              type="button"
              onClick={() => setAlertTab("overdue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                alertTab === "overdue"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <AlertTriangle size={13} />
              <span>เลยกำหนดชำระ</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                alertTab === "overdue" ? "bg-white/25 text-white" : "bg-rose-100 text-rose-700"
              }`}>
                {alerts.overdueCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAlertTab("dueSoon")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                alertTab === "dueSoon"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock size={13} />
              <span>ครบกำหนดใน 7 วัน</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                alertTab === "dueSoon" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
              }`}>
                {alerts.dueSoonCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAlertTab("deposits")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                alertTab === "deposits"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Bookmark size={13} />
              <span>มัดจำค้างตัด</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                alertTab === "deposits" ? "bg-white/25 text-white" : "bg-purple-100 text-purple-700"
              }`}>
                {stats.unappliedDepositCount || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Overdue Invoices List */}
        {alertTab === "overdue" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-rose-800 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
              <span className="font-semibold">
                พบหนี้เลยกำหนดชำระทั้งหมด {alerts.overdueCount} ฉบับ รวมยอด ฿{fmtMoney(alerts.overdueTotal)}
              </span>
              <span className="text-[11px] text-rose-600">คลิกเลขที่เอกสารเพื่อเปิดดูบิล</span>
            </div>

            {alerts.overdueList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                ไม่มีรายการบิลที่เลยกำหนดชำระในขณะนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-100 text-left">
                      <th className="pb-2.5 px-2">เลขที่เอกสาร</th>
                      <th className="pb-2.5 px-2">วันครบกำหนด</th>
                      <th className="pb-2.5 px-2">สถานะเลยกำหนด</th>
                      <th className="pb-2.5 px-2">ลูกค้า</th>
                      <th className="pb-2.5 px-2 text-right">ยอดคงค้าง</th>
                      <th className="pb-2.5 px-2 text-center">ดูบิล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alerts.overdueList.map((inv) => (
                      <tr key={inv.DOCNUM} className="hover:bg-rose-50/40 transition">
                        <td className="py-2.5 px-2 font-mono font-bold text-slate-900">
                          <button
                            type="button"
                            onClick={() => setPopupDocnum(inv.DOCNUM)}
                            className="hover:underline text-blue-700 cursor-pointer"
                            title="คลิกดูรายละเอียดบิล"
                          >
                            {inv.DOCNUM}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 font-medium">
                          {fmtDate(inv.DUEDAT)}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle size={11} className="text-rose-600" />
                            เกิน {inv.daysOverdue} วัน
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-medium text-slate-800 truncate max-w-xs">
                          {inv.customer?.PRENAM} {inv.customer?.CUSNAM ?? inv.CUSCOD}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-700">
                          ฿{fmtMoney(inv.REMAMT)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setPopupDocnum(inv.DOCNUM)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="ดูรายละเอียดบิล"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Due Soon Invoices List */}
        {alertTab === "dueSoon" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
              <span className="font-semibold">
                พบบิลถึงกำหนดชำระใน 7 วันนี้ ทั้งหมด {alerts.dueSoonCount} ฉบับ รวมยอด ฿{fmtMoney(alerts.dueSoonTotal)}
              </span>
              <span className="text-[11px] text-amber-600">เตรียมวางบิลและติดตามล่วงหน้า</span>
            </div>

            {alerts.dueSoonList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                ไม่มีรายการบิลที่ครบกำหนดใน 7 วันนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-100 text-left">
                      <th className="pb-2.5 px-2">เลขที่เอกสาร</th>
                      <th className="pb-2.5 px-2">วันครบกำหนด</th>
                      <th className="pb-2.5 px-2">ระยะเวลานัดชำระ</th>
                      <th className="pb-2.5 px-2">ลูกค้า</th>
                      <th className="pb-2.5 px-2 text-right">ยอดนัดชำระ</th>
                      <th className="pb-2.5 px-2 text-center">ดูบิล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alerts.dueSoonList.map((inv) => (
                      <tr key={inv.DOCNUM} className="hover:bg-amber-50/40 transition">
                        <td className="py-2.5 px-2 font-mono font-bold text-slate-900">
                          <button
                            type="button"
                            onClick={() => setPopupDocnum(inv.DOCNUM)}
                            className="hover:underline text-blue-700 cursor-pointer"
                            title="คลิกดูรายละเอียดบิล"
                          >
                            {inv.DOCNUM}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 font-medium">
                          {fmtDate(inv.DUEDAT)}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            inv.daysRemaining === 0
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }`}>
                            <Clock size={11} />
                            {inv.daysRemaining === 0 ? "ครบกำหนดวันนี้" : `อีก ${inv.daysRemaining} วัน`}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-medium text-slate-800 truncate max-w-xs">
                          {inv.customer?.PRENAM} {inv.customer?.CUSNAM ?? inv.CUSCOD}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-800">
                          ฿{fmtMoney(inv.REMAMT)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setPopupDocnum(inv.DOCNUM)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="ดูรายละเอียดบิล"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Unapplied Advance Deposits List */}
        {alertTab === "deposits" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-purple-900 bg-purple-50 px-3 py-2 rounded-xl border border-purple-200">
              <span className="font-semibold">
                พบใบรับเงินมัดจำที่ยังไม่ถูกหักในบิลขาย {stats.unappliedDepositCount || 0} ฉบับ รวมยอด ฿{fmtMoney(stats.totalUnappliedDepositAmount || 0)}
              </span>
              <span className="text-[11px] text-purple-700">ตรวจสอบเพื่อนำไปตัดบิลขายให้ลูกค้า</span>
            </div>

            {alerts.unappliedDeposits.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                ไม่มีเงินมัดจำค้างตัดในระบบ (ตัดครบทุกบิลแล้ว)
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-100 text-left">
                      <th className="pb-2.5 px-2">เลขที่ใบมัดจำ</th>
                      <th className="pb-2.5 px-2">วันที่รับมัดจำ</th>
                      <th className="pb-2.5 px-2">สถานะมัดจำ</th>
                      <th className="pb-2.5 px-2">ลูกค้า</th>
                      <th className="pb-2.5 px-2 text-right">ยอดมัดจำคงค้าง</th>
                      <th className="pb-2.5 px-2 text-center">ดูใบมัดจำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alerts.unappliedDeposits.map((dep) => (
                      <tr key={dep.DOCNUM} className="hover:bg-purple-50/40 transition">
                        <td className="py-2.5 px-2 font-mono font-bold text-slate-900">
                          <button
                            type="button"
                            onClick={() => setPopupDocnum(dep.DOCNUM)}
                            className="hover:underline text-purple-700 cursor-pointer"
                            title="คลิกดูรายละเอียดใบรับเงินมัดจำ"
                          >
                            {dep.DOCNUM}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 font-medium">
                          {fmtDate(dep.DOCDAT)}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <Bookmark size={11} className="text-purple-600" />
                            คงเหลือพร้อมหัก
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-medium text-slate-800 truncate max-w-xs">
                          {dep.customer?.PRENAM} {dep.customer?.CUSNAM ?? dep.CUSCOD}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-purple-800">
                          ฿{fmtMoney(dep.REMAMT)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setPopupDocnum(dep.DOCNUM)}
                            className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                            title="ดูรายละเอียดใบมัดจำ"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Recent Invoices (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                รายการขายล่าสุด (Recent Invoices)
              </h3>
              <p className="text-xs text-slate-500">
                อัพเดตตรงจากข้อมูลบัญชี ARTRN.DBF
              </p>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ดูทั้งหมด <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 text-left">
                  <th className="pb-3 px-2">เลขที่</th>
                  <th className="pb-3 px-2">วันที่</th>
                  <th className="pb-3 px-2">ประเภท</th>
                  <th className="pb-3 px-2">ลูกค้า</th>
                  <th className="pb-3 px-2 text-right">ยอดสุทธิ</th>
                  <th className="pb-3 px-2 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.recentInvoices.map((inv) => (
                  <tr
                    key={inv.DOCNUM}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3 px-2 font-mono font-medium text-slate-900">
                      <button
                        type="button"
                        onClick={() => setPopupDocnum(inv.DOCNUM)}
                        className="hover:underline text-left cursor-pointer transition text-blue-700 hover:text-blue-800"
                        title="คลิกเพื่อเปิดดูรายละเอียดเอกสาร"
                      >
                        {inv.DOCNUM}
                      </button>

                      {/* If Sales bill with Deposit deducted */}
                      {inv.ADVNUM && (
                        <div className="mt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPopupDocnum(inv.ADVNUM!);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition cursor-pointer"
                            title={`คลิกเปิดดูใบรับเงินมัดจำ ${inv.ADVNUM}`}
                          >
                            <Bookmark size={9} className="text-amber-600 shrink-0" />
                            <span>หักมัดจำ: {inv.ADVNUM}</span>
                          </button>
                        </div>
                      )}

                      {/* If Deposit bill, show linked sales bills */}
                      {inv.RECTYP === "0" && inv.appliedInvoices && inv.appliedInvoices.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {inv.appliedInvoices.map((applied) => (
                            <button
                              key={applied.DOCNUM}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPopupDocnum(applied.DOCNUM);
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer"
                              title={`คลิกเปิดดูบิลขาย ${applied.DOCNUM}`}
                            >
                              <Link2 size={9} className="text-emerald-600 shrink-0" />
                              <span>รวมใน: {applied.DOCNUM}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      {fmtDate(inv.DOCDAT)}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.RECTYP === "1"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : inv.RECTYP === "3" || inv.RECTYP === "2"
                            ? "bg-blue-50 text-blue-700 border border-blue-200/50"
                            : inv.RECTYP === "5"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                            : inv.RECTYP === "0"
                            ? "bg-purple-50 text-purple-700 border border-purple-200/50"
                            : inv.RECTYP === "9"
                            ? "bg-teal-50 text-teal-700 border border-teal-200/50"
                            : "bg-slate-100 text-slate-700 border border-slate-200/50"
                        }`}
                      >
                        {inv.RECTYP === "1"
                          ? "ขายสด"
                          : inv.RECTYP === "3" || inv.RECTYP === "2"
                          ? "ขายเชื่อ"
                          : inv.RECTYP === "5"
                          ? "รับคืน"
                          : inv.RECTYP === "0"
                          ? "เงินมัดจำ"
                          : inv.RECTYP === "9"
                          ? "รับชำระหนี้"
                          : "อื่นๆ"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-medium text-slate-800 truncate max-w-[180px]">
                        {inv.customer?.PRENAM} {inv.customer?.CUSNAM ?? inv.CUSCOD}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                      ฿{fmtMoney(inv.NETAMT)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPopupDocnum(inv.DOCNUM)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="ดูรายละเอียดเอกสาร"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            printPdf(
                              `/api/pdf/invoice/${encodeURIComponent(inv.DOCNUM)}`
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="สั่งพิมพ์เอกสาร"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadPdf(
                              `/api/pdf/invoice/${encodeURIComponent(inv.DOCNUM)}`,
                              `${inv.DOCNUM}.pdf`
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="ดาวน์โหลด PDF"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Debtors + Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Debtors Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                <span>ลูกหนี้ค้างชำระสูงสุด (Top Debtors)</span>
              </h4>
              <Link
                href="/customers"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                ดูทั้งหมด
              </Link>
            </div>

            <div className="space-y-3">
              {data?.topDebtors.map((deb, idx) => (
                <div
                  key={deb.CUSCOD}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {deb.PRENAM} {deb.CUSNAM}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        รหัส: {deb.CUSCOD}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-rose-600">
                      ฿{fmtMoney(deb.BALANCE)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Statistics Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-1">
              สรุปข้อมูลมาสเตอร์ (Express Tables)
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              สถานะข้อมูลประจำ{data?.company?.name ? `${data.company.name}` : "ระบบบัญชี"}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">ลูกค้าทั้งหมด</span>
                <strong className="text-lg font-mono text-white">
                  {stats.customerCount}
                </strong>
                <span className="text-slate-400 text-[10px] ml-1">ราย</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">ใบเสนอราคา</span>
                <strong className="text-lg font-mono text-white">
                  {stats.quotationCount}
                </strong>
                <span className="text-slate-400 text-[10px] ml-1">ฉบับ</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">รอบใบวางบิล</span>
                <strong className="text-lg font-mono text-white">
                  {stats.billingCount}
                </strong>
                <span className="text-slate-400 text-[10px] ml-1">ฉบับ</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">ใบกำกับภาษี</span>
                <strong className="text-lg font-mono text-white">
                  {stats.invoiceCount}
                </strong>
                <span className="text-slate-400 text-[10px] ml-1">ฉบับ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Detail Popup Modal */}
      <InvoiceDetailModal
        docnum={popupDocnum}
        onClose={() => setPopupDocnum(null)}
      />
    </div>
  );
}
