"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Printer, RefreshCw, Download, Tag } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
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

export default function QuotationDetailPage({
  params,
}: {
  params: Promise<{ sonum: string }>;
}) {
  const { sonum } = use(params);
  const [data, setData] = useState<QuotationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showItemCode, setShowItemCode] = useState(true);
  const [popupDocnum, setPopupDocnum] = useState<string | null>(null);

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

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/quotations/${encodeURIComponent(sonum)}`);
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
  }, [sonum]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="animate-spin inline-block mr-2" size={20} />
          กำลังโหลดรายละเอียดใบเสนอราคา...
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="p-8 max-w-4xl mx-auto">
          <Link
            href="/quotations"
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

  const { quotation } = data;

  const statusCfg = STATUS_CONFIG[quotation.DOCSTAT] || {
    label: quotation.DOCSTAT,
    badgeClass: "bg-slate-100 text-slate-700",
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href="/quotations"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} /> กลับหน้ารายการ
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Toggle show item code */}
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition select-none">
              <input
                type="checkbox"
                checked={showItemCode}
                onChange={(e) => setShowItemCode(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <Tag size={13} className="text-blue-600" />
                <span>แสดงรหัสสินค้าคู่กับคำอธิบาย</span>
              </span>
            </label>

            <span
              className={`inline-block px-3 py-1 font-bold text-xs rounded-lg border ${statusCfg.badgeClass}`}
            >
              {statusCfg.label}
            </span>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-60 w-full sm:w-auto"
            >
              {isPrinting ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Printer size={15} />
              )}
              <span>{isPrinting ? "กำลังเตรียมพิมพ์..." : "พิมพ์ใบเสนอราคา"}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-60 w-full sm:w-auto"
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

        {/* Paper Container rendered via QuotationSheet */}
        <QuotationSheet
          data={data}
          showItemCode={showItemCode}
          onViewInvoice={(docnum) => setPopupDocnum(docnum)}
        />
      </div>

      {/* Invoice Detail Popup Modal */}
      <InvoiceDetailModal
        docnum={popupDocnum}
        onClose={() => setPopupDocnum(null)}
      />
    </AppShell>
  );
}
