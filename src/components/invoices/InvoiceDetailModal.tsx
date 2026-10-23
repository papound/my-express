"use client";

import { useEffect, useState } from "react";
import { X, Printer, RefreshCw, Layers } from "lucide-react";
import {
  InvoiceSheet,
  INVOICE_PAGES_CONFIG,
  type InvoiceData,
} from "@/components/invoices/InvoiceSheet";

export function InvoiceDetailModal({
  docnum,
  onClose,
}: {
  docnum: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | number>(1);

  useEffect(() => {
    if (!docnum) {
      setData(null);
      setError("");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/invoices/${encodeURIComponent(docnum)}`);
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
  }, [docnum]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!docnum) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-3 sm:my-8 max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-slate-800 text-xs sm:text-sm shrink-0">
              รายละเอียด:
            </span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60 text-xs truncate">
              {docnum}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <a
              href={`/api/pdf/invoice/${encodeURIComponent(docnum)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition shadow-sm"
              title="พิมพ์ PDF ครบ 4 สี"
            >
              <Printer size={14} className="text-blue-600" />
              <span>พิมพ์ PDF (4 สี)</span>
            </a>

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
        {data && (
          <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap border ${
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

        {/* Modal Body */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto relative space-y-4">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="animate-spin inline-block mr-2" size={24} />
              <p className="text-sm mt-2 font-medium">กำลังโหลดรายละเอียด...</p>
            </div>
          ) : error || !data ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm text-center">
              {error || "ไม่พบข้อมูลเอกสาร"}
            </div>
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
                  <InvoiceSheet data={data} config={cfg} />
                </div>
              ))}
            </div>
          ) : (
            <div>
              {INVOICE_PAGES_CONFIG.filter((c) => c.page === activeTab).map((cfg) => (
                <InvoiceSheet key={cfg.page} data={data} config={cfg} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
