"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Users, Phone, MapPin, Building, CreditCard, Calendar, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

interface Customer {
  CUSCOD: string;
  PRENAM: string;
  CUSNAM: string;
  TELNUM: string;
  TAXID: string;
  ADDR01: string;
  PAYTRM: number;
  BALANCE: number;
  STATUS: string;
  statusType?: "A" | "UNSPECIFIED" | "I";
  isActive?: boolean;
  statusLabel?: string;
  lastInvoiceDate?: string | null;
  lastInvoiceDocnum?: string | null;
  lastInvoiceAmount?: number | null;
}

interface CustomerCounts {
  all: number;
  active: number;
  explicitActive: number;
  unspecified: number;
  inactive: number;
}

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<CustomerCounts>({
    all: 0,
    active: 0,
    explicitActive: 0,
    unspecified: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("A");
  const [sort, setSort] = useState("code");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status, sort, limit: "200" });
      const res = await fetch(`/api/customers?${params}`);
      const json = await res.json();
      setCustomers(json.data ?? []);
      setTotal(json.total ?? 0);
      if (json.counts) setCounts(json.counts);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, sort]);

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
              ฐานข้อมูลลูกค้า (Customer Directory)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              พบข้อมูลลูกค้าทั้งหมด <strong className="text-slate-800">{total}</strong> รายจาก ARMAS.DBF
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
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1 md:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา รหัสลูกค้า / ชื่อบริษัท / เลขผู้เสียภาษี / เบอร์โทร / เลขที่บิล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
              <ArrowUpDown size={13} className="text-slate-400" />
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">เรียง:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="code">รหัสลูกค้า</option>
                <option value="lastInvoice">บิลล่าสุด (ใหม่สุด)</option>
                <option value="balance">ยอดหนี้ค้างชำระ</option>
                <option value="name">ชื่อลูกค้า (ก-ฮ)</option>
              </select>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto max-w-full">
              {[
                { id: "A", label: "สถานะใช้งาน (Active)", count: counts.active },
                { id: "UNSPECIFIED", label: "ไม่ได้ระบุ (Active)", count: counts.unspecified },
                { id: "EXPLICIT_A", label: "Active", count: counts.explicitActive },
                { id: "I", label: "ยกเลิก (Inactive)", count: counts.inactive },
                { id: "all", label: "ทั้งหมด", count: counts.all },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                    status === tab.id
                      ? "bg-white text-blue-700 font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        status === tab.id
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-left">
                <th className="py-3.5 px-4 w-28">รหัสลูกค้า</th>
                <th className="py-3.5 px-4">ชื่อลูกค้า / บริษัท</th>
                <th className="py-3.5 px-4 w-36">เลขประจำตัวผู้เสียภาษี</th>
                <th className="py-3.5 px-4 w-32">เบอร์ติดต่อ</th>
                <th className="py-3.5 px-4 text-center w-24">เครดิต</th>
                <th className="py-3.5 px-4 text-center w-36">
                  <div className="flex items-center justify-center gap-1.5 text-blue-700">
                    <Calendar size={13} />
                    <span>บิลล่าสุด</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right w-32">ยอดค้างชำระ</th>
                <th className="py-3.5 px-4 text-center w-20">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                    กำลังโหลดรายชื่อลูกค้า...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    ไม่พบข้อมูลลูกค้า
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.CUSCOD} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {c.CUSCOD}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/50">
                          {c.CUSNAM?.[0] || "C"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {c.PRENAM} {c.CUSNAM}
                          </div>
                          {c.ADDR01 && (
                            <div className="text-[11px] text-slate-400 truncate max-w-sm flex items-center gap-1 mt-0.5">
                              <MapPin size={11} className="shrink-0 text-slate-300" />
                              <span className="truncate">{c.ADDR01}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {c.TAXID || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {c.TELNUM ? (
                        <div className="flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          <span>{c.TELNUM}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {c.PAYTRM > 0 ? `${c.PAYTRM} วัน` : "เงินสด"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {c.lastInvoiceDate ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 text-[11.5px]">
                            {new Date(c.lastInvoiceDate).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          {c.lastInvoiceDocnum && (
                            <div>
                              <Link
                                href={`/invoices/${encodeURIComponent(c.lastInvoiceDocnum)}`}
                                className="inline-flex items-center font-mono text-[10.5px] font-bold text-blue-700 hover:text-blue-900 hover:underline bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 transition"
                                title="คลิกเพื่อดูใบกำกับภาษีนี้"
                              >
                                {c.lastInvoiceDocnum}
                              </Link>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {c.BALANCE > 0 ? (
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200/50">
                          ฿{fmtMoney(c.BALANCE)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {c.statusType === "A" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : c.statusType === "UNSPECIFIED" ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60"
                          title="ใน Express ไม่ได้ระบุสถานะ (ถือเป็นสถานะใช้งานปกติ Active)"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          ไม่ได้ระบุ (Active)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          ยกเลิก (Inactive)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppShell>
);
}
