"use client";

import { useEffect, useState } from "react";
import { X, Printer, RefreshCw, Download, Tag } from "lucide-react";
import { printPdf, downloadPdf } from "@/lib/pdf/client";
import {
  QuotationSheet,
  type QuotationDetailResponse,
} from "@/components/quotations/QuotationSheet";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  N: {
    label: "เปิดเสนอราคา",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  "0": {
    label: "เปิดเสนอราคา",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  F: {
    label: "สำเร็จ (เสร็จสิ้น)",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  C: {
    label: "ยกเลิก",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
};

export function QuotationDetailModal({
  sonum,
  onClose,
}: {
  sonum: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<QuotationDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showItemCode, setShowItemCode] = useState(true);
  const [popupDocnum, setPopupDocnum] = useState<string | null>(null);

  useEffect(() => {
    if (!sonum) {
      setData(null);
      setError("");
      setPopupDocnum(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      setPopupDocnum(null);
      try {
        const res = await fetch(`/api/quotations/${encodeURIComponent(sonum)}`);
        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || "ไม่สามารถโหลดข้อมูลใบเสนอราคาได้");
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sonum]);

  // Handle Escape key to close modal
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

  if (!sonum) return null;

  const handlePrint = async () => {
    if (!data?.quotation?.SONUM) return;
    setIsPrinting(true);
    try {
      await printPdf(
        `/api/pdf/quotation/${encodeURIComponent(data.quotation.SONUM)}?showItemCode=${showItemCode}`,
        `กำลังเตรียมพิมพ์ใบเสนอราคา (${data.quotation.SONUM})...`
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (!data?.quotation?.SONUM) return;
    setIsDownloading(true);
    try {
      await downloadPdf(
        `/api/pdf/quotation/${encodeURIComponent(data.quotation.SONUM)}?showItemCode=${showItemCode}`,
        `${data.quotation.SONUM}.pdf`,
        `กำลังดาวน์โหลดใบเสนอราคา (${data.quotation.SONUM}.pdf)...`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const statusCfg =
    data?.quotation?.DOCSTAT && STATUS_CONFIG[data.quotation.DOCSTAT]
      ? STATUS_CONFIG[data.quotation.DOCSTAT]
      : {
          label: data?.quotation?.DOCSTAT || "ไม่ระบุ",
          badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-3 sm:my-8 max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-bold text-slate-800 text-xs sm:text-sm shrink-0">
              ใบเสนอราคา:
            </span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60 text-xs truncate">
              {sonum}
            </span>
            {data?.quotation && (
              <span
                className={`inline-block px-2.5 py-0.5 font-bold text-[11px] rounded-md border shrink-0 ${statusCfg.badgeClass}`}
              >
                {statusCfg.label}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Show item code toggle */}
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-medium text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition select-none">
              <input
                type="checkbox"
                checked={showItemCode}
                onChange={(e) => setShowItemCode(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-[11px]">
                <Tag size={12} className="text-blue-600" />
                <span className="hidden sm:inline">แสดงรหัสสินค้า</span>
                <span className="sm:hidden">รหัส</span>
              </span>
            </label>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || loading || !data}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="สั่งพิมพ์ใบเสนอราคา"
            >
              {isPrinting ? (
                <RefreshCw size={13} className="animate-spin text-blue-600" />
              ) : (
                <Printer size={13} className="text-blue-600" />
              )}
              <span>พิมพ์</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || loading || !data}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="ดาวน์โหลด PDF"
            >
              {isDownloading ? (
                <RefreshCw size={13} className="animate-spin text-emerald-600" />
              ) : (
                <Download size={13} className="text-emerald-600" />
              )}
              <span>ดาวน์โหลด</span>
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

        {/* Modal Body */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto relative space-y-4 flex-1 min-h-0 bg-slate-50/40">
          {loading ? (
            <div className="py-24 text-center text-slate-400">
              <RefreshCw className="animate-spin inline-block mr-2" size={24} />
              <p className="text-sm mt-2 font-medium">กำลังโหลดรายละเอียดใบเสนอราคา...</p>
            </div>
          ) : error || !data ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm text-center">
              {error || "ไม่พบข้อมูลใบเสนอราคา"}
            </div>
          ) : (
            <QuotationSheet
              data={data}
              showItemCode={showItemCode}
              onViewInvoice={(docnum) => setPopupDocnum(docnum)}
            />
          )}
        </div>
      </div>

      {/* Invoice Detail Popup on top of Quotation */}
      <InvoiceDetailModal
        docnum={popupDocnum}
        onClose={() => setPopupDocnum(null)}
      />
    </div>
  );
}

