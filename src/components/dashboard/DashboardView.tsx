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
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Search,
  Sparkles,
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

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [popupDocnum, setPopupDocnum] = useState<string | null>(null);

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
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-5 sm:p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 max-w-3xl">
          {/* Company Badge & Working Date */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-sm">
              <Building2 size={13} className="text-blue-200" />
              <span>{data?.company?.name || "บริษัท ธงธัญ99 จำกัด"}</span>
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
            ยินดีต้อนรับสู่ระบบบัญชี {data?.company?.name || "ธงธัญ"}
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
            <Receipt size={16} />
            ดูใบกำกับภาษีทั้งหมด
          </Link>
          <Link
            href="/billing"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-semibold text-xs hover:bg-white/25 transition"
          >
            <CreditCard size={16} />
            ตรวจสอบรอบวางบิล
          </Link>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
        <div className="absolute right-40 -top-10 w-48 h-48 rounded-full bg-indigo-500/10 pointer-events-none blur-xl"></div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ยอดขายรวมทั้งสิ้น
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
              ฿{fmtMoney(stats.totalSales)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span>จากทั้งหมด</span>
              <strong className="text-slate-700">{stats.invoiceCount}</strong>
              <span>ฉบับ</span>
            </div>
          </div>
        </div>

        {/* Cash Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ยอดขายสด (Cash)
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Banknote size={18} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-700">
              ฿{fmtMoney(stats.cashSales)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
              <span>เงินสดรับชำระทันที</span>
            </div>
          </div>
        </div>

        {/* Credit Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ยอดขายเชื่อ (Credit)
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-indigo-700">
              ฿{fmtMoney(stats.creditSales)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-600">
              <span>มีกำหนดเครดิตเทอม</span>
            </div>
          </div>
        </div>

        {/* Total Outstanding Receivables */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ลูกหนี้คงค้างรวม
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-700">
              ฿{fmtMoney(stats.totalOutstanding)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600">
              <span>ยอดที่ยังรอเรียกเก็บเงิน</span>
            </div>
          </div>
        </div>
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
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
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
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
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

        {/* Right Column: Top Debtors & Summary Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Outstanding Debtors */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ลูกหนี้ค้างชำระสูงสุด
                </h3>
                <p className="text-xs text-slate-500">Top 5 Outstanding</p>
              </div>
              <Link
                href="/customers"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                ดูทั้งหมด
              </Link>
            </div>

            <div className="space-y-3.5">
              {data?.topDebtors.map((deb, idx) => (
                <div
                  key={deb.CUSCOD}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200/60">
                      {idx + 1}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {deb.PRENAM} {deb.CUSNAM}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {deb.CUSCOD} {deb.TELNUM && `• ${deb.TELNUM}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-red-600">
                      ฿{fmtMoney(deb.BALANCE)}
                    </div>
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
              สถานะข้อมูลประจำบริษัทธงธัญ
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

