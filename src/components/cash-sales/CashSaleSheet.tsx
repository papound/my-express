"use client";

import React from "react";
import { Eye } from "lucide-react";
import { bahtText } from "@/lib/baht-text";
import { useSignatureVersion } from "@/hooks/useSignatureVersion";

export interface CashSalePageConfig {
  page: number;
  name: string;
  topText: string;
  title: string;
  subtitle: string;
  headerBg: string;
  tableHeaderBg: string;
  summaryBg: string;
  badgeBg: string;
  badgeActiveBg: string;
  showPaymentBox: boolean;
  showReceiptNote: boolean;
}

export const CASH_SALE_PAGES_CONFIG: CashSalePageConfig[] = [
  {
    page: 1,
    name: "ชุดที่ 1: ฟ้า (ต้นฉบับ/ไม่ใช่ใบกำกับภาษี)",
    topText: "เอกสารออกเป็นชุด",
    title: "ใบเสร็จรับเงิน",
    subtitle: "ต้นฉบับ (ไม่ใช่ใบกำกับภาษี)",
    headerBg: "#9ec5f7",
    tableHeaderBg: "#cde3fc",
    summaryBg: "#9ec5f7",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeActiveBg: "bg-blue-500 text-white shadow-blue-500/20",
    showPaymentBox: true,
    showReceiptNote: true,
  },
  {
    page: 2,
    name: "ชุดที่ 2: เหลือง (สำเนา/ไม่ใช่ใบกำกับภาษี)",
    topText: "เอกสารออกเป็นชุด",
    title: "ใบเสร็จรับเงิน",
    subtitle: "สำเนา (ไม่ใช่ใบกำกับภาษี)",
    headerBg: "#fde047",
    tableHeaderBg: "#fef9c3",
    summaryBg: "#fde047",
    badgeBg: "bg-yellow-50 text-yellow-800 border-yellow-300",
    badgeActiveBg: "bg-yellow-500 text-slate-900 shadow-yellow-500/20",
    showPaymentBox: true,
    showReceiptNote: true,
  },
  {
    page: 3,
    name: "ชุดที่ 3: ม่วง (ต้นฉบับ/ลูกค้า - ใบกำกับภาษี)",
    topText: "เอกสารออกเป็นชุด",
    title: "ใบกำกับสินค้า/ใบกำกับภาษี",
    subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
    headerBg: "#d946ef",
    tableHeaderBg: "#fae8ff",
    summaryBg: "#d946ef",
    badgeBg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    badgeActiveBg: "bg-fuchsia-500 text-white shadow-fuchsia-500/20",
    showPaymentBox: false,
    showReceiptNote: false,
  },
  {
    page: 4,
    name: "ชุดที่ 4: เขียวอ่อน (สำเนา/ลูกค้า - ใบกำกับภาษี)",
    topText: "เอกสารออกเป็นชุด",
    title: "ใบกำกับสินค้า/ใบกำกับภาษี",
    subtitle: "สำเนา (สำหรับลูกค้า)",
    headerBg: "#86efac",
    tableHeaderBg: "#dcfce7",
    summaryBg: "#86efac",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeActiveBg: "bg-emerald-500 text-white shadow-emerald-500/20",
    showPaymentBox: false,
    showReceiptNote: false,
  },
  {
    page: 5,
    name: "ชุดที่ 5: ส้ม (สำเนา/ฝ่ายบัญชี - ใบกำกับภาษี)",
    topText: "เอกสารออกเป็นชุด",
    title: "ใบกำกับสินค้า/ใบกำกับภาษี",
    subtitle: "สำเนา (สำหรับฝ่ายบัญชี)",
    headerBg: "#ffa439",
    tableHeaderBg: "#ffd296",
    summaryBg: "#ffa439",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeActiveBg: "bg-amber-500 text-white shadow-amber-500/20",
    showPaymentBox: false,
    showReceiptNote: false,
  },
  {
    page: 6,
    name: "ชุดที่ 6: เขียวมะกอก (ต้นฉบับ - ใบแจ้งหนี้)",
    topText: "เอกสารออกเป็นชุด",
    title: "ใบแจ้งหนี้",
    subtitle: "ต้นฉบับ",
    headerBg: "#84cc16",
    tableHeaderBg: "#ecfccb",
    summaryBg: "#84cc16",
    badgeBg: "bg-lime-50 text-lime-800 border-lime-300",
    badgeActiveBg: "bg-lime-600 text-white shadow-lime-600/20",
    showPaymentBox: false,
    showReceiptNote: false,
  },
];

