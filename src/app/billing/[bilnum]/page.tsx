"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Printer, RefreshCw, Layers, Download, PenTool } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { printPdf, downloadPdf } from "@/lib/pdf/client";
import { SignaturePadModal } from "@/components/signatures/SignaturePadModal";
import {
  BillingSheet,
  BILLING_PAGES_CONFIG,
  type BillingData,
} from "@/components/billing/BillingSheet";

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

export default function BillingDetailPage({
  params,
}: {
  params: Promise<{ bilnum: string }>;
}) {
  const { bilnum } = use(params);
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | number>("all");
  const [popupDocnum, setPopupDocnum] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const handlePrint = async () => {
    if (!data?.billing?.BILNUM) return;
    setIsPrinting(true);
    const pageParam = activeTab !== "all" ? `?page=${activeTab}` : "";
    try {
      await printPdf(
        `/api/pdf/billing/${encodeURIComponent(data.billing.BILNUM)}${pageParam}`,
        `กำลังเตรียมพิมพ์ใบวางบิล (${data.billing.BILNUM})...`
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (!data?.billing?.BILNUM) return;
    setIsDownloading(true);
    const pageParam = activeTab !== "all" ? `?page=${activeTab}` : "";
    try {
      await downloadPdf(
        `/api/pdf/billing/${encodeURIComponent(data.billing.BILNUM)}${pageParam}`,
        `${data.billing.BILNUM}.pdf`,
        `กำลังดาวน์โหลดใบวางบิล (${data.billing.BILNUM}.pdf)...`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/billing/${encodeURIComponent(bilnum)}`);
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
  }, [bilnum]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="animate-spin inline-block mr-2" size={20} />
          กำลังโหลดรายละเอียดใบวางบิล...
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="p-8 max-w-4xl mx-auto">
          <Link
            href="/billing"
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

  const stat = STATUS_CONFIG[data.billing.DOCSTAT || "N"] || {
    label: `สถานะ ${data.billing.DOCSTAT}`,
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <AppShell>
      <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition"
            >
              <ArrowLeft size={16} /> กลับหน้ารายการ
            </Link>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-lg border ${stat.badgeClass}`}
            >
              {stat.label}
            </span>
          </div>

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
              <span>{isPrinting ? "กำลังเตรียมพิมพ์..." : "พิมพ์ใบวางบิล (2 ชุด)"}</span>
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
            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition w-full sm:w-auto cursor-pointer"
              title="จัดการและวาดลายเซ็นผู้วางบิล"
            >
              <PenTool size={15} className="text-indigo-600" />
              <span>จัดการลายเซ็น</span>
            </button>
          </div>
        </div>

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
            ดูทั้งหมด (ครบ 2 ชุด)
          </button>

          {BILLING_PAGES_CONFIG.map((cfg) => {
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
                  className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: "#a6caf0" }}
                />
                <span>{cfg.name}</span>
              </button>
            );
          })}
        </div>

        {/* Voucher Views */}
        {activeTab === "all" ? (
          <div className="space-y-8">
            {BILLING_PAGES_CONFIG.map((cfg) => (
              <div key={cfg.page} className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20"
                    style={{ backgroundColor: "#a6caf0" }}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {cfg.name} : {cfg.title} - {cfg.subtitle}
                  </span>
                </div>
                <BillingSheet
                  data={data}
                  config={cfg}
                  onViewInvoice={(ivDocnum) => setPopupDocnum(ivDocnum)}
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
                onViewInvoice={(ivDocnum) => setPopupDocnum(ivDocnum)}
              />
            ))}
          </div>
        )}

        {/* Popup Modal for Invoice Details */}
        <InvoiceDetailModal
          docnum={popupDocnum}
          onClose={() => setPopupDocnum(null)}
        />

        {showSignatureModal && (
          <SignaturePadModal
            isOpen={showSignatureModal}
            onClose={() => setShowSignatureModal(false)}
            initialRole="billing"
          />
        )}
      </div>
    </AppShell>
  );
}
