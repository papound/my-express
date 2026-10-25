"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer, RefreshCw, Layers, ArrowLeft, Download, PenTool } from "lucide-react";
import { printPdf, downloadPdf } from "@/lib/pdf/client";
import { SignaturePadModal } from "@/components/signatures/SignaturePadModal";
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
import { BillingDetailModal } from "@/components/billing/BillingDetailModal";

export function InvoiceDetailModal({
  docnum,
  onClose,
}: {
  docnum: string | null;
  onClose: () => void;
}) {
  const [docStack, setDocStack] = useState<string[]>([]);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | number>(1);
  const [popupBilnum, setPopupBilnum] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset drill-down stack when the root docnum changes
  useEffect(() => {
    setDocStack([]);
  }, [docnum]);

  const currentDocnum =
    docStack.length > 0 ? docStack[docStack.length - 1] : docnum;
  const previousDocnum =
    docStack.length > 1
      ? docStack[docStack.length - 2]
      : docStack.length === 1
      ? docnum
      : null;

  useEffect(() => {
    if (!currentDocnum) {
      setData(null);
      setError("");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/invoices/${encodeURIComponent(currentDocnum)}`);
        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || "ไม่สามารถโหลดข้อมูลเอกสารได้");
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDocnum]);

  // Reset active tab to 1 whenever document changes
  useEffect(() => {
    setActiveTab(1);
  }, [currentDocnum]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (docStack.length > 0) {
          setDocStack((prev) => prev.slice(0, -1));
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, docStack.length]);

  if (!docnum || !currentDocnum || !mounted) return null;

  const isSalesReturn =
    data?.invoice?.RECTYP === "5" || currentDocnum.toUpperCase().startsWith("SR");
  const isAdvanceInvoice =
    data?.invoice?.RECTYP === "0" || currentDocnum.toUpperCase().startsWith("AI");
  const isCashSale =
    data?.invoice?.RECTYP === "1" || currentDocnum.toUpperCase().startsWith("HS");
  const isReceipt =
    data?.invoice?.RECTYP === "9" || currentDocnum.toUpperCase().startsWith("RE");

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-start justify-center p-2.5 sm:p-4 md:p-6 pointer-events-none">
        {/* Modal Dialog Content */}
        <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col pointer-events-auto">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {docStack.length > 0 && (
              <button
                type="button"
                onClick={() => setDocStack((prev) => prev.slice(0, -1))}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition shadow-sm mr-1 shrink-0"
                title={`ย้อนกลับไปที่ ${previousDocnum}`}
              >
                <ArrowLeft size={13} />
                <span>กลับ</span>
              </button>
            )}
            <span className="font-bold text-slate-800 text-xs sm:text-sm shrink-0">
              {isSalesReturn
                ? "ใบลดหนี้ / รับคืนสินค้า:"
                : isAdvanceInvoice
                ? "ใบรับเงินมัดจำ:"
                : isCashSale
                ? "ขายสด:"
                : isReceipt
                ? "รับชำระหนี้:"
                : "ใบกำกับภาษี / ขายเชื่อ:"}
            </span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60 text-xs truncate">
              {currentDocnum}
            </span>
            {docStack.length > 0 && previousDocnum && (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline truncate">
                (จาก {previousDocnum})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() =>
                printPdf(
                  `/api/pdf/invoice/${encodeURIComponent(currentDocnum)}`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition shadow-sm"
              title="สั่งพิมพ์เอกสาร"
            >
              <Printer size={14} className="text-blue-600" />
              <span>พิมพ์</span>
            </button>

            <button
              type="button"
              onClick={() =>
                downloadPdf(
                  `/api/pdf/invoice/${encodeURIComponent(currentDocnum)}`,
                  `${currentDocnum}.pdf`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition shadow-sm"
              title="ดาวน์โหลด PDF"
            >
              <Download size={14} className="text-emerald-600" />
              <span>ดาวน์โหลด</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 transition shadow-sm"
              title="จัดการและวาดลายเซ็นสำหรับเอกสาร"
            >
              <PenTool size={14} className="text-indigo-600" />
              <span>ลายเซ็น</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Copy Switcher Tabs */}
        {data && !isSalesReturn && !isAdvanceInvoice && !isCashSale && !isReceipt && (
          <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers size={13} />
              <span>ดูทั้งหมด (4 ชุด)</span>
            </button>

            {INVOICE_PAGES_CONFIG.map((cfg) => {
              const isActive = activeTab === cfg.page;
              return (
                <button
                  key={cfg.page}
                  type="button"
                  onClick={() => setActiveTab(cfg.page)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer border ${
                    isActive
                      ? cfg.badgeActiveBg
                      : "border-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: cfg.headerBg }}
                  />
                  <span>ชุดที่ {cfg.page}</span>
                </button>
              );
            })}
          </div>
        )}

        {data && isAdvanceInvoice && (
          <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers size={13} />
              <span>ดูทั้งหมด (ครบ 3 ชุด)</span>
            </button>

            {ADVANCE_INVOICE_PAGES_CONFIG.map((cfg) => {
              const isActive = activeTab === cfg.page;
              return (
                <button
                  key={cfg.page}
                  type="button"
                  onClick={() => setActiveTab(cfg.page)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer border ${
                    isActive
                      ? cfg.badgeActiveBg
                      : "border-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: cfg.headerBg }}
                  />
                  <span>{cfg.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {data && isCashSale && (
          <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers size={13} />
              <span>ดูทั้งหมด (ครบ 6 ชุด)</span>
            </button>

            {CASH_SALE_PAGES_CONFIG.map((cfg) => {
              const isActive = activeTab === cfg.page;
              return (
                <button
                  key={cfg.page}
                  type="button"
                  onClick={() => setActiveTab(cfg.page)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer border ${
                    isActive
                      ? cfg.badgeActiveBg
                      : "border-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: cfg.headerBg }}
                  />
                  <span>{cfg.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {data && isReceipt && (
          <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers size={13} />
              <span>ดูทั้งหมด (ครบ 3 ชุด)</span>
            </button>

            {RECEIPT_PAGES_CONFIG.map((cfg) => {
              const isActive = activeTab === cfg.page;
              return (
                <button
                  key={cfg.page}
                  type="button"
                  onClick={() => setActiveTab(cfg.page)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer border ${
                    isActive
                      ? cfg.badgeActiveBg
                      : "border-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: cfg.headerBg }}
                  />
                  <span>{cfg.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto relative space-y-4 flex-1 min-h-0">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="animate-spin inline-block mr-2" size={24} />
              <p className="text-sm mt-2 font-medium">กำลังโหลดรายละเอียด...</p>
            </div>
          ) : error || !data ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm text-center">
              {error || "ไม่พบข้อมูลเอกสาร"}
            </div>
          ) : isSalesReturn ? (
            <SalesReturnSheet data={data as SalesReturnData} />
          ) : isReceipt ? (
            activeTab === "all" ? (
              <div className="space-y-6">
                {RECEIPT_PAGES_CONFIG.map((cfg) => (
                  <div key={cfg.page} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 px-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: cfg.headerBg }}
                      />
                      <span>
                        {cfg.name} : {cfg.title} - {cfg.subtitle}
                      </span>
                    </div>
                    <ReceiptSheet
                      data={data as ReceiptData}
                      config={cfg}
                      onViewInvoice={(ivDocnum) =>
                        setDocStack((prev) => [...prev, ivDocnum])
                      }
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
                    onViewInvoice={(ivDocnum) =>
                      setDocStack((prev) => [...prev, ivDocnum])
                    }
                  />
                ))}
              </div>
            )
          ) : isCashSale ? (
            activeTab === "all" ? (
              <div className="space-y-6">
                {CASH_SALE_PAGES_CONFIG.map((cfg) => (
                  <div key={cfg.page} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 px-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: cfg.headerBg }}
                      />
                      <span>
                        {cfg.name} : {cfg.title} - {cfg.subtitle}
                      </span>
                    </div>
                    <CashSaleSheet
                      data={data as CashSaleData}
                      config={cfg}
                      onViewDeposit={(aiDocnum) =>
                        setDocStack((prev) => [...prev, aiDocnum])
                      }
                      onViewBilling={(bilnum) => setPopupBilnum(bilnum)}
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
                    onViewDeposit={(aiDocnum) =>
                      setDocStack((prev) => [...prev, aiDocnum])
                    }
                    onViewBilling={(bilnum) => setPopupBilnum(bilnum)}
                  />
                ))}
              </div>
            )
          ) : isAdvanceInvoice ? (
            activeTab === "all" ? (
              <div className="space-y-6">
                {ADVANCE_INVOICE_PAGES_CONFIG.map((cfg) => (
                  <div key={cfg.page} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 px-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: cfg.headerBg }}
                      />
                      <span>
                        {cfg.name} : {cfg.title} - {cfg.subtitle}
                      </span>
                    </div>
                    <AdvanceInvoiceSheet
                      data={data as AdvanceInvoiceData}
                      config={cfg}
                      onViewInvoice={(ivDocnum) =>
                        setDocStack((prev) => [...prev, ivDocnum])
                      }
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
                    onViewInvoice={(ivDocnum) =>
                      setDocStack((prev) => [...prev, ivDocnum])
                    }
                  />
                ))}
              </div>
            )
          ) : activeTab === "all" ? (
            <div className="space-y-6">
              {INVOICE_PAGES_CONFIG.map((cfg) => (
                <div key={cfg.page} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 px-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: cfg.headerBg }}
                    />
                    <span>
                      {cfg.name} : {cfg.title} - {cfg.subtitle}
                    </span>
                  </div>
                  <InvoiceSheet
                    data={data as InvoiceData}
                    config={cfg}
                    onViewDeposit={(aiDocnum) =>
                      setDocStack((prev) => [...prev, aiDocnum])
                    }
                    onViewBilling={(bilnum) => setPopupBilnum(bilnum)}
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
                  onViewDeposit={(aiDocnum) =>
                    setDocStack((prev) => [...prev, aiDocnum])
                  }
                  onViewBilling={(bilnum) => setPopupBilnum(bilnum)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nested Billing Detail Modal (if user clicks billing note inside invoice) */}
      {popupBilnum && (
        <BillingDetailModal
          bilnum={popupBilnum}
          onClose={() => setPopupBilnum(null)}
          onViewInvoice={(ivDocnum) => {
            setPopupBilnum(null);
            setDocStack((prev) => [...prev, ivDocnum]);
          }}
        />
      )}

      {showSignatureModal && (
        <SignaturePadModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          initialRole={
            isReceipt ? "collector" : "authorized"
          }
        />
      )}
      </div>
    </div>,
    document.body
  );
}
