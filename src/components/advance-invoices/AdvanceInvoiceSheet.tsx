"use client";

import React from "react";
import { Eye, Link2, CheckCircle2, Clock } from "lucide-react";
import { bahtText } from "@/lib/baht-text";

export interface AdvanceInvoicePageConfig {
  page: number;
  name: string;
  title: string;
  subtitle: string;
  headerBg: string;
  tableHeaderBg: string;
  summaryBg: string;
  badgeBg: string;
  badgeActiveBg: string;
}

export const ADVANCE_INVOICE_PAGES_CONFIG: AdvanceInvoicePageConfig[] = [
  {
    page: 1,
    name: "ชุดที่ 1: ฟ้า (ต้นฉบับ/ลูกค้า)",
    title: "ใบรับเงินมัดจำ/ใบกำกับภาษี",
    subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
    headerBg: "#9ec5f7",
    tableHeaderBg: "#cde3fc",
    summaryBg: "#9ec5f7",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeActiveBg: "bg-blue-500 text-white shadow-blue-500/20",
  },
  {
    page: 2,
    name: "ชุดที่ 2: ส้ม (สำเนา/ฝ่ายบัญชี)",
    title: "ใบรับเงินมัดจำ/ใบกำกับภาษี",
    subtitle: "สำเนา (สำหรับฝ่ายบัญชี)",
    headerBg: "#ffa439",
    tableHeaderBg: "#ffd296",
    summaryBg: "#ffa439",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeActiveBg: "bg-amber-500 text-white shadow-amber-500/20",
  },
  {
    page: 3,
    name: "ชุดที่ 3: เหลือง (ต้นฉบับ/ลูกค้า - ใบแจ้งหนี้)",
    title: "ใบรับเงินมัดจำ/ใบแจ้งหนี้",
    subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
    headerBg: "#fde047",
    tableHeaderBg: "#fef9c3",
    summaryBg: "#fde047",
    badgeBg: "bg-yellow-50 text-yellow-800 border-yellow-300",
    badgeActiveBg: "bg-yellow-500 text-slate-900 shadow-yellow-500/20",
  },
];

export interface AdvanceInvoiceItem {
  STKCOD?: string;
  STKDES: string;
  SEQNUM?: string;
  TRNQTY?: number;
  TQUCOD?: string;
  UNITPR?: number;
  TRNVAL: number;
}

export interface AdvanceInvoiceData {
  invoice: {
    RECTYP?: string;
    DOCNUM: string;
    DOCDAT: string | Date | null;
    CUSCOD: string;
    YOUREF?: string;
    PAYTRM?: number;
    DUEDAT: string | Date | null;
    AMOUNT: number;
    VATRAT?: number;
    VATAMT: number;
    NETAMT: number;
    CSHRCV?: number;
    CHQRCV?: number;
    TAX?: number;
  };
  customer?: {
    CUSNAM: string;
    PRENAM?: string;
    ADDR01?: string;
    ADDR02?: string;
    ADDR03?: string;
    ZIPCOD?: string;
    TELNUM?: string;
    TAXID?: string;
    ORGNUM?: number;
  };
  items: AdvanceInvoiceItem[];
  remarks?: { SEQNUM?: string; REMARK: string }[];
  appliedInvoices?: Array<{
    DOCNUM: string;
    RECTYP: string;
    DOCDAT: string | Date | null;
    DUEDAT?: string | Date | null;
    AMOUNT?: number;
    ADVAMT: number;
    NETAMT?: number;
    CUSCOD?: string;
    CUSNAM?: string;
  }>;
  company?: {
    THINAM?: string;
    ADDR01?: string;
    ADDR02?: string;
    TELNUM?: string;
    TAXID?: string;
    ORGSTR?: string;
  };
}

function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0.00";
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtThaiDateShort(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "-";
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const buddhistYear = dateObj.getFullYear() + 543;
  const yearShort = String(buddhistYear % 100).padStart(2, "0");
  return `${day}/${month}/${yearShort}`;
}

