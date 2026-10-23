"use client";

import React from "react";
import { bahtText } from "@/lib/baht-text";

export interface InvoicePageConfig {
  page: number;
  name: string;
  title: string;
  subtitle: string;
  headerBg: string;
  tableHeaderBg: string;
  summaryBg: string;
  badgeBg: string;
  badgeActiveBg: string;
  showReceiptNote: boolean;
}

export const INVOICE_PAGES_CONFIG: InvoicePageConfig[] = [
  {
    page: 1,
    name: "ชุดที่ 1: ฟ้า (ต้นฉบับ/ลูกค้า)",
    title: "ใบกำกับภาษี/ใบส่งสินค้า",
    subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
    headerBg: "#9ec5f7",
    tableHeaderBg: "#cde3fc",
    summaryBg: "#9ec5f7",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeActiveBg: "bg-blue-500 text-white shadow-blue-500/20",
    showReceiptNote: true,
  },
  {
    page: 2,
    name: "ชุดที่ 2: ม่วง (สำเนา/ลูกค้า)",
    title: "ใบกำกับภาษี/ใบส่งสินค้า",
    subtitle: "สำเนา (สำหรับลูกค้า)",
    headerBg: "#e88ef5",
    tableHeaderBg: "#f2befa",
    summaryBg: "#e88ef5",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    badgeActiveBg: "bg-purple-500 text-white shadow-purple-500/20",
    showReceiptNote: true,
  },
  {
    page: 3,
    name: "ชุดที่ 3: ส้ม (สำเนา/วางบิล)",
    title: "ใบกำกับภาษี/ใบแจ้งหนี้",
    subtitle: "สำเนา (สำหรับวางบิล)",
    headerBg: "#ffa439",
    tableHeaderBg: "#ffd296",
    summaryBg: "#ffa439",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeActiveBg: "bg-amber-500 text-white shadow-amber-500/20",
    showReceiptNote: false,
  },
  {
    page: 4,
    name: "ชุดที่ 4: เหลือง (สำเนา/ฝ่ายบัญชี)",
    title: "ใบกำกับภาษี/ใบแจ้งหนี้",
    subtitle: "สำเนา (สำหรับฝ่ายบัญชี)",
    headerBg: "#fde047",
    tableHeaderBg: "#fef9c3",
    summaryBg: "#fde047",
    badgeBg: "bg-yellow-50 text-yellow-800 border-yellow-300",
    badgeActiveBg: "bg-yellow-500 text-slate-900 shadow-yellow-500/20",
    showReceiptNote: false,
  },
];

export interface InvoiceItem {
  STKCOD: string;
  STKDES: string;
  SEQNUM: string;
  TRNQTY: number;
  TQUCOD: string;
  UNITPR: number;
  DISC?: string;
  DISCAMT?: number;
  TRNVAL: number;
  VATCOD?: string;
}

