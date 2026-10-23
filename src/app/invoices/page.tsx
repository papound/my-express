"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Printer,
  Eye,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

interface Invoice {
  RECTYP: string;
  DOCNUM: string;
  DOCDAT: string | null;
  CUSCOD: string;
  DUEDAT: string | null;
  AMOUNT: number;
  DISCAMT: number;
  VATAMT: number;
  NETAMT: number;
  TOTAL: number;
  REMAMT: number;
  DOCSTAT: string;
  customer?: { CUSNAM: string; PRENAM: string };
}

const TYPE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  "3": {
    label: "ขายเชื่อ",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80",
  },
  "2": {
    label: "ขายเชื่อ",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80",
  },
  "1": {
    label: "ขายสด",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  "5": {
    label: "รับคืน",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
  "0": {
    label: "มัดจำ",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80",
  },
  "4": {
    label: "เพิ่มหนี้",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
};

const STATUS_CONFIG: Record<string, { label: string; dotClass: string }> = {
  N: { label: "ปกติ", dotClass: "bg-emerald-500" },
  "0": { label: "ปกติ", dotClass: "bg-emerald-500" },
  C: { label: "ยกเลิก", dotClass: "bg-rose-500" },
  P: { label: "ชำระแล้ว", dotClass: "bg-blue-500" },
  R: { label: "รับชำระแล้ว", dotClass: "bg-blue-500" },
  M: { label: "แก้ไข", dotClass: "bg-amber-500" },
};

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rectyp, setRectyp] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, rectyp, limit: "200" });
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/invoices?${params}`);
      const json = await res.json();
      setInvoices(json.data ?? []);
      setTotal(json.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, rectyp, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Banner / Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              รายการใบกำกับภาษี & ใบเสร็จรับเงิน
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              พบข้อมูลทั้งหมด <strong className="text-slate-800">{total}</strong>{" "}
              ฉบับในฐานข้อมูล ARTRN.DBF
            </p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl shadow-sm transition self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            รีเฟรชข้อมูล
          </button>
        </div>

        {/* Filter and Search Bar Card */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm space-y-3.5">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
            <div className="relative flex-1 md:max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="ค้นหา เลขที่เอกสาร / รหัสลูกค้า / ชื่อลูกค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto max-w-full">
              {[
                { id: "all", label: "ทั้งหมด" },
                { id: "3", label: "ขายเงินเชื่อ (IV)" },
                { id: "1", label: "ขายเงินสด (HS)" },
                { id: "5", label: "รับคืน (SR)" },
                { id: "0", label: "เงินมัดจำ (AI)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRectyp(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    rectyp === tab.id
                      ? "bg-white text-blue-700 font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar size={14} className="text-slate-400" />
              ช่วงวันที่เอกสาร:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-slate-400">ถึง</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline ml-1"
                >
                  ล้างวันที่
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modern Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-left">
                  <th className="py-3.5 px-4 w-32">เลขที่เอกสาร</th>
                  <th className="py-3.5 px-4 w-28">วันที่</th>
                  <th className="py-3.5 px-4 w-24">ประเภท</th>
                  <th className="py-3.5 px-4">ลูกค้า</th>
                  <th className="py-3.5 px-4 text-right w-28">ยอดรวม</th>
                  <th className="py-3.5 px-4 text-right w-24">ภาษี (VAT)</th>
                  <th className="py-3.5 px-4 text-right w-32">จำนวนเงินสุทธิ</th>
                  <th className="py-3.5 px-4 text-center w-24">สถานะ</th>
                  <th className="py-3.5 px-4 text-center w-28">พิมพ์ / ดู</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                      กำลังโหลดข้อมูลใบกำกับภาษี...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      ไม่พบรายการเอกสารตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const typeCfg =
                      TYPE_CONFIG[inv.RECTYP] || {
                        label: inv.RECTYP,
                        badgeClass: "bg-slate-100 text-slate-700",
                      };
                    const statusCfg =
                      STATUS_CONFIG[inv.DOCSTAT] || {
                        label: inv.DOCSTAT,
                        dotClass: "bg-slate-400",
                      };

                    return (
                      <tr
                        key={inv.DOCNUM}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-blue-700">
                          <Link href={`/invoices/${encodeURIComponent(inv.DOCNUM)}`}>
                            {inv.DOCNUM}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {fmtDate(inv.DOCDAT)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeCfg.badgeClass}`}
                          >
                            {typeCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 truncate max-w-xs">
                            {inv.customer?.PRENAM} {inv.customer?.CUSNAM ?? inv.CUSCOD}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            รหัส: {inv.CUSCOD}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          {fmtMoney(inv.AMOUNT)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          {fmtMoney(inv.VATAMT)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          ฿{fmtMoney(inv.NETAMT)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}
                            ></span>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/invoices/${encodeURIComponent(inv.DOCNUM)}`}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition"
                              title="ดูรายละเอียดใบกำกับ"
                            >
                              <Eye size={15} />
                            </Link>
                            <a
                              href={`/api/pdf/invoice/${encodeURIComponent(inv.DOCNUM)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200/80 hover:border-emerald-200 transition text-[11px] font-medium"
                              title="พิมพ์ PDF Express Voucher"
                            >
                              <Printer size={13} className="text-emerald-600" />
                              <span>PDF</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

