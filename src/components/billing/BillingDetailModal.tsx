"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer, RefreshCw, Layers, ArrowLeft, Download, PenTool } from "lucide-react";
import { printPdf, downloadPdf } from "@/lib/pdf/client";
import { SignaturePadModal } from "@/components/signatures/SignaturePadModal";
import {
  BillingSheet,
  BILLING_PAGES_CONFIG,
  type BillingData,
} from "@/components/billing/BillingSheet";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";

export function BillingDetailModal({
  bilnum,
  onClose,
  onViewInvoice,
}: {
  bilnum: string | null;
  onClose: () => void;
  onViewInvoice?: (docnum: string) => void;
}) {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | number>(1);
  const [popupDocnum, setPopupDocnum] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!bilnum) {
      setData(null);
      setError("");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/billing/${encodeURIComponent(bilnum)}`);
        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || "ไม่สามารถโหลดข้อมูลใบวางบิลได้");
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
  }, [bilnum]);

  // Reset active tab to 1 whenever bilnum changes
  useEffect(() => {
    setActiveTab(1);
    setPopupDocnum(null);
  }, [bilnum]);

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

  if (!bilnum || !mounted) return null;

  const handleInvoiceClick = (ivDocnum: string) => {
    if (onViewInvoice) {
      onViewInvoice(ivDocnum);
    } else {
      setPopupDocnum(ivDocnum);
    }
  };

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
            <span className="font-bold text-slate-800 text-xs sm:text-sm shrink-0">
              ใบวางบิล:
            </span>
            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/60 text-xs truncate">
              {bilnum}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                const pageParam = activeTab !== "all" ? `?page=${activeTab}` : "";
                printPdf(
                  `/api/pdf/billing/${encodeURIComponent(bilnum)}${pageParam}`,
                  `กำลังเตรียมพิมพ์ใบวางบิล (${bilnum})...`
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition shadow-sm cursor-pointer"
              title="สั่งพิมพ์ใบวางบิล"
            >
              <Printer size={14} className="text-blue-600" />
              <span>พิมพ์</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const pageParam = activeTab !== "all" ? `?page=${activeTab}` : "";
                downloadPdf(
                  `/api/pdf/billing/${encodeURIComponent(bilnum)}${pageParam}`,
                  `${bilnum}.pdf`,
                  `กำลังดาวน์โหลดใบวางบิล (${bilnum}.pdf)...`
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition shadow-sm cursor-pointer"
              title="ดาวน์โหลด PDF"
            >
              <Download size={14} className="text-emerald-600" />
              <span>ดาวน์โหลด</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 transition shadow-sm cursor-pointer"
              title="จัดการและวาดลายเซ็นผู้วางบิล"
            >
              <PenTool size={14} className="text-indigo-600" />
              <span>ลายเซ็น</span>
            </button>

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

        {/* Tab Controls for Copies */}
        <div className="bg-slate-100/70 px-4 sm:px-6 py-2.5 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <Layers size={13} />
            <span>ดูทั้งหมด (ครบ 2 ชุด)</span>
          </button>

          {BILLING_PAGES_CONFIG.map((cfg) => {
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
                  style={{ backgroundColor: "#a6caf0" }}
                />
                <span>{cfg.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto relative space-y-4 flex-1 min-h-0">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="animate-spin inline-block mr-2" size={24} />
              <p className="text-sm mt-2 font-medium">กำลังโหลดรายละเอียดใบวางบิล...</p>
            </div>
          ) : error || !data ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm text-center">
              {error || "ไม่พบข้อมูลใบวางบิล"}
            </div>
          ) : activeTab === "all" ? (
            <div className="space-y-6">
              {BILLING_PAGES_CONFIG.map((cfg) => (
                <div key={cfg.page} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 px-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: "#a6caf0" }}
                    />
                    <span>
                      {cfg.name} : {cfg.title} - {cfg.subtitle}
                    </span>
                  </div>
                  <BillingSheet
                    data={data}
                    config={cfg}
                    onViewInvoice={handleInvoiceClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              {BILLING_PAGES_CONFIG.filter((c) => c.page === activeTab).map((cfg) => (
                <BillingSheet
                  key={cfg.page}
                  data={data}
                  config={cfg}
                  onViewInvoice={handleInvoiceClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nested Invoice Detail Modal (if user clicks an invoice inside the billing note) */}
      {popupDocnum && (
        <InvoiceDetailModal
          docnum={popupDocnum}
          onClose={() => setPopupDocnum(null)}
        />
      )}

      {showSignatureModal && (
        <SignaturePadModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          initialRole="billing"
        />
      )}
      </div>
    </div>,
    document.body
  );
}

