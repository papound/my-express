"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Package,
  Warehouse,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Barcode,
  Layers,
  Eye,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Pagination } from "@/components/common/Pagination";
import { ProductDetailModal } from "@/components/inventory/ProductDetailModal";

interface ProductItem {
  STKCOD: string;
  STKDES: string;
  STKDES2: string;
  BARCOD: string;
  STKGRP: string;
  groupName: string;
  QUCOD: string;
  unitName: string;
  TOTBAL: number;
  TOTVAL: number;
  UNITPR: number;
  SELLPR1: number;
  STATUS: string;
  locations: Array<{
    LOCCOD: string;
    warehouseName: string;
    LOCBAL: number;
    LOCVAL: number;
  }>;
}

interface WarehouseSummary {
  code: string;
  name: string;
  totalQty: number;
  totalVal: number;
  itemCount: number;
}

interface InventoryApiResponse {
  summary: {
    totalSkus: number;
    inStockCount: number;
    negativeCount: number;
    zeroCount: number;
    totalBalanceQty: number;
    totalBalanceValue: number;
    warehouseBreakdown: WarehouseSummary[];
  };
  warehouses: Array<{ code: string; name: string }>;
  groups: Array<{ code: string; name: string; count: number }>;
  data: ProductItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0.00";
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtQty(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0.00";
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function InventoryPage() {
  const [data, setData] = useState<InventoryApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [group, setGroup] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedStkcod, setSelectedStkcod] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        warehouse,
        status: stockStatus,
        group,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/inventory?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [search, warehouse, stockStatus, group, page, limit]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const summary = data?.summary;
  const products = data?.data ?? [];
  const warehouses = data?.warehouses ?? [];
  const groups = data?.groups ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="text-amber-600" size={24} />
              <span>ข้อมูลคลังสินค้า & สต็อก (Inventory & Warehouses)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบบตรวจสอบยอดสินค้าคงเหลือ จัดสรรตามคลัง และบัตรสินค้า จาก STMAS.DBF และ STLOC.DBF
            </p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl shadow-xs transition self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {/* Top Executive KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total SKUs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                รายการสินค้าทั้งหมด
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package size={17} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                {(summary?.totalSkus ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">SKUs</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>ใช้งานปกติ:</span>
              <strong className="text-slate-800 font-semibold font-mono">
                {(summary?.totalSkus ?? 0).toLocaleString()} รายการ
              </strong>
            </div>
          </div>

          {/* Card 2: In-Stock SKUs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                สินค้าพร้อมขาย (มีสต็อก)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={17} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700">
                {(summary?.inStockCount ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">SKUs</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>ไม่มีสต็อก:</span>
              <strong className="text-slate-700 font-medium font-mono">
                {(summary?.zeroCount ?? 0).toLocaleString()} รายการ
              </strong>
            </div>
          </div>

          {/* Card 3: Total Inventory Valuation */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                มูลค่าสินค้าคงคลังรวม
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp size={17} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-900">
                ฿{fmtMoney(summary?.totalBalanceValue ?? 0)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>จำนวนรวม:</span>
              <strong className="text-slate-800 font-semibold font-mono">
                {fmtQty(summary?.totalBalanceQty ?? 0)} ชิ้น/ตัว
              </strong>
            </div>
          </div>

          {/* Card 4: Negative Stock Alert */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                สินค้าสต็อกติดลบ (เตือน)
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={17} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600">
                {(summary?.negativeCount ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-rose-600 font-medium">SKUs</span>
            </div>
            <div className="mt-2 text-[11px] text-rose-700/80 font-medium">
              {(summary?.negativeCount ?? 0) > 0
                ? "มีรายการที่ยอดตัดจ่ายเกินยอดรับเข้า"
                : "ไม่มีรายการสต็อกติดลบ"}
            </div>
          </div>
        </div>

        {/* Warehouse Breakdown Pill Bar */}
        {summary?.warehouseBreakdown && summary.warehouseBreakdown.length > 0 && (
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Warehouse size={15} className="text-blue-600" />
                <span>คลังสินค้าในระบบ Express ({summary.warehouseBreakdown.length} คลัง)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                คลิกเพื่อกรองสินค้าเฉพาะคลัง
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {summary.warehouseBreakdown.map((wh) => {
                const isSelected = warehouse === wh.code;
                return (
                  <button
                    key={wh.code}
                    type="button"
                    onClick={() => {
                      setWarehouse(isSelected ? "all" : wh.code);
                      setPage(1);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          [{wh.code}]
                        </span>
                        <span className="font-semibold text-xs text-slate-800">
                          {wh.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {wh.itemCount.toLocaleString()} รายการมีสต็อก
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono font-bold text-xs ${
                          wh.totalQty < 0
                            ? "text-rose-600"
                            : wh.totalQty > 0
                            ? "text-emerald-700"
                            : "text-slate-700"
                        }`}
                      >
                        {fmtQty(wh.totalQty)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ฿{fmtMoney(wh.totalVal)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-xl">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="ค้นหารหัสสินค้า, ชื่อ/รายละเอียด, บาร์โค้ด..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Group Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                กลุ่มสินค้า:
              </span>
              <select
                value={group}
                onChange={(e) => {
                  setGroup(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">ทุกกลุ่มสินค้า ({groups.length})</option>
                {groups.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.code} : {g.name} ({g.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Tabs Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
              {[
                { id: "all", label: "ทั้งหมด", count: summary?.totalSkus },
                { id: "inStock", label: "มีสต็อกพร้อมขาย", count: summary?.inStockCount },
                { id: "negative", label: "สต็อกติดลบ", count: summary?.negativeCount },
                { id: "zero", label: "สต็อกเป็น 0", count: summary?.zeroCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStockStatus(tab.id);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    stockStatus === tab.id
                      ? "bg-white text-blue-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        stockStatus === tab.id
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {tab.count.toLocaleString()}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Warehouse Filter Indicator */}
            {warehouse !== "all" && (
              <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                <Warehouse size={13} />
                <span>กรองคลัง: {warehouse}</span>
                <button
                  type="button"
                  onClick={() => {
                    setWarehouse("all");
                    setPage(1);
                  }}
                  className="hover:text-blue-900 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-left">
                  <th className="py-3.5 px-4 w-36">รหัสสินค้า / บาร์โค้ด</th>
                  <th className="py-3.5 px-4">ชื่อและรายละเอียดสินค้า</th>
                  <th className="py-3.5 px-4 w-28">กลุ่มสินค้า</th>
                  <th className="py-3.5 px-4 w-20 text-center">หน่วย</th>
                  <th className="py-3.5 px-4 text-right w-28">คงเหลือรวม</th>
                  <th className="py-3.5 px-4 text-right w-28">ราคาขาย (฿)</th>
                  <th className="py-3.5 px-4 text-right w-28">ต้นทุน (฿)</th>
                  <th className="py-3.5 px-4 text-right w-32">มูลค่ารวม (฿)</th>
                  <th className="py-3.5 px-4 text-center w-24">การกระจายคลัง</th>
                  <th className="py-3.5 px-4 text-center w-24">บัตรสินค้า</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                      กำลังโหลดข้อมูลคลังสินค้า...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      ไม่พบข้อมูลสินค้าตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  products.map((item) => {
                    return (
                      <tr
                        key={item.STKCOD}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        {/* Code & Barcode */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-blue-700">
                          <button
                            type="button"
                            onClick={() => setSelectedStkcod(item.STKCOD)}
                            className="hover:underline text-left cursor-pointer transition text-blue-700 hover:text-blue-800 block font-mono"
                            title="คลิกเพื่อดูรายละเอียดและบัตรสินค้า"
                          >
                            {item.STKCOD}
                          </button>
                          {item.BARCOD && (
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Barcode size={10} className="shrink-0" />
                              <span>{item.BARCOD}</span>
                            </div>
                          )}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 max-w-sm truncate">
                            {item.STKDES || "-"}
                          </div>
                          {item.STKDES2 && (
                            <div className="text-[10px] text-slate-400 truncate max-w-sm">
                              {item.STKDES2}
                            </div>
                          )}
                        </td>

                        {/* Group */}
                        <td className="py-3 px-4 text-slate-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60 truncate max-w-[110px]">
                            {item.groupName}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="py-3 px-4 text-center text-slate-700 font-medium">
                          {item.unitName}
                        </td>

                        {/* Total Balance */}
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs ${
                              item.TOTBAL < 0
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : item.TOTBAL > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "text-slate-500"
                            }`}
                          >
                            {fmtQty(item.TOTBAL)}
                          </span>
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                          ฿{fmtMoney(item.SELLPR1)}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          ฿{fmtMoney(item.UNITPR)}
                        </td>

                        {/* Total Value */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                          ฿{fmtMoney(item.TOTVAL)}
                        </td>

                        {/* Warehouse Breakdown preview */}
                        <td className="py-3 px-4 text-center">
                          {item.locations.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-1">
                              {item.locations
                                .filter((l) => l.LOCBAL !== 0)
                                .map((l) => (
                                  <span
                                    key={l.LOCCOD}
                                    className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-slate-100 text-slate-700 border border-slate-200/80"
                                    title={`${l.warehouseName}: ${fmtQty(l.LOCBAL)}`}
                                  >
                                    {l.LOCCOD}:{fmtQty(l.LOCBAL)}
                                  </span>
                                ))}
                              {item.locations.every((l) => l.LOCBAL === 0) && (
                                <span className="text-[10px] text-slate-400">-</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>

                        {/* Action: View Modal */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedStkcod(item.STKCOD)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200/80 hover:border-blue-200 transition text-[11px] font-medium cursor-pointer"
                            title="ดูบัตรสินค้าและยอดแยกคลัง"
                          >
                            <Eye size={13} className="text-blue-600" />
                            <span>ดูการ์ด</span>
                          </button>
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

        {/* Product Detail & Stock Card Popup Modal */}
        <ProductDetailModal
          stkcod={selectedStkcod}
          onClose={() => setSelectedStkcod(null)}
        />
      </div>
    </AppShell>
  );
}

