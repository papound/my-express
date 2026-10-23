"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import Link from "next/link";
import { bahtText } from "@/lib/baht-text";
import { AppShell } from "@/components/layout/AppShell";

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

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ docnum: string }>;
}) {
  const { docnum } = use(params);
  const [data, setData] = useState<InvoiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const { invoice, customer, items, remarks, company } = data;
  const docTypeLabel =
    invoice.RECTYP === "1"
      ? "ใบเสร็จรับเงิน / ใบกำกับภาษี (ขายสด)"
      : "ใบแจ้งหนี้ / ใบกำกับภาษี (ขายเชื่อ)";

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

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href="/invoices"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} /> กลับหน้ารายการ
          </Link>
          <div className="flex items-center gap-3">
            <a
              href={`/api/pdf/invoice/${encodeURIComponent(invoice.DOCNUM)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition w-full sm:w-auto"
            >
              <Printer size={16} /> พิมพ์ / ดาวน์โหลด PDF (Express Form)
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
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg border border-blue-200/60 mb-1.5 sm:mb-2">
                {docTypeLabel}
              </span>
              <div className="text-xs sm:text-sm">
                <span className="text-slate-500">เลขที่:</span>{" "}
                <strong className="font-mono text-slate-900">{invoice.DOCNUM}</strong>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                วันที่: <span className="text-slate-800">{fmtDate(invoice.DOCDAT)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Document Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-100 text-xs relative z-10">
            <div className="space-y-1">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                ข้อมูลลูกค้า
              </div>
              <div className="text-slate-900 font-semibold text-sm">
                [{invoice.CUSCOD}] {customer?.PRENAM} {customer?.CUSNAM}
              </div>
              <div className="text-slate-600 leading-relaxed mt-1">
                {customer?.ADDR01} {customer?.ADDR02} {customer?.ADDR03} {customer?.ZIPCOD}
              </div>
              <div className="text-slate-600 pt-1 font-mono">
                เลขผู้เสียภาษี: {customer?.TAXID || "-"}{" "}
                {customer?.ORGNUM ? `(สาขา ${customer.ORGNUM})` : "(สำนักงานใหญ่)"}
              </div>
              <div className="text-slate-600">โทร: {customer?.TELNUM || "-"}</div>
            </div>
            <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-6">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                ข้อมูลการจัดส่ง / อ้างอิง
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ใบสั่งขาย/เสนอราคา:</span>
                <span className="font-mono font-medium">{invoice.SONUM || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">เลขที่อ้างอิงลูกค้า:</span>
                <span>{invoice.YOUREF || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">พนักงานขาย:</span>
                <span>{invoice.SLMCOD || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">กำหนดชำระเงิน:</span>
                <span>{fmtDate(invoice.DUEDAT)}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto relative z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-xs border-collapse min-w-[620px]">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-left">
                  <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-3 px-3 w-32">รหัสสินค้า</th>
                  <th className="py-3 px-3">รายละเอียดสินค้า</th>
                  <th className="py-3 px-3 text-right w-20">จำนวน</th>
                  <th className="py-3 px-3 text-center w-16">หน่วย</th>
                  <th className="py-3 px-3 text-right w-24">ราคา/หน่วย</th>
                  <th className="py-3 px-3 text-right w-20">ส่วนลด</th>
                  <th className="py-3 px-3 text-right w-28">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {item.SEQNUM || idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 font-medium">
                      {item.STKCOD}
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-medium">
                      {item.STKDES}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {item.TRNQTY}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {item.TQUCOD || "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {fmtMoney(item.UNITPR)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {item.DISCAMT > 0 ? fmtMoney(item.DISCAMT) : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {fmtMoney(item.TRNVAL)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Remarks and Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 border-t border-slate-200 text-xs relative z-10">
            <div className="md:col-span-7 space-y-3">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                หมายเหตุ:
              </div>
              {remarks.length > 0 ? (
                remarks.map((r, i) => (
                  <div
                    key={i}
                    className="text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
                  >
                    {r.REMARK}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic">- ไม่มีหมายเหตุ -</div>
              )}

              <div className="mt-4 pt-3">
                <span className="text-slate-500 block mb-1">จำนวนเงินตัวอักษร:</span>
                <div className="font-bold text-blue-900 bg-blue-50/80 p-3 rounded-xl border border-blue-200/50 text-xs">
                  ( {bahtText(invoice.NETAMT)} )
                </div>
              </div>
            </div>

            <div className="md:col-span-5 space-y-2">
              <div className="flex justify-between py-1 text-slate-600">
                <span>รวมเป็นเงิน:</span>
                <span className="font-mono">{fmtMoney(invoice.AMOUNT)}</span>
              </div>
              {invoice.DISCAMT > 0 && (
                <div className="flex justify-between py-1 text-rose-600">
                  <span>หักส่วนลด:</span>
                  <span className="font-mono">-{fmtMoney(invoice.DISCAMT)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-slate-600">
                <span>ยอดหลังหักส่วนลด:</span>
                <span className="font-mono">
                  {fmtMoney(invoice.AFTDISC || invoice.AMOUNT - invoice.DISCAMT)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>ภาษีมูลค่าเพิ่ม ({invoice.VATRAT || 7}%):</span>
                <span className="font-mono">{fmtMoney(invoice.VATAMT)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-slate-900 font-bold text-base text-blue-900">
                <span>จำนวนเงินรวมทั้งสิ้น:</span>
                <span className="font-mono font-bold">฿{fmtMoney(invoice.NETAMT)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

