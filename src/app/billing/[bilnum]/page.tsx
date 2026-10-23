"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Printer, RefreshCw, Eye } from "lucide-react";
import Link from "next/link";
import { bahtText } from "@/lib/baht-text";
import { AppShell } from "@/components/layout/AppShell";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";

interface InvoiceItem {
  DOCNUM: string;
  DOCDAT: string | null;
  RECTYP: string;
  AMOUNT: number;
  VATAMT: number;
  NETAMT: number;
  REMAMT: number;
}

interface BillingDetailResponse {
  billing: {
    BILNUM: string;
    BILDAT: string | null;
    CUSCOD: string;
    BILOUT: string | null;
    APPDAT: string | null;
    PAYCOND: string;
    REMARK: string;
    NETAMT: number;
    DOCSTAT: string;
    USERID: string;
  };
  customer?: {
    CUSNAM: string;
    PRENAM: string;
    ADDR01: string;
    ADDR02: string;
    ADDR03: string;
    ZIPCOD: string;
    TELNUM: string;
    TAXID: string;
    ORGNUM: number;
  };
  invoices: InvoiceItem[];
  company?: {
    THINAM: string;
    ADDR01: string;
    ADDR02: string;
    TELNUM: string;
    TAXID: string;
  };
}

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
  const [data, setData] = useState<BillingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [popupDocnum, setPopupDocnum] = useState<string | null>(null);

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

  const { billing, customer, invoices, company } = data;

  const fmtDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

  const fmtMoney = (n: number) =>
    n.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const statusCfg = STATUS_CONFIG[billing.DOCSTAT] || {
    label: billing.DOCSTAT,
    badgeClass: "bg-slate-100 text-slate-700",
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href="/billing"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} /> กลับหน้ารายการ
          </Link>
          <div className="flex items-center gap-3">
            <a
              href={`/api/pdf/billing/${encodeURIComponent(billing.BILNUM)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition w-full sm:w-auto"
            >
              <Printer size={16} /> พิมพ์ / ดาวน์โหลด PDF (Billing Statement)
            </a>
          </div>
        </div>

        {/* Voucher Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 relative overflow-hidden">
          {/* Background Watermark */}
          <img
            src="/api/logo/watermark"
            alt="Watermark"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-full opacity-[0.09] pointer-events-none select-none z-0"
          />

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-5 sm:pb-6 gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <img
                src="/api/logo"
                alt="Logo"
                className="h-12 sm:h-14 w-auto max-w-[100px] sm:max-w-[120px] object-contain shrink-0"
              />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900">
                  {company?.THINAM || "บริษัท ธงธัญ จำกัด"}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 max-w-md">
                  {company?.ADDR01} {company?.ADDR02}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  โทร: {company?.TELNUM || "-"} | เลขประจำตัวผู้เสียภาษี:{" "}
                  <span className="font-mono">{company?.TAXID || "-"}</span>
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className={`inline-block px-3 py-1 font-bold text-xs rounded-lg border mb-1.5 sm:mb-2 ${statusCfg.badgeClass}`}>
                {statusCfg.label}
              </span>
              <div className="text-xs sm:text-sm">
                <span className="text-slate-500">เลขที่ใบวางบิล:</span>{" "}
                <strong className="font-mono text-slate-900">{billing.BILNUM}</strong>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                วันที่วางบิล: <span className="text-slate-800">{fmtDate(billing.BILDAT)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Billing Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-100 text-xs relative z-10">
            <div className="space-y-1">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                ข้อมูลลูกค้า
              </div>
              <div className="text-slate-900 font-semibold text-sm">
                [{billing.CUSCOD}] {customer?.PRENAM} {customer?.CUSNAM}
              </div>
              <div className="text-slate-600 leading-relaxed mt-1">
                {customer?.ADDR01} {customer?.ADDR02} {customer?.ADDR03} {customer?.ZIPCOD}
              </div>
              <div className="text-slate-600 pt-1 font-mono">
                เลขผู้เสียภาษี: {customer?.TAXID || "-"}
              </div>
              <div className="text-slate-600">โทร: {customer?.TELNUM || "-"}</div>
            </div>
            <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-6">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                รายละเอียดนัดชำระเงิน
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">วันส่งบิล:</span>
                <span>{fmtDate(billing.BILOUT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">วันนัดรับเงิน / ชำระ:</span>
                <span className="font-bold text-blue-700 text-sm">{fmtDate(billing.APPDAT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">เงื่อนไขการชำระ:</span>
                <span>{billing.PAYCOND || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ผู้วางบิล (User):</span>
                <span className="font-mono">{billing.USERID || "-"}</span>
              </div>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="overflow-x-auto relative z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              รายการใบแจ้งหนี้ / ใบส่งของ ที่นำมาวางบิล ({invoices.length} ฉบับ)
            </div>
            <table className="w-full text-xs border-collapse min-w-[580px]">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-left">
                  <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-3 px-3 w-40">เลขที่ใบกำกับภาษี</th>
                  <th className="py-3 px-3 text-center w-32">วันที่เอกสาร</th>
                  <th className="py-3 px-3 text-right w-32">ภาษีมูลค่าเพิ่ม</th>
                  <th className="py-3 px-3 text-right w-36">จำนวนเงินสุทธิ</th>
                  <th className="py-3 px-3 text-center w-24">ดูบิล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      ไม่พบรายการใบแจ้งหนี้ที่ผูกกับใบวางบิลนี้
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-900 font-bold">
                        <button
                          type="button"
                          onClick={() => setPopupDocnum(inv.DOCNUM)}
                          className="hover:text-blue-600 hover:underline text-left font-mono font-bold"
                          title="คลิกเพื่อดูรายละเอียดใบกำกับภาษี"
                        >
                          {inv.DOCNUM}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {fmtDate(inv.DOCDAT)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {fmtMoney(inv.VATAMT)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                        ฿{fmtMoney(inv.NETAMT)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setPopupDocnum(inv.DOCNUM)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition"
                          title="ดูรายละเอียดใบกำกับภาษี (Popup)"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Remarks and Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 border-t border-slate-200 text-xs relative z-10">
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">
                  หมายเหตุ:
                </span>
                <div className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-12">
                  {billing.REMARK || "- ไม่มีหมายเหตุ -"}
                </div>
              </div>

              <div className="mt-4">
                <span className="text-slate-500 block mb-1">จำนวนเงินตัวอักษร:</span>
                <div className="font-bold text-blue-900 bg-blue-50/80 p-3 rounded-xl border border-blue-200/50 text-xs">
                  ( {bahtText(billing.NETAMT)} )
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col justify-end">
              <div className="flex justify-between py-4 border-y-2 border-slate-900 font-bold text-base text-blue-900">
                <span>ยอดเงินวางบิลรวมทั้งสิ้น:</span>
                <span className="font-mono font-bold text-lg">฿{fmtMoney(billing.NETAMT)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Detail Popup Modal */}
      <InvoiceDetailModal
        docnum={popupDocnum}
        onClose={() => setPopupDocnum(null)}
      />
    </AppShell>
  );
}