export function AdvanceInvoiceSheet({
  data,
  config,
  onViewInvoice,
}: {
  data: AdvanceInvoiceData;
  config: AdvanceInvoicePageConfig;
  onViewInvoice?: (docnum: string) => void;
}) {
  const { invoice, customer, items, company } = data;

  const grossAmount = invoice.AMOUNT || 0;
  const vatRate = invoice.VATRAT || 7;
  const vatAmount = invoice.VATAMT || 0;
  const netAmount = invoice.NETAMT || 0;
  const taxWithheld = invoice.TAX || 0;
  const isCash = (invoice.CSHRCV || 0) > 0;
  const isCheque = (invoice.CHQRCV || 0) > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-300 p-4 sm:p-6 md:p-8 text-slate-800 relative overflow-hidden text-xs print:p-0 print:border-none print:shadow-none">
      {/* Background Watermark */}
      <img
        src="/api/logo/watermark"
        alt="Watermark"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[460px] opacity-[0.22] pointer-events-none select-none z-0"
      />

      <div className="relative z-10 space-y-3 sm:space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Company Details */}
          <div className="flex items-start gap-3">
            <img
              src="/api/logo"
              alt="Logo"
              className="h-12 w-auto max-w-[90px] object-contain shrink-0 mt-0.5"
            />
            <div>
              <div className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                {company?.THINAM || ""}
              </div>
              <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                {company?.ADDR01} {company?.ADDR02}
              </div>
              <div className="text-[11px] text-slate-600 leading-tight">
                {company?.TELNUM || ""}
              </div>
              <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                เลขประจำตัวผู้เสียภาษี/ Tax ID{" "}
                <span className="font-mono font-bold text-slate-900">
                  {company?.TAXID || ""}
                </span>{" "}
                &nbsp; สำนักงานใหญ่
              </div>
            </div>
          </div>

          {/* Document Title Badge (Colored Pill) */}
          <div className="w-full sm:w-auto text-center shrink-0">
            <div
              style={{ backgroundColor: config.headerBg }}
              className="border border-slate-800/30 rounded-xl px-5 py-2 shadow-sm inline-block w-full sm:w-auto min-w-[210px]"
            >
              <div className="text-sm sm:text-base font-bold text-slate-950 tracking-wide">
                {config.title}
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">
                {config.subtitle}
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Document Info Box */}
        <div className="border border-slate-700 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-white/70">
          {/* Left: Customer Info (7 cols) */}
          <div className="p-2.5 sm:p-3 md:col-span-7 space-y-1 border-b md:border-b-0 md:border-r border-slate-700">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-900 w-16 shrink-0 leading-tight">
                ลูกค้า<br />
                <span className="text-[9.5px] font-normal text-slate-500">Customer</span>
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                {invoice.CUSCOD}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm pt-0.5">
              {customer?.PRENAM ? `${customer.PRENAM} ` : ""}
              {customer?.CUSNAM || "-"}
            </div>
            <div className="text-[11px] text-slate-600 leading-snug">
              {customer?.ADDR01 && <div>{customer.ADDR01}</div>}
              {customer?.ADDR02 && <div>{customer.ADDR02}</div>}
              {(customer?.ADDR03 || customer?.ZIPCOD) && (
                <div>
                  {customer?.ADDR03} {customer?.ZIPCOD}
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-700">
              โทร. {customer?.TELNUM || "-"}
            </div>
            <div className="text-[11px] text-slate-700 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
              <span>
                เลขประจำตัวผู้เสียภาษี:{" "}
                <strong className="font-mono text-slate-900 font-semibold">
                  {customer?.TAXID || "-"}
                </strong>
              </span>
              <span className="font-medium text-slate-900">
                ☑ {customer?.ORGNUM ? `สาขาที่ ${customer.ORGNUM}` : "สำนักงานใหญ่"}
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1 border-t border-dashed border-slate-200">
              <span className="font-semibold text-slate-900 w-16 shrink-0 leading-tight">
                อ้างอิง<br />
                <span className="text-[9.5px] font-normal text-slate-500">Reference</span>
              </span>
              <span className="font-semibold text-slate-800">
                {invoice.YOUREF || "-"}
              </span>
            </div>
          </div>

          {/* Right: Document Attributes (5 cols) */}
          <div className="p-2.5 sm:p-3 md:col-span-5 space-y-2 text-[11px]">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                เลขที่ <span className="text-[9.5px] font-normal text-slate-500">No.</span>
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {invoice.DOCNUM}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                วันที่ <span className="text-[9.5px] font-normal text-slate-500">Date</span>
              </span>
              <span className="font-semibold text-slate-800">
                {fmtThaiDateShort(invoice.DOCDAT)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-slate-200">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">
                  เครดิต <span className="text-[9.5px] font-normal text-slate-500">Credit</span>
                </span>
                <span className="font-semibold text-slate-800">
                  {invoice.PAYTRM || 0} วัน
                </span>
              </div>
              <div className="flex justify-between pl-1">
                <span className="font-semibold text-slate-900">
                  ครบกำหนด <span className="text-[9.5px] font-normal text-slate-500">Due</span>
                </span>
                <span className="font-semibold text-slate-800">
                  {fmtThaiDateShort(invoice.DUEDAT)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Applied Sales Invoices Link Box */}
        {data.appliedInvoices && data.appliedInvoices.length > 0 ? (
          <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-300 text-xs shadow-xs print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-950">
                  เงินมัดจำนี้ถูกนำไปหักในบิลขายแล้ว ({data.appliedInvoices.length} บิล):
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {data.appliedInvoices.map((inv) => (
                  <button
                    key={inv.DOCNUM}
                    type="button"
                    onClick={() => onViewInvoice && onViewInvoice(inv.DOCNUM)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-mono text-xs font-bold hover:bg-emerald-100 hover:border-emerald-400 transition cursor-pointer shadow-xs group"
                    title={`คลิกเพื่อเปิดดูรายละเอียดบิลขาย ${inv.DOCNUM}`}
                  >
                    <Link2 size={12} className="text-emerald-600 group-hover:scale-110 transition" />
                    <span>{inv.DOCNUM}</span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded">
                      {inv.RECTYP === "1" ? "ขายสด" : "ขายเชื่อ"}
                    </span>
                    <span className="text-emerald-800 font-semibold">
                      ฿{fmtMoney(inv.ADVAMT)}
                    </span>
                    <Eye size={12} className="text-emerald-600 ml-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <Clock size={15} className="text-amber-600 shrink-0" />
              <span>สถานะเงินมัดจำ: ยังไม่ถูกนำไปหักในบิลขาย (ยอดเงินมัดจำคงเหลือพร้อมใช้งาน)</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-300/50">
              คงเหลือ ฿{fmtMoney(invoice.NETAMT)}
            </span>
          </div>
        )}

        {/* Items Table Box (3 Columns as in scan) */}
        <div className="border border-slate-700 rounded-t-lg overflow-x-auto bg-white/70">
          <table className="w-full text-xs border-collapse min-w-[540px]">
            <thead>
              <tr
                style={{ backgroundColor: config.tableHeaderBg }}
                className="border-b border-slate-700 text-slate-900 font-bold"
              >
                <th className="py-2.5 px-2 text-center w-12 border-r border-slate-700">
                  ลำดับ<br />
                  <span className="text-[9px] font-normal text-slate-600">No.</span>
                </th>
                <th className="py-2.5 px-4 text-center border-r border-slate-700">
                  รายการ/รายละเอียด<br />
                  <span className="text-[9px] font-normal text-slate-600">
                    Items/ Descriptions
                  </span>
                </th>
                <th className="py-2.5 px-4 text-right w-36">
                  จำนวนเงิน<br />
                  <span className="text-[9px] font-normal text-slate-600">Amount</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-2 text-center font-mono text-slate-700 border-r border-slate-700">
                    {item.SEQNUM ? parseInt(item.SEQNUM, 10) : idx + 1}
                  </td>
                  <td className="py-3 px-4 text-left border-r border-slate-700 font-medium text-slate-900">
                    {item.STKDES || item.STKCOD || "ค่ามัดจำ"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {fmtMoney(item.TRNVAL || grossAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations and Summary Box */}
        <div className="border border-slate-700 border-t-0 rounded-b-lg overflow-hidden bg-white/80 -mt-3 sm:-mt-4">
          <div className="grid grid-cols-1 md:grid-cols-12 text-xs">
            {/* Left: Empty spacing (7 cols) */}
            <div className="p-3 md:col-span-7 flex flex-col justify-end border-b md:border-b-0 md:border-r border-slate-700 min-h-[70px]">
            </div>

            {/* Right: Summary Breakdown (5 cols) */}
            <div className="p-2.5 sm:p-3 md:col-span-5 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">
                  จำนวนเงิน{" "}
                  <span className="text-[9.5px] font-normal text-slate-500">
                    Amount
                  </span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {fmtMoney(grossAmount)}
                </span>
              </div>

              <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                <span className="font-semibold text-slate-900">
                  จำนวนภาษีมูลค่าเพิ่ม {vatRate.toFixed(2)} %{" "}
                  <span className="text-[9.5px] font-normal text-slate-500">VAT</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {fmtMoney(vatAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Full-width Colored Total Bar */}
          <div
            style={{ backgroundColor: config.summaryBg }}
            className="border-t border-slate-700 grid grid-cols-1 md:grid-cols-12 items-center"
          >
            <div className="p-2.5 sm:p-3 md:col-span-7 font-bold text-slate-950 text-xs sm:text-sm border-b md:border-b-0 md:border-r border-slate-700">
              ( {bahtText(netAmount)} )
            </div>
            <div className="p-2.5 sm:p-3 md:col-span-5 flex justify-between items-center">
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-950 leading-tight">
                  จำนวนเงินรวมทั้งสิ้น
                </div>
                <div className="text-[9px] font-normal text-slate-800">
                  Total Invoice
                </div>
              </div>
              <div className="font-mono font-extrabold text-sm sm:text-base text-slate-950">
                ฿{fmtMoney(netAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Payment Methods & Signatures Box */}
        <div className="border border-slate-700 rounded-lg overflow-hidden bg-white/80 text-[10.5px]">
          {/* Top disclaimer inside box */}
          <div className="p-2.5 border-b border-slate-700 text-[10px] text-slate-700 leading-relaxed bg-slate-50/50">
            ใบรับเงินมัดจำฉบับนี้จะสมบูรณ์ต่อเมื่อมีลายเซ็นผู้รับมอบอำนาจและลายเซ็นผู้รับเงิน
            และได้เรียกเก็บเงินตามเช็คเรียบร้อยแล้ว
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Left / Middle: Payment Method Details (8 cols) */}
            <div className="p-3 md:col-span-8 border-b md:border-b-0 md:border-r border-slate-700 space-y-2.5">
              <div className="flex items-center gap-6">
                <span className="font-bold text-slate-900">ชำระเงินโดย</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    readOnly
                    checked={isCash}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>เงินสด</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    readOnly
                    checked={isCheque}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>เช็ค</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  เช็คธนาคาร____________________
                </div>
                <div>
                  สาขา________________
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  เลขที่__________________________
                </div>
                <div>
                  วันที่ ____/_____/_______
                </div>
              </div>

              <div className="text-[10px]">
                จำนวนเงิน {fmtMoney(netAmount)} บาท
              </div>

              <div className="text-[10px]">
                ภาษีหัก ณ ที่จ่าย {taxWithheld > 0 ? fmtMoney(taxWithheld) : "___________________________________"}
              </div>

              {/* Sub-signatures: Payer and Collector */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-slate-200">
                <div className="text-center">
                  <div className="border-b border-slate-700 w-4/5 mx-auto h-4"></div>
                  <div className="text-[9.5px] text-slate-700 mt-1">
                    ผู้ชำระเงิน/ Payer
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-end gap-2">
                    <div className="border-b border-slate-700 flex-1 h-4"></div>
                    <div className="border-b border-slate-700 w-20 h-4"></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-700 mt-1">
                    <span>ผู้รับเงิน/ Collector</span>
                    <span className="w-20 text-center">วันที่/ Date</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Company & Authorized Signatures (4 cols) */}
            <div className="p-3 md:col-span-4 text-center flex flex-col justify-between space-y-4">
              <div>
                <div className="text-[9.5px] text-slate-500">ในนาม</div>
                <div className="font-bold text-slate-900 text-xs">
                  {company?.THINAM || ""}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="relative flex flex-col items-center">
                  <div className="h-12 sm:h-14 flex items-end justify-center -mb-0.5 pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/api/logo/signature"
                      alt="Authorized Signature"
                      className="h-12 sm:h-14 w-auto object-contain object-bottom"
                    />
                  </div>
                  <div className="border-b border-slate-700 w-4/5 mx-auto"></div>
                  <div className="text-[9.5px] text-slate-600 mt-1">
                    ผู้รับมอบอำนาจ/ Authorized Signature
                  </div>
                </div>

                <div>
                  <div className="border-b border-slate-700 w-4/5 mx-auto h-7 sm:h-8"></div>
                  <div className="text-[9.5px] text-slate-600 mt-1">
                    ผู้ตรวจสอบ/ Approved by
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

