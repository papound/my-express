"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Printer, RefreshCw, Layers, Download } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { printPdf, downloadPdf } from "@/lib/pdf/client";
import {
  InvoiceSheet,
  INVOICE_PAGES_CONFIG,
  type InvoiceData,
} from "@/components/invoices/InvoiceSheet";
import {
  SalesReturnSheet,
  type SalesReturnData,
} from "@/components/sales-returns/SalesReturnSheet";
import {
  AdvanceInvoiceSheet,
  ADVANCE_INVOICE_PAGES_CONFIG,
  type AdvanceInvoiceData,
} from "@/components/advance-invoices/AdvanceInvoiceSheet";
import {
  CashSaleSheet,
  CASH_SALE_PAGES_CONFIG,
  type CashSaleData,
} from "@/components/cash-sales/CashSaleSheet";
import {
  ReceiptSheet,
  RECEIPT_PAGES_CONFIG,
  type ReceiptData,
} from "@/components/receipts/ReceiptSheet";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ docnum: string }>;
}) {
  const { docnum } = use(params);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | number>("all");
  const [popupDocnum, setPopupDocnum] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = async () => {
    if (!data?.invoice?.DOCNUM) return;
    setIsPrinting(true);
    try {
      await printPdf(
        `/api/pdf/invoice/${encodeURIComponent(data.invoice.DOCNUM)}`,
        `กำลังเตรียมพิมพ์เอกสาร (${data.invoice.DOCNUM})...`
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (!data?.invoice?.DOCNUM) return;
    setIsDownloading(true);
    try {
      await downloadPdf(
        `/api/pdf/invoice/${encodeURIComponent(data.invoice.DOCNUM)}`,
        `${data.invoice.DOCNUM}.pdf`,
        `กำลังดาวน์โหลดไฟล์ (${data.invoice.DOCNUM}.pdf)...`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(docnum)}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [docnum]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="animate-spin inline-block mr-2" size={20} />
          กำลังโหลดรายละเอียดเอกสาร...
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="p-8 max-w-4xl mx-auto">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft size={16} /> กลับหน้ารายการ
          </Link>
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error || "ไม่พบเอกสาร"}
          </div>
        </div>
      </AppShell>
    );
  }

  const isSalesReturn =
    data.invoice.RECTYP === "5" || docnum.toUpperCase().startsWith("SR");
  const isAdvanceInvoice =
    data.invoice.RECTYP === "0" || docnum.toUpperCase().startsWith("AI");
  const isCashSale =
    data.invoice.RECTYP === "1" || docnum.toUpperCase().startsWith("HS");
  const isReceipt =
    data.invoice.RECTYP === "9" || docnum.toUpperCase().startsWith("RE");

  return (
    <AppShell>
      <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href="/invoices"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} /> กลับหน้ารายการ
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-60 w-full sm:w-auto"
            >
              {isPrinting ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Printer size={15} />
              )}
              <span>
                {isPrinting
                  ? "กำลังเตรียมพิมพ์..."
                  : isSalesReturn
                  ? "พิมพ์เอกสาร (ใบลดหนี้)"
                  : isAdvanceInvoice
                  ? "พิมพ์เอกสาร (ใบรับมัดจำ 3 ชุด)"
                  : isCashSale
                  ? "พิมพ์เอกสาร (ขายสด 6 ชุด)"
                  : isReceipt
                  ? "พิมพ์เอกสาร (ใบเสร็จ 3 ชุด)"
                  : "พิมพ์เอกสาร (ครบ 4 สี)"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-60 w-full sm:w-auto"
            >
              {isDownloading ? (
                <RefreshCw size={15} className="animate-spin text-blue-600" />
              ) : (
                <Download size={15} className="text-slate-600" />
              )}
              <span>{isDownloading ? "กำลังดาวน์โหลด..." : "ดาวน์โหลด PDF"}</span>
            </button>
          </div>
        </div>

        {isSalesReturn ? (
          /* Sales Return (ใบลดหนี้/รับคืนสินค้า) View */
          <SalesReturnSheet data={data as SalesReturnData} />
        ) : isReceipt ? (
          /* Receipt (ใบเสร็จรับเงิน รับชำระหนี้ - 3 Copies: ฟ้า, เหลือง, ชมพู) */
          <>
            {/* Copy Selector Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers size={14} />
                ดูทั้งหมด (ครบ 3 ชุด)
              </button>

              {RECEIPT_PAGES_CONFIG.map((cfg) => {
                const isActive = activeTab === cfg.page;
                return (
                  <button
                    key={cfg.page}
                    type="button"
                    onClick={() => setActiveTab(cfg.page)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                      isActive
                        ? cfg.badgeActiveBg
                        : "border-transparent text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: cfg.headerBg }}
                    />
                    <span>{cfg.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Voucher Views */}
            {activeTab === "all" ? (
              <div className="space-y-8">
                {RECEIPT_PAGES_CONFIG.map((cfg) => (
                  <div key={cfg.page} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: cfg.headerBg }}
                      />
                      <span className="text-xs font-bold text-slate-700">
                        {cfg.name} : {cfg.title} - {cfg.subtitle}
                      </span>
                    </div>
                    <ReceiptSheet
                      data={data as ReceiptData}
                      config={cfg}
                      onViewInvoice={(ivDocnum) => setPopupDocnum(ivDocnum)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {RECEIPT_PAGES_CONFIG.filter(
                  (c) => c.page === activeTab
                ).map((cfg) => (
                  <ReceiptSheet
                    key={cfg.page}
                    data={data as ReceiptData}
                    config={cfg}
                    onViewInvoice={(ivDocnum) => setPopupDocnum(ivDocnum)}
                  />
                ))}
              </div>
            )}
          </>
        ) : isCashSale ? (
          /* Cash Sale (ขายสด - 6 Copies) */
          <>
            {/* Copy Selector Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers size={14} />
                ดูทั้งหมด (ครบ 6 ชุด)
              </button>

              {CASH_SALE_PAGES_CONFIG.map((cfg) => {
                const isActive = activeTab === cfg.page;
                return (
                  <button
                    key={cfg.page}
                    type="button"
                    onClick={() => setActiveTab(cfg.page)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                      isActive
                        ? cfg.badgeActiveBg
                        : "border-transparent text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: cfg.headerBg }}
                    />
                    <span>{cfg.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Voucher Views */}
            {activeTab === "all" ? (
              <div className="space-y-8">
                {CASH_SALE_PAGES_CONFIG.map((cfg) => (
                  <div key={cfg.page} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: cfg.headerBg }}
                      />
                      <span className="text-xs font-bold text-slate-700">
                        {cfg.name} : {cfg.title} - {cfg.subtitle}
                      </span>
                    </div>
                    <CashSaleSheet
                      data={data as CashSaleData}
                      config={cfg}
                      onViewDeposit={(doc) => setPopupDocnum(doc)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {CASH_SALE_PAGES_CONFIG.filter(
                  (c) => c.page === activeTab
                ).map((cfg) => (
                  <CashSaleSheet
                    key={cfg.page}
                    data={data as CashSaleData}
                    config={cfg}
                    onViewDeposit={(doc) => setPopupDocnum(doc)}
                  />
                ))}
              </div>
            )}
          </>
        ) : isAdvanceInvoice ? (
          /* Advance Invoice (ใบรับเงินมัดจำ - 3 Copies: ฟ้า, ส้ม, เหลือง) */
          <>
            {/* Copy Selector Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers size={14} />
                ดูทั้งหมด (ครบ 3 ชุด)
              </button>

              {ADVANCE_INVOICE_PAGES_CONFIG.map((cfg) => {
                const isActive = activeTab === cfg.page;
                return (
                  <button
                    key={cfg.page}
                    type="button"
                    onClick={() => setActiveTab(cfg.page)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                      isActive
                        ? cfg.badgeActiveBg
                        : "border-transparent text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: cfg.headerBg }}
                    />
                    <span>{cfg.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Voucher Views */}
            {activeTab === "all" ? (
              <div className="space-y-8">
                {ADVANCE_INVOICE_PAGES_CONFIG.map((cfg) => (
                  <div key={cfg.page} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: cfg.headerBg }}
                      />
                      <span className="text-xs font-bold text-slate-700">
                        {cfg.name} : {cfg.title} - {cfg.subtitle}
                      </span>
                    </div>
                    <AdvanceInvoiceSheet
                      data={data as AdvanceInvoiceData}
                      config={cfg}
                      onViewInvoice={(doc) => setPopupDocnum(doc)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {ADVANCE_INVOICE_PAGES_CONFIG.filter(
                  (c) => c.page === activeTab
                ).map((cfg) => (
                  <AdvanceInvoiceSheet
                    key={cfg.page}
                    data={data as AdvanceInvoiceData}
                    config={cfg}
                    onViewInvoice={(doc) => setPopupDocnum(doc)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Regular Invoice (4 Continuous Form Copies) */
          <>
            {/* Copy Selector Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers size={14} />
                ดูทั้งหมด (ครบ 4 ชุด)
              </button>

              {INVOICE_PAGES_CONFIG.map((cfg) => {
                const isActive = activeTab === cfg.page;
                return (
                  <button
                    key={cfg.page}
                    type="button"
                    onClick={() => setActiveTab(cfg.page)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                      isActive
                        ? cfg.badgeActiveBg
                        : "border-transparent text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: cfg.headerBg }}
                    />
                    <span>{cfg.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Voucher Views */}
            {activeTab === "all" ? (
              <div className="space-y-8">
                {INVOICE_PAGES_CONFIG.map((cfg) => (
                  <div key={cfg.page} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: cfg.headerBg }}
                      />
                      <span className="text-xs font-bold text-slate-700">
                        {cfg.name} : {cfg.title} - {cfg.subtitle}
                      </span>
                    </div>
                    <InvoiceSheet
                      data={data as InvoiceData}
                      config={cfg}
                      onViewDeposit={(doc) => setPopupDocnum(doc)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {INVOICE_PAGES_CONFIG.filter((c) => c.page === activeTab).map((cfg) => (
                  <InvoiceSheet
                    key={cfg.page}
                    data={data as InvoiceData}
                    config={cfg}
                    onViewDeposit={(doc) => setPopupDocnum(doc)}
                  />
                ))}
              </div>
            )}
          </>
        )}
        {/* Popup Modal for IV Invoice Details */}
        <InvoiceDetailModal
          docnum={popupDocnum}
          onClose={() => setPopupDocnum(null)}
        />
      </div>
    </AppShell>
  );
}
