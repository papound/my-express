"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Printer, Calendar, CreditCard, Eye, Download } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { printPdf, downloadPdf } from "@/lib/pdf/client";
import { Pagination } from "@/components/common/Pagination";

interface Billing {
  BILNUM: string;
  BILDAT: string | null;
  CUSCOD: string;
  BILOUT: string | null;
  APPDAT: string | null;
  NETAMT: number;
  DOCSTAT: string;
  invoiceCount: number;
  customer?: { CUSNAM: string };
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  N: {
    label: "ปกติ (รอชำระ)",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  "0": {
    label: "ปกติ (รอชำระ)",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  P: {
    label: "ชำระเงินเรียบร้อย",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  C: {
    label: "ยกเลิก",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
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

export default function BillingPage() {
  const [records, setRecords] = useState<Billing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status,
        page: String(page),
        limit: String(limit),
      });
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/billing?${params}`);
      const json = await res.json();
      setRecords(json.data ?? []);
      setTotal(json.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, status, dateFrom, dateTo, page, limit]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              รายการใบวางบิล (Billing Statements)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              พบข้อมูลทั้งหมด <strong className="text-slate-800">{total}</strong> ฉบับจาก ARBIL.DBF
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

        {/* Filter and Search */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm space-y-3.5">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
            <div className="relative flex-1 md:max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="ค้นหา เลขที่ใบวางบิล / รหัสลูกค้า / ชื่อ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto max-w-full">
              {[
                { id: "all", label: "ทั้งหมด" },
                { id: "N", label: "ปกติ (รอชำระ)" },
                { id: "P", label: "ชำระแล้ว" },
                { id: "C", label: "ยกเลิก" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatus(tab.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    status === tab.id
                      ? "bg-white text-blue-700 font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Row */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar size={14} className="text-slate-400" />
              วันที่วางบิล:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-slate-400">ถึง</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline ml-1"
                >
                  ล้างวันที่
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-left">
                <th className="py-3.5 px-4 w-32">เลขที่ใบวางบิล</th>
                <th className="py-3.5 px-4 w-28">วันที่วางบิล</th>
                <th className="py-3.5 px-4">ลูกค้า</th>
                <th className="py-3.5 px-4 w-28">วันส่งบิล</th>
                <th className="py-3.5 px-4 w-28">วันนัดรับเงิน</th>
                <th className="py-3.5 px-4 text-center w-24">จำนวนใบแจ้งหนี้</th>
                <th className="py-3.5 px-4 text-right w-36">ยอดวางบิลสุทธิ</th>
                <th className="py-3.5 px-4 text-center w-28">สถานะ</th>
                <th className="py-3.5 px-4 text-center w-28">พิมพ์ PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                    กำลังโหลดข้อมูลใบวางบิล...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    ไม่พบรายการใบวางบิล
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const statusCfg =
                    STATUS_CONFIG[r.DOCSTAT] || {
                      label: r.DOCSTAT,
                      badgeClass: "bg-slate-100 text-slate-700",
                    };

                  return (
                    <tr
                      key={r.BILNUM}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-blue-700">
                        <Link href={`/billing/${encodeURIComponent(r.BILNUM)}`}>
                          {r.BILNUM}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {fmtDate(r.BILDAT)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {r.customer?.CUSNAM ?? r.CUSCOD}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          รหัส: {r.CUSCOD}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {fmtDate(r.BILOUT)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-blue-700">
                        {fmtDate(r.APPDAT)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                          {r.invoiceCount} ฉบับ
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        ฿{fmtMoney(r.NETAMT)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusCfg.badgeClass}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/billing/${encodeURIComponent(r.BILNUM)}`}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition"
                            title="ดูรายละเอียดใบวางบิล"
                          >
                            <Eye size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              printPdf(
                                `/api/pdf/billing/${encodeURIComponent(r.BILNUM)}`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200/80 hover:border-blue-200 transition text-[11px] font-medium"
                            title="สั่งพิมพ์ใบวางบิล"
                          >
                            <Printer size={13} className="text-blue-600" />
                            <span>พิมพ์</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              downloadPdf(
                                `/api/pdf/billing/${encodeURIComponent(r.BILNUM)}`,
                                `${r.BILNUM}.pdf`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200/80 hover:border-emerald-200 transition text-[11px] font-medium"
                            title="ดาวน์โหลด PDF"
                          >
                            <Download size={13} className="text-emerald-600" />
                            <span>โหลด</span>
                          </button>
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

      {/* Pagination Bar */}
      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        loading={loading}
      />
    </div>
  </AppShell>
);
}