export interface CashSaleItem {
  STKCOD: string;
  STKDES: string;
  SEQNUM: string;
  TRNQTY: number;
  TQUCOD: string;
  UNITPR: number;
  DISC?: string;
  DISCAMT?: number;
  TRNVAL: number;
}

export interface CashSaleData {
  invoice: {
    RECTYP?: string;
    DOCNUM: string;
    DOCDAT: string | Date | null;
    CUSCOD: string;
    SONUM?: string;
    DEPCOD?: string;
    FLGVAT?: string;
    SLMCOD?: string;
    AREACOD?: string;
    YOUREF?: string;
    PAYTRM?: number;
    DUEDAT: string | Date | null;
    BILNUM?: string | null;
    AMOUNT: number;
    DISCAMT: number;
    AFTDISC: number;
    ADVNUM?: string | null;
    ADVAMT?: number;
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
  items: CashSaleItem[];
  remarks?: { SEQNUM?: string; REMARK: string }[];
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

export function CashSaleSheet({
  data,
  config,
  onViewDeposit,
  onViewBilling,
}: {
  data: CashSaleData;
  config: CashSalePageConfig;
  onViewDeposit?: (docnum: string) => void;
  onViewBilling?: (bilnum: string) => void;
}) {
  const sigVersion = useSignatureVersion();
  const { invoice, customer, items, company } = data;

  const grossAmount = invoice.AMOUNT || 0;
  const discountAmt = invoice.DISCAMT || 0;
  const afterDiscount = invoice.AFTDISC || grossAmount - discountAmt;
  const vatRate = invoice.VATRAT || 7;
  const vatAmount = invoice.VATAMT || 0;
  const netAmount = invoice.NETAMT || 0;
  const taxWithheld = invoice.TAX || 0;
  const isCash = (invoice.CSHRCV || 0) > 0;
  const isCheque = (invoice.CHQRCV || 0) > 0;

  return (
    <div className="document-sheet bg-white rounded-2xl shadow-sm border border-slate-300 p-4 sm:p-6 md:p-8 text-slate-800 relative overflow-hidden text-xs print:p-0 print:border-none print:shadow-none">
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

          {/* Document Title Badge (Colored Pill with Above Header Text) */}
          <div className="w-full sm:w-auto text-right shrink-0">
            <div className="text-[11px] font-semibold text-slate-700 tracking-wide mb-1 text-center sm:text-right pr-2">
              {config.topText}
            </div>
            <div
              style={{ backgroundColor: config.headerBg }}
              className="border border-slate-800/30 rounded-xl px-5 py-2 shadow-sm inline-block w-full sm:w-auto min-w-[220px] text-center"
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
          <div className="p-2.5 sm:p-3 md:col-span-5 space-y-1.5 text-[11px]">
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

            <div className="grid grid-cols-2 gap-2 pt-0.5">
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

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                เลขที่ใบสั่งขาย{" "}
                <span className="text-[9.5px] font-normal text-slate-500">Sales Order No.</span>
              </span>
              <span className="font-mono font-medium text-slate-800">
                {invoice.SONUM || "-"}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                พนักงานขาย{" "}
                <span className="text-[9.5px] font-normal text-slate-500">Salesman</span>
              </span>
              <span className="text-slate-800">{invoice.SLMCOD || "-"}</span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                เขตการขาย{" "}
                <span className="text-[9.5px] font-normal text-slate-500">Territory</span>
              </span>
              <span className="text-slate-800">{invoice.AREACOD || "-"}</span>
            </div>

            {/* Billing Note Status & Action */}
            <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200">
              <span className="font-semibold text-slate-900 leading-tight">
                ใบวางบิล{" "}
                <span className="text-[9.5px] font-normal text-slate-500">Billing No.</span>
              </span>
              {invoice.BILNUM && invoice.BILNUM !== "~" ? (
                onViewBilling ? (
                  <button
                    type="button"
                    onClick={() => onViewBilling(invoice.BILNUM!)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 font-mono text-[10.5px] font-bold transition cursor-pointer"
                    title={`คลิกเพื่อเปิดดูใบวางบิล ${invoice.BILNUM}`}
                  >
                    <Eye size={11} />
                    <span>วางบิลแล้ว: {invoice.BILNUM}</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono text-[10.5px] font-bold">
                    <span>{invoice.BILNUM}</span>
                  </span>
                )
              ) : (
                <span className="text-[10px] text-slate-500 font-medium">
                  ขายสด (ไม่ต้องวางบิล)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Items Table Box (6 Columns including Discount) */}
        <div className="border border-slate-700 rounded-t-lg overflow-x-auto bg-white/70">
          <table className="w-full text-xs border-collapse min-w-[580px]">
            <thead>
              <tr
                style={{ backgroundColor: config.tableHeaderBg }}
                className="border-b border-slate-700 text-slate-900 font-bold"
              >
                <th className="py-2.5 px-2 text-center w-12 border-r border-slate-700">
                  ลำดับ<br />
                  <span className="text-[9px] font-normal text-slate-600">No.</span>
                </th>
                <th className="py-2.5 px-3 text-left border-r border-slate-700">
                  รหัสสินค้า/รายละเอียด<br />
                  <span className="text-[9px] font-normal text-slate-600">
                    Code/ Descriptions
                  </span>
                </th>
                <th className="py-2.5 px-3 text-right w-24 border-r border-slate-700">
                  จำนวน<br />
                  <span className="text-[9px] font-normal text-slate-600">Quantity</span>
                </th>
                <th className="py-2.5 px-3 text-right w-24 border-r border-slate-700">
                  หน่วยละ<br />
                  <span className="text-[9px] font-normal text-slate-600">Unit Price</span>
                </th>
                <th className="py-2.5 px-3 text-center w-20 border-r border-slate-700">
                  ส่วนลด<br />
                  <span className="text-[9px] font-normal text-slate-600">Discount</span>
                </th>
                <th className="py-2.5 px-3 text-right w-28">
                  จำนวนเงิน<br />
                  <span className="text-[9px] font-normal text-slate-600">Amount</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-2 text-center font-mono text-slate-700 border-r border-slate-700">
                    {item.SEQNUM ? parseInt(item.SEQNUM, 10) : idx + 1}
                  </td>
                  <td className="py-2.5 px-3 text-left border-r border-slate-700">
                    {item.STKCOD && (
                      <span className="font-mono font-semibold text-slate-900">
                        {item.STKCOD}/{" "}
                      </span>
                    )}
                    <span className="text-slate-800 font-medium">{item.STKDES}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 border-r border-slate-700 whitespace-nowrap">
                    {(item.TRNQTY ?? 0).toFixed(2)} {item.TQUCOD || ""}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r border-slate-700">
                    {fmtMoney(item.UNITPR)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-700 border-r border-slate-700">
                    {item.DISC || "-"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {fmtMoney(item.TRNVAL)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations and Summary Box */}
        <div className="border border-slate-700 border-t-0 rounded-b-lg overflow-hidden bg-white/80 -mt-3 sm:-mt-4">
          <div className="grid grid-cols-1 md:grid-cols-12 text-xs">
            {/* Left: Receipt Note (7 cols) */}
            <div className="p-3 md:col-span-7 flex flex-col justify-end border-b md:border-b-0 md:border-r border-slate-700 min-h-[80px]">
              {config.showReceiptNote && (
                <div className="text-[10.5px] text-slate-700 leading-relaxed font-normal">
                  ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์ต่อเมื่อมีลายเซ็นผู้รับมอบอำนาจและลายเซ็นผู้รับเงิน
                  และได้เรียกเก็บเงินตามเช็คเรียบร้อยแล้ว
                </div>
              )}
            </div>

            {/* Right: Summary Breakdown (5 cols) */}
            <div className="p-2.5 sm:p-3 md:col-span-5 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">
                  รวมเป็นเงิน{" "}
                  <span className="text-[9.5px] font-normal text-slate-500">
                    Gross Amount
                  </span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {fmtMoney(grossAmount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">
                  หักส่วนลด{" "}
                  <span className="text-[9.5px] font-normal text-slate-500">
                    Less Discount
                  </span>
                </span>
                <span className="font-mono text-slate-700">{fmtMoney(discountAmt)}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">
                  ยอดหลังหักส่วนลด{" "}
                  <span className="text-[9.5px] font-normal text-slate-500">
                    After Discount
                  </span>
                </span>
                <span className="font-mono text-slate-800">{fmtMoney(afterDiscount)}</span>
              </div>

              {(invoice.ADVAMT || 0) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span>หักเงินมัดจำ</span>
                    {invoice.ADVNUM && (
                      onViewDeposit ? (
                        <button
                          type="button"
                          onClick={() => onViewDeposit(invoice.ADVNUM!)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 font-mono text-[10.5px] font-bold transition cursor-pointer"
                          title={`คลิกเพื่อเปิดดูใบรับเงินมัดจำ ${invoice.ADVNUM}`}
                        >
                          <Eye size={11} />
                          <span>{invoice.ADVNUM}</span>
                        </button>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80 font-mono text-[10.5px] font-bold">
                          {invoice.ADVNUM}
                        </span>
                      )
                    )}
                    <span className="text-[9.5px] font-normal text-slate-500">
                      Less Deposit
                    </span>
                  </span>
                  <span className="font-mono text-slate-800">
                    {fmtMoney(invoice.ADVAMT)}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-0.5 border-t border-dashed border-slate-200">
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

        {/* Bottom Conditions & Signatures Box */}
        <div className="border border-slate-700 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-white/80 text-[10.5px]">
          {/* Left: Goods Received & Delivery (4 cols) */}
          <div className="p-3 md:col-span-4 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col justify-between space-y-4">
            <div className="font-bold text-center text-slate-900">
              ได้รับสินค้าตามรายการถูกต้องแล้ว
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-end gap-2">
                  <div className="border-b border-slate-700 flex-1 h-7"></div>
                  <div className="border-b border-slate-700 w-20 h-7"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                  <span>ผู้รับสินค้า/ Goods Received by</span>
                  <span className="w-20 text-center">วันที่/ Date</span>
                </div>
              </div>

              <div>
                <div className="flex items-end gap-2">
                  <div className="border-b border-slate-700 flex-1 h-7"></div>
                  <div className="border-b border-slate-700 w-20 h-7"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                  <span>ผู้ส่งสินค้า/ Delivery by</span>
                  <span className="w-20 text-center">วันที่/ Date</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Either Payment Details (Copies 1 & 2) OR Terms & Conditions (Copies 3, 4, 5, 6) */}
          {config.showPaymentBox ? (
            <div className="p-3 md:col-span-4 border-b md:border-b-0 md:border-r border-slate-700 text-[10px] space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-1">
                  <span className="font-bold text-slate-900">ชำระเงินโดย</span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      readOnly
                      checked={isCash}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>เงินสด</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      readOnly
                      checked={isCheque}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>เช็ค</span>
                  </label>
                </div>
                <div className="text-slate-700 leading-tight">
                  เช็คธนาคาร__________________ สาขา____________________
                </div>
                <div className="text-slate-700 leading-tight">
                  เลขที่__________________________ วันที่ ____/_____/_______
                </div>
                <div className="text-slate-700 leading-tight">
                  จำนวนเงิน_______________________________________
                </div>
                <div className="text-slate-700 leading-tight">
                  ภาษีหัก ณ ที่จ่าย {taxWithheld > 0 ? fmtMoney(taxWithheld) : "___________________________________"}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="h-7 flex items-end justify-center -mb-0.5 pointer-events-none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/logo/signature?role=collector&v=${sigVersion}`}
                        alt="Collector Signature"
                        className="h-7 w-auto object-contain object-bottom"
                      />
                    </div>
                    <div className="border-b border-slate-700 w-full"></div>
                  </div>
                  <div className="border-b border-slate-700 w-20 h-7"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-700 mt-1">
                  <span>ผู้รับเงิน/ Collector</span>
                  <span className="w-20 text-center">วันที่/ Date</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 md:col-span-4 border-b md:border-b-0 md:border-r border-slate-700 text-[9.5px] leading-relaxed text-slate-700 space-y-1">
              <div>o สินค้านี้ขายขาดไม่รับคืนหรือเปลี่ยน</div>
              <div>o บริษัทฯ จะนำใบเสร็จรับเงินมาเรียกเก็บเงินในภายหลัง</div>
              <div>o บริษัทฯ จะคิดดอกเบี้ย 1.25% ต่อเดือน เมื่อชำระบิลเกินกำหนด</div>
              <div>
                o กรุณาชำระเงินด้วยเช็ค ในนามบริษัทฯ ขีดผู้ถือและขีดคล่อมเท่านั้น
              </div>
            </div>
          )}

          {/* Right: Authorized Signatures (4 cols) */}
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
                    src={`/api/logo/signature?role=authorized&v=${sigVersion}`}
                    alt="Authorized Signature"
                    className="h-12 sm:h-14 w-auto object-contain object-bottom"
                  />
                </div>
                <div className="border-b border-slate-700 w-4/5 mx-auto"></div>
                <div className="text-[9px] text-slate-600 mt-1">
                  ผู้รับมอบอำนาจ/ Authorized Signature
                </div>
              </div>

              <div className="relative flex flex-col items-center">
                <div className="h-7 sm:h-8 flex items-end justify-center -mb-0.5 pointer-events-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/logo/signature?role=approved&v=${sigVersion}`}
                    alt="Approved Signature"
                    className="h-7 sm:h-8 w-auto object-contain object-bottom"
                  />
                </div>
                <div className="border-b border-slate-700 w-4/5 mx-auto"></div>
                <div className="text-[9px] text-slate-600 mt-1">
                  ผู้ตรวจเช็คสินค้า/ Approved by
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

