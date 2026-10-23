"use client";

import { useEffect, useState } from "react";
import { X, Printer, RefreshCw, Eye } from "lucide-react";
import { bahtText } from "@/lib/baht-text";

interface Item {
  STKCOD: string;
  STKDES: string;
  SEQNUM: string;
  TRNQTY: number;
  TQUCOD: string;
  UNITPR: number;
  DISC: string;
  DISCAMT: number;
  TRNVAL: number;
  VATCOD: string;
}

interface InvoiceDetailResponse {
  invoice: {
    RECTYP: string;
    DOCNUM: string;
    DOCDAT: string | null;
    CUSCOD: string;
    SONUM: string;
    DEPCOD: string;
    FLGVAT: string;
    SLMCOD: string;
    YOUREF: string;
    PAYTRM: number;
    DUEDAT: string | null;
    BILNUM: string;
    AMOUNT: number;
    DISCAMT: number;
    AFTDISC: number;
    VATAMT: number;
    NETAMT: number;
    TOTAL: number;
    RCVAMT: number;
    REMAMT: number;
    VATRAT: number;
    DOCSTAT: string;
    BILLTO: string;
    ORGNUM: number;
  };
  customer?: {
    CUSNAM: string;
    PRENAM: string;
    CUSNAM2: string;
    ADDR01: string;
    ADDR02: string;
    ADDR03: string;
    ZIPCOD: string;
    TELNUM: string;
    TAXID: string;
    ORGNUM: number;
  };
  items: Item[];
  remarks: { SEQNUM: string; REMARK: string }[];
  company?: {
    THINAM: string;
    ADDR01: string;
    ADDR02: string;
    TELNUM: string;
    TAXID: string;
    ORGSTR: string;
  };
}

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function InvoiceDetailModal({
  docnum,
  onClose,
}: {
  docnum: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<InvoiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-slate-800 text-xs sm:text-sm shrink-0">
              รายละเอียด:
            </span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60 text-xs truncate">
              {docnum}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/api/pdf/invoice/${encodeURIComponent(docnum)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition shadow-sm"
              title="พิมพ์ PDF"
            >
              <Printer size={14} className="text-emerald-600" />
              <span className="hidden xs:inline">พิมพ์ PDF</span>
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto relative space-y-4 sm:space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="animate-spin inline-block mr-2" size={24} />
              <p className="text-sm mt-2 font-medium">กำลังโหลดรายละเอียด...</p>
            </div>
          ) : error || !data ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm text-center">
              {error || "ไม่พบข้อมูลเอกสาร"}
            </div>
          ) : (
            <>
              {/* Background Watermark */}
              <img
                src="/api/logo/watermark"
                alt="Watermark"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] opacity-[0.08] pointer-events-none select-none z-0"
              />

              {/* Header inside Voucher */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-5 gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <img
                    src="/api/logo"
                    alt="Logo"
                    className="h-12 w-auto max-w-[100px] object-contain shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {data.company?.THINAM || "บริษัท ธงธัญ จำกัด"}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {data.company?.ADDR01} {data.company?.ADDR02}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      โทร: {data.company?.TELNUM || "-"} | เลขประจำตัวผู้เสียภาษี:{" "}
                      <span className="font-mono">{data.company?.TAXID || "-"}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-md border border-blue-200/60 mb-1">
                    {data.invoice.RECTYP === "1"
                      ? "ใบเสร็จรับเงิน / ใบกำกับภาษี (สด)"
                      : "ใบแจ้งหนี้ / ใบกำกับภาษี (เชื่อ)"}
                  </span>
                  <div className="text-xs">
                    <span className="text-slate-500">เลขที่:</span>{" "}
                    <strong className="font-mono text-slate-900">
                      {data.invoice.DOCNUM}
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    วันที่: <span className="text-slate-800">{fmtDate(data.invoice.DOCDAT)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs relative z-10">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    ข้อมูลผู้ซื้อ
                  </div>
                  <div className="text-slate-900 font-semibold">
                    [{data.invoice.CUSCOD}] {data.customer?.PRENAM} {data.customer?.CUSNAM}
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    {data.customer?.ADDR01} {data.customer?.ADDR02} {data.customer?.ZIPCOD}
                  </div>
                  <div className="text-slate-600 text-[11px] pt-0.5 font-mono">
                    เลขผู้เสียภาษี: {data.customer?.TAXID || "-"}
                  </div>
                </div>
                <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ใบสั่งขาย/SO:</span>
                    <span className="font-mono font-medium">{data.invoice.SONUM || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">อ้างอิงลูกค้า:</span>
                    <span>{data.invoice.YOUREF || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">เงื่อนไขชำระ:</span>
                    <span>{data.invoice.PAYTRM > 0 ? `${data.invoice.PAYTRM} วัน` : "เงินสด"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">วันครบกำหนด:</span>
                    <span>{fmtDate(data.invoice.DUEDAT)}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto relative z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-xs border-collapse min-w-[560px]">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-left">
                      <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                      <th className="py-2.5 px-3 w-28">รหัสสินค้า</th>
                      <th className="py-2.5 px-3">รายละเอียด</th>
                      <th className="py-2.5 px-3 text-right w-16">จำนวน</th>
                      <th className="py-2.5 px-3 text-center w-14">หน่วย</th>
                      <th className="py-2.5 px-3 text-right w-20">ราคา/หน่วย</th>
                      <th className="py-2.5 px-3 text-right w-24">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center font-mono text-slate-400">
                          {it.SEQNUM || idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {it.STKCOD}
                        </td>
                        <td className="py-2 px-3 text-slate-900 font-medium">
                          {it.STKDES}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {it.TRNQTY}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-500">
                          {it.TQUCOD || "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {fmtMoney(it.UNITPR)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {fmtMoney(it.TRNVAL)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Remarks and Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-3 border-t border-slate-200 text-xs relative z-10">
                <div className="sm:col-span-7 flex flex-col justify-end">
                  <span className="text-slate-500 text-[11px] block mb-1">
                    จำนวนเงินตัวอักษร:
                  </span>
                  <div className="font-bold text-blue-900 bg-blue-50/80 p-2.5 rounded-xl border border-blue-200/50 text-xs">
                    ( {bahtText(data.invoice.NETAMT)} )
                  </div>
                </div>

                <div className="sm:col-span-5 space-y-1.5 text-xs">
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>รวมเป็นเงิน:</span>
                    <span className="font-mono">{fmtMoney(data.invoice.AMOUNT)}</span>
                  </div>
                  {data.invoice.DISCAMT > 0 && (
                    <div className="flex justify-between py-0.5 text-rose-600">
                      <span>หักส่วนลด:</span>
                      <span className="font-mono">-{fmtMoney(data.invoice.DISCAMT)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>ภาษีมูลค่าเพิ่ม ({data.invoice.VATRAT || 7}%):</span>
                    <span className="font-mono">{fmtMoney(data.invoice.VATAMT)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-slate-900 font-bold text-sm text-blue-900">
                    <span>จำนวนเงินสุทธิ:</span>
                    <span className="font-mono">฿{fmtMoney(data.invoice.NETAMT)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
