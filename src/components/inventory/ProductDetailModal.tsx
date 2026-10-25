"use client";

import { useEffect, useState } from "react";
import {
  X,
  RefreshCw,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Warehouse,
  Barcode,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
  FileText,
  Boxes,
} from "lucide-react";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";

interface LocationItem {
  LOCCOD: string;
  warehouseName: string;
  LOCBAL: number;
  LOCVAL: number;
  AREA?: string;
}

interface StockCardItem {
  DOCNUM: string;
  DOCDAT: string | null;
  LOCCOD: string;
  warehouseName: string;
  POSOPR: string;
  TRNQTY: number;
  UNITPR: number;
  TRNVAL: number;
  PEOPLE: string;
  REFNUM: string;
  STKDES: string;
  TQUCOD: string;
}

interface ProductDetails {
  STKCOD: string;
  STKDES: string;
  STKDES2?: string;
  BARCOD?: string;
  STKTYP?: string;
  STKGRP: string;
  groupName: string;
  QUCOD: string;
  unitName: string;
  TOTBAL: number;
  TOTVAL: number;
  UNITPR: number;
  SELLPR1: number;
  SELLPR2: number;
  SELLPR3: number;
  SELLPR4: number;
  SELLPR5: number;
  STATUS: string;
  REMARK?: string;
  CREDAT?: string | null;
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

function fmtDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const DOC_TYPE_BADGES: Record<string, { label: string; class: string }> = {
  IV: { label: "ขายเชื่อ", class: "bg-blue-50 text-blue-700 border-blue-200" },
  HS: { label: "ขายสด", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SR: { label: "รับคืน", class: "bg-rose-50 text-rose-700 border-rose-200" },
  RR: { label: "ซื้อสินค้า", class: "bg-purple-50 text-purple-700 border-purple-200" },
  HP: { label: "ซื้อสด", class: "bg-teal-50 text-teal-700 border-teal-200" },
  GR: { label: "รับคืนคลัง", class: "bg-amber-50 text-amber-700 border-amber-200" },
  JU: { label: "ปรับปรุงยอด", class: "bg-slate-100 text-slate-700 border-slate-300" },
  OE: { label: "จองสินค้า", class: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

function getDocBadge(docnum: string) {
  const prefix = docnum.slice(0, 2).toUpperCase();
  return (
    DOC_TYPE_BADGES[prefix] || {
      label: "เอกสาร",
      class: "bg-slate-100 text-slate-700 border-slate-200",
    }
  );
}

export function ProductDetailModal({
  stkcod,
  onClose,
}: {
  stkcod: string | null;
  onClose: () => void;
}) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [stockCard, setStockCard] = useState<StockCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "stockCard">("overview");
  const [popupDocnum, setPopupDocnum] = useState<string | null>(null);

  useEffect(() => {
    if (!stkcod) {
      setProduct(null);
      setLocations([]);
      setStockCard([]);
      setError("");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/inventory/${encodeURIComponent(stkcod)}`);
        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || "ไม่สามารถโหลดข้อมูลสินค้าได้");
        }
        const json = await res.json();
        setProduct(json.product);
        setLocations(json.locations || []);
        setStockCard(json.stockCard || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stkcod]);

  // Reset tab on item change
  useEffect(() => {
    setActiveTab("overview");
    setPopupDocnum(null);
  }, [stkcod]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (popupDocnum) {
          setPopupDocnum(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, popupDocnum]);

  if (!stkcod) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-3 sm:my-8 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                  {stkcod}
                </span>
                {product?.BARCOD && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono text-[10.5px]">
                    <Barcode size={11} />
                    <span>{product.BARCOD}</span>
                  </span>
                )}
                {product?.groupName && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10.5px] font-medium">
                    {product.groupName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium truncate max-w-md mt-0.5">
                {product?.STKDES || "กำลังโหลด..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100/70 px-4 sm:px-6 py-2 border-b border-slate-200/80 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <Boxes size={13} />
            <span>ยอดคงเหลือ & สเปคสินค้า</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stockCard")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "stockCard"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <Layers size={13} />
            <span>บัตรสินค้า / ประวัติเคลื่อนไหว ({stockCard.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto relative space-y-5 flex-1 min-h-0 text-xs">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="animate-spin inline-block mr-2" size={24} />
              <p className="text-sm mt-2 font-medium">กำลังโหลดข้อมูลสินค้าและสต็อก...</p>
            </div>
          ) : error || !product ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm text-center">
              {error || "ไม่พบข้อมูลสินค้า"}
            </div>
          ) : activeTab === "overview" ? (
            <div className="space-y-5">
              {/* Top Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <span className="text-amber-800 font-semibold block text-[11px]">
                    จำนวนคงเหลือรวม
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <strong
                      className={`text-xl sm:text-2xl font-mono font-extrabold ${
                        product.TOTBAL < 0
                          ? "text-rose-600"
                          : product.TOTBAL > 0
                          ? "text-emerald-700"
                          : "text-slate-700"
                      }`}
                    >
                      {fmtQty(product.TOTBAL)}
                    </strong>
                    <span className="text-[11px] font-medium text-amber-900">
                      {product.unitName}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                  <span className="text-blue-800 font-semibold block text-[11px]">
                    ราคาขายมาตรฐาน (Price 1)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <strong className="text-xl sm:text-2xl font-mono font-extrabold text-blue-900">
                      ฿{fmtMoney(product.SELLPR1)}
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-semibold block text-[11px]">
                    ต้นทุนต่อหน่วย (Cost)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <strong className="text-xl sm:text-2xl font-mono font-bold text-slate-800">
                      ฿{fmtMoney(product.UNITPR)}
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-emerald-800 font-semibold block text-[11px]">
                    มูลค่าคงคลังรวม (Value)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <strong className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-900">
                      ฿{fmtMoney(product.TOTVAL)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Warehouse Breakdown Section */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Warehouse size={15} className="text-blue-600" />
                    <span>ยอดคงเหลือแยกตามคลังสินค้า (Warehouse Breakdown)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {locations.length} คลัง
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2.5 px-3 w-28">รหัสคลัง</th>
                        <th className="py-2.5 px-3">ชื่อคลังสินค้า</th>
                        <th className="py-2.5 px-3 text-right w-36">จำนวนคงเหลือ</th>
                        <th className="py-2.5 px-3 text-right w-36">มูลค่าสินค้า</th>
                        <th className="py-2.5 px-3 w-24">พื้นที่จัดเก็บ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {locations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            ไม่มีข้อมูลแยกตามคลัง
                          </td>
                        </tr>
                      ) : (
                        locations.map((loc) => (
                          <tr key={loc.LOCCOD} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {loc.LOCCOD}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {loc.warehouseName}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              <span
                                className={
                                  loc.LOCBAL < 0
                                    ? "text-rose-600"
                                    : loc.LOCBAL > 0
                                    ? "text-emerald-700"
                                    : "text-slate-600"
                                }
                              >
                                {fmtQty(loc.LOCBAL)} {product.unitName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              ฿{fmtMoney(loc.LOCVAL)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {loc.AREA || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Tier Matrix Box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Tag size={15} className="text-indigo-600" />
                  <span>โครงสร้างระดับราคาขาย (Selling Price Levels)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                  {[
                    { label: "ราคาขาย 1 (Standard)", val: product.SELLPR1 },
                    { label: "ราคาขาย 2 (VIP)", val: product.SELLPR2 },
                    { label: "ราคาขาย 3 (Wholesale)", val: product.SELLPR3 },
                    { label: "ราคาขาย 4 (Special)", val: product.SELLPR4 },
                    { label: "ราคาขาย 5 (Dealer)", val: product.SELLPR5 },
                  ].map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                    >
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {tier.label}
                      </span>
                      <strong className="text-sm font-mono font-bold text-slate-900 mt-1 block">
                        ฿{fmtMoney(tier.val)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Stock Card Movement */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    ประวัติการเคลื่อนไหวสินค้า (Stock Card Transactions)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    บันทึกรายการซื้อ ขาย รับคืน ปรับปรุง จาก STCRD.DBF (คลิกเลขที่เอกสารเพื่อดูบิล)
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3 w-24">วันที่</th>
                        <th className="py-2.5 px-3 w-28">เลขที่เอกสาร</th>
                        <th className="py-2.5 px-3 w-24">ประเภท</th>
                        <th className="py-2.5 px-3 w-28">คลัง</th>
                        <th className="py-2.5 px-3 text-right w-24">จำนวน</th>
                        <th className="py-2.5 px-3 text-right w-24">ราคา/หน่วย</th>
                        <th className="py-2.5 px-3 text-right w-28">มูลค่ารวม</th>
                        <th className="py-2.5 px-3">คู่ค้า/อ้างอิง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stockCard.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            ยังไม่มีรายการเคลื่อนไหวในประวัติบัตรสินค้า
                          </td>
                        </tr>
                      ) : (
                        stockCard.map((item, idx) => {
                          const badge = getDocBadge(item.DOCNUM);
                          const isInvoiceDoc =
                            item.DOCNUM.startsWith("IV") ||
                            item.DOCNUM.startsWith("HS") ||
                            item.DOCNUM.startsWith("SR") ||
                            item.DOCNUM.startsWith("AI") ||
                            item.DOCNUM.startsWith("RE");

                          return (
                            <tr key={idx} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-3 text-slate-600">
                                {fmtDate(item.DOCDAT)}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold">
                                {isInvoiceDoc ? (
                                  <button
                                    type="button"
                                    onClick={() => setPopupDocnum(item.DOCNUM)}
                                    className="text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                                    title="คลิกเพื่อเปิดดูรายละเอียดเอกสาร"
                                  >
                                    {item.DOCNUM}
                                  </button>
                                ) : (
                                  <span className="text-slate-800">{item.DOCNUM}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.class}`}
                                >
                                  {badge.label}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {item.warehouseName}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                {fmtQty(item.TRNQTY)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                ฿{fmtMoney(item.UNITPR)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                ฿{fmtMoney(item.TRNVAL)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                                {item.PEOPLE || item.REFNUM || "-"}
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
          )}
        </div>
      </div>

      {/* Invoice Detail Modal when clicking on docnum from stock card */}
      {popupDocnum && (
        <InvoiceDetailModal
          docnum={popupDocnum}
          onClose={() => setPopupDocnum(null)}
        />
      )}
    </div>
  );
}