export interface InvoiceData {
  invoice: {
    RECTYP?: string;
    DOCNUM: string;
    DOCDAT: string | null;
    CUSCOD: string;
    SONUM?: string;
    DEPCOD?: string;
    FLGVAT?: string;
    SLMCOD?: string;
    AREACOD?: string;
    YOUREF?: string;
    PAYTRM?: number;
    DUEDAT: string | null;
    BILNUM?: string;
    AMOUNT: number;
    DISCAMT: number;
    AFTDISC: number;
    ADVAMT?: number;
    VATAMT: number;
    NETAMT: number;
    TOTAL?: number;
    RCVAMT?: number;
    REMAMT?: number;
    VATRAT?: number;
    DOCSTAT?: string;
    BILLTO?: string;
    ORGNUM?: number;
  };
  customer?: {
    CUSNAM: string;
    PRENAM?: string;
    CUSNAM2?: string;
    ADDR01?: string;
    ADDR02?: string;
    ADDR03?: string;
    ZIPCOD?: string;
    TELNUM?: string;
    TAXID?: string;
    ORGNUM?: number;
  };
  items: InvoiceItem[];
  remarks?: { SEQNUM?: string; REMARK: string }[];
  company?: {
    THINAM?: string;
    ADDR01?: string;
    ADDR02?: string;
    TELNUM?: string;
    TAXID?: string;
    ORGNUM?: number;
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

function fmtThaiDateShort(d: Date | string | null): string {
  if (!d) return "-";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "-";
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const buddhistYear = dateObj.getFullYear() + 543;
  const yearShort = String(buddhistYear % 100).padStart(2, "0");
  return `${day}/${month}/${yearShort}`;
}

export function InvoiceSheet({
  data,
  config,
}: {
  data: InvoiceData;
  config: InvoicePageConfig;
}) {
  const { invoice, customer, items, company } = data;

  const grossAmount = invoice.AMOUNT || 0;
  const discountAmt = invoice.DISCAMT || 0;
  const afterDiscount = invoice.AFTDISC || grossAmount - discountAmt;
  const advanceDeposit = invoice.ADVAMT || 0;
  const afterDeposit = afterDiscount - advanceDeposit;
  const vatRate = invoice.VATRAT || 7;
  const vatAmount = invoice.VATAMT || 0;
  const netAmount = invoice.NETAMT || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-300 p-4 sm:p-6 md:p-8 text-slate-800 relative overflow-hidden text-xs print:p-0 print:border-none print:shadow-none">
      {/* Background Watermark */}
      <img
        src="/api/logo/watermark"
        alt="Watermark"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[460px] opacity-[0.11] pointer-events-none select-none z-0"
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
                {company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}
              </div>
              <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                {company?.ADDR01} {company?.ADDR02}
              </div>
              <div className="text-[11px] text-slate-600 leading-tight">
                {company?.TELNUM || "โทรศัพท์. 02-896-8068-9 แฟกซ์.02-896-8065"}
              </div>
              <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                เลขประจำตัวผู้เสียภาษี/ Tax ID{" "}
                <span className="font-mono font-bold text-slate-900">
                  {company?.TAXID || "0105558016255"}
                </span>{" "}
                &nbsp; สำนักงานใหญ่
              </div>
            </div>
          </div>

          {/* Document Title Badge (Colored Pill) */}
          <div className="w-full sm:w-auto text-center shrink-0">
            <div
              style={{ backgroundColor: config.headerBg }}
              className="border border-slate-800/30 rounded-xl px-5 py-2 shadow-sm inline-block w-full sm:w-auto min-w-[200px]"
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
              {customer?.ADDR01} {customer?.ADDR02} {customer?.ADDR03} {customer?.ZIPCOD}
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
                <span className="text-[9.5px] font-normal text-slate-500">SO No.</span>
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
          </div>
        </div>

        {/* Items Table Box */}
        <div className="border border-slate-700 rounded-t-lg overflow-x-auto bg-white/70">
          <table className="w-full text-xs border-collapse min-w-[560px]">
            <thead>
              <tr
                style={{ backgroundColor: config.tableHeaderBg }}
                className="border-b border-slate-700 text-slate-900 font-bold"
              >
                <th className="py-2 px-2 text-center w-12 border-r border-slate-700">
                  ลำดับ<br />
                  <span className="text-[9px] font-normal text-slate-600">No.</span>
                </th>
                <th className="py-2 px-3 text-left border-r border-slate-700">
                  รหัสสินค้า/รายละเอียด<br />
                  <span className="text-[9px] font-normal text-slate-600">
                    Code/ Descriptions
                  </span>
                </th>
                <th className="py-2 px-3 text-right w-28 border-r border-slate-700">
                  จำนวน<br />
                  <span className="text-[9px] font-normal text-slate-600">Quantity</span>
                </th>
                <th className="py-2 px-3 text-right w-24 border-r border-slate-700">
                  หน่วยละ<br />
                  <span className="text-[9px] font-normal text-slate-600">Unit Price</span>
                </th>
                <th className="py-2 px-3 text-right w-28">
                  จำนวนเงิน<br />
                  <span className="text-[9px] font-normal text-slate-600">Amount</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2 px-2 text-center font-mono text-slate-700 border-r border-slate-700">
                    {item.SEQNUM ? parseInt(item.SEQNUM, 10) : idx + 1}
                  </td>
                  <td className="py-2 px-3 text-left border-r border-slate-700">
                    {item.STKCOD && (
                      <span className="font-mono font-semibold text-slate-900">
                        {item.STKCOD}/{" "}
                      </span>
                    )}
                    <span className="text-slate-800 font-medium">{item.STKDES}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 border-r border-slate-700">
                    {item.TRNQTY.toFixed(2)} {item.TQUCOD || ""}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-800 border-r border-slate-700">
                    {fmtMoney(item.UNITPR)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
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
            {/* Left: Receipt Note & E.&O.E. (7 cols) */}
            <div className="p-3 md:col-span-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700 min-h-[90px]">
              <div className="text-[11px] text-slate-700 leading-relaxed font-normal">
                {config.showReceiptNote && (
                  <span>
                    ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์ต่อเมื่อมีลายเซ็นผู้รับมอบอำนาจและลายเซ็นผู้รับเงิน
                    และได้เรียกเก็บเงินตามเช็คเรียบร้อยแล้ว
                  </span>
                )}
              </div>
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

              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">
                  หักเงินมัดจำ{" "}
                  <span className="text-[9.5px] font-normal text-slate-500">
                    Less Deposit
                  </span>
                </span>
                <span className="font-mono text-slate-700">{fmtMoney(advanceDeposit)}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">
                  ยอดหลังหักเงินมัดจำ{" "}
                  <span className="text-[9.5px] font-normal text-slate-500">
                    After Deposit
                  </span>
                </span>
                <span className="font-mono text-slate-800">{fmtMoney(afterDeposit)}</span>
              </div>

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
                  <div className="border-b border-slate-700 flex-1 h-5"></div>
                  <div className="border-b border-slate-700 w-20 h-5"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                  <span>ผู้รับสินค้า/ Goods Received by</span>
                  <span className="w-20 text-center">วันที่/ Date</span>
                </div>
              </div>

              <div>
                <div className="flex items-end gap-2">
                  <div className="border-b border-slate-700 flex-1 h-5"></div>
                  <div className="border-b border-slate-700 w-20 h-5"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                  <span>ผู้ส่งสินค้า/ Delivery by</span>
                  <span className="w-20 text-center">วันที่/ Date</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Terms & Conditions (4 cols) */}
          <div className="p-3 md:col-span-4 border-b md:border-b-0 md:border-r border-slate-700 text-[9.5px] leading-relaxed text-slate-700 space-y-1">
            <div>o สินค้านี้ขายขาดไม่รับคืนหรือเปลี่ยน</div>
            <div>o บริษัทฯ จะนำใบแจ้งหนี้มาเรียกเก็บเงินในภายหลัง</div>
            <div>o บริษัทฯ จะคิดดอกเบี้ย 1.25% ต่อเดือน เมื่อชำระบิลเกินกำหนด</div>
            <div>
              o กรุณาชำระเงินด้วยเช็ค ในนามบริษัท ธงธัญ 99 จำกัด ขีดผู้ถือและขีดคล่อมเท่านั้น
            </div>
          </div>

          {/* Right: Authorized Signatures (4 cols) */}
          <div className="p-3 md:col-span-4 text-center flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[9.5px] text-slate-500">ในนาม</div>
              <div className="font-bold text-slate-900 text-xs">
                {company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="relative flex flex-col items-center">
                <div className="h-16 sm:h-20 flex items-end justify-center mb-[-10px] pointer-events-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/api/logo/signature"
                    alt="Authorized Signature"
                    className="h-16 sm:h-20 w-auto object-contain"
                  />
                </div>
                <div className="border-b border-slate-700 w-4/5 mx-auto"></div>
                <div className="text-[9px] text-slate-600 mt-1">
                  ผู้รับมอบอำนาจ/ Authorized Signature
                </div>
              </div>

              <div>
                <div className="border-b border-slate-700 w-4/5 mx-auto h-5"></div>
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

