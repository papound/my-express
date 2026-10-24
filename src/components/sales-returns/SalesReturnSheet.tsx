"use client";

import React from "react";
import { bahtText } from "@/lib/baht-text";

export interface SalesReturnItem {
  STKCOD: string;
  STKDES: string;
  SEQNUM: string;
  TRNQTY: number;
  TQUCOD: string;
  UNITPR: number;
  DISC?: string;
  DISCAMT?: number;
  TRNVAL: number;
  LOCCOD?: string;
  RETSTK?: string;
}

export interface SalesReturnData {
  invoice: {
    RECTYP?: string;
    DOCNUM: string;
    DOCDAT: string | null;
    CUSCOD: string;
    SONUM?: string;
    SODAT?: string | null;
    DEPCOD?: string;
    SLMCOD?: string;
    AREACOD?: string;
    YOUREF?: string;
    PAYTRM?: number;
    AMOUNT: number;
    DISCAMT: number;
    AFTDISC: number;
    ADVAMT?: number;
    VATAMT: number;
    NETAMT: number;
    IVCAMT?: number;
    VATRAT?: number;
    DOCSTAT?: string;
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
  items: SalesReturnItem[];
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

export function SalesReturnSheet({ data }: { data: SalesReturnData }) {
  const { invoice, customer, items, remarks, company } = data;

  const grossAmount = invoice.AMOUNT || 0;
  const discountAmt = invoice.DISCAMT || 0;
  const afterDiscount = invoice.AFTDISC || grossAmount - discountAmt;
  const vatRate = invoice.VATRAT || 7;
  const vatAmount = invoice.VATAMT || 0;
  const netAmount = invoice.NETAMT || 0;
  const origInvoiceVal = invoice.IVCAMT || afterDiscount;
  const correctVal = 0;
  const diffVal = origInvoiceVal - correctVal;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-300 p-4 sm:p-6 md:p-8 text-slate-800 relative overflow-hidden text-xs print:p-0 print:border-none print:shadow-none">
      {/* Background Watermark */}
      <img
        src="/api/logo/watermark"
        alt="Watermark"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[460px] opacity-[0.22] pointer-events-none select-none z-0"
      />

      <div className="relative z-10 space-y-3 sm:space-y-4">
        {/* Header Row */}
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
                เลขประจำตัวผู้เสียภาษี{" "}
                <span className="font-mono font-bold text-slate-900">
                  {company?.TAXID || "0105558016255"}
                </span>
              </div>
            </div>
          </div>

          {/* Document Title on Right */}
          <div className="w-full sm:w-auto text-left sm:text-right shrink-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-wide">
              ใบลดหนี้/ รับคืนสินค้า
            </h1>
          </div>
        </div>

        {/* Customer & Document Information Box */}
        <div className="border border-slate-700 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-white/70">
          {/* Left: Customer Info (7 cols) */}
          <div className="p-2.5 sm:p-3 md:col-span-7 space-y-1 border-b md:border-b-0 md:border-r border-slate-700">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-900 w-16 shrink-0 leading-tight">
                ลูกค้า
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
            <div className="flex items-baseline gap-2 pt-1">
              <span className="font-semibold text-slate-900 w-16 shrink-0 leading-tight">
                อ้างอิง
              </span>
              <span className="text-slate-800 text-[11px]">
                {invoice.YOUREF || "-"}
              </span>
            </div>
          </div>

          {/* Right: Document Details (5 cols) */}
          <div className="p-2.5 sm:p-3 md:col-span-5 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                เลขที่ใบลดหนี้
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {invoice.DOCNUM}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                วันที่
              </span>
              <span className="font-semibold text-slate-800">
                {fmtThaiDateShort(invoice.DOCDAT)}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                อ้างถึงใบกำกับภาษี
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {invoice.SONUM || "-"}{" "}
                {invoice.SODAT ? fmtThaiDateShort(invoice.SODAT) : ""}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                พนักงานขาย
              </span>
              <span className="text-slate-800">{invoice.SLMCOD || "-"}</span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                เขตการขาย
              </span>
              <span className="text-slate-800">{invoice.AREACOD || "-"}</span>
            </div>
          </div>
        </div>

        {/* Notice line */}
        <div className="text-[11.5px] font-medium text-slate-800 pt-0.5">
          บริษัทได้รับคืนสินค้าและเครดิตบัญชีของท่านตามรายการต่อไปนี้ :-
        </div>

        {/* Items Table Box */}
        <div className="border border-slate-700 rounded-t-lg overflow-x-auto bg-white/70">
          <table className="w-full text-xs border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-900 font-bold bg-slate-50/50">
                <th className="py-2 px-2 text-center w-12 border-r border-slate-700">
                  No.
                </th>
                <th className="py-2 px-3 text-left border-r border-slate-700">
                  รหัสสินค้า/รายละเอียด
                </th>
                <th className="py-2 px-2 text-center w-14 border-r border-slate-700">
                  คลัง
                </th>
                <th className="py-2 px-2 text-center w-16 border-r border-slate-700">
                  รับคืน?
                </th>
                <th className="py-2 px-3 text-right w-24 border-r border-slate-700">
                  จำนวน
                </th>
                <th className="py-2 px-3 text-right w-24 border-r border-slate-700">
                  หน่วยละ
                </th>
                <th className="py-2 px-3 text-right w-20 border-r border-slate-700">
                  ส่วนลด
                </th>
                <th className="py-2 px-3 text-right w-28">
                  จำนวนเงิน
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
                    <span className="font-mono font-medium text-slate-900">
                      {item.STKCOD}
                    </span>{" "}
                    <span className="text-slate-800">{item.STKDES}</span>
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-700 border-r border-slate-700">
                    {item.LOCCOD || "-"}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-semibold text-slate-800 border-r border-slate-700">
                    {item.RETSTK || "Y"}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 border-r border-slate-700">
                    {item.TRNQTY.toFixed(2)} {item.TQUCOD || ""}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-800 border-r border-slate-700">
                    {item.UNITPR.toFixed(4)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600 border-r border-slate-700">
                    {item.DISC || (item.DISCAMT ? fmtMoney(item.DISCAMT) : "-")}
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
            {/* Left: Remarks & Reason (6 cols) */}
            <div className="p-3 md:col-span-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700 min-h-[100px]">
              <div>
                <span className="font-semibold text-slate-900">
                  สาเหตุที่รับคืน:
                </span>
                <div className="mt-1 text-slate-700 space-y-0.5">
                  {remarks && remarks.length > 0 ? (
                    remarks.map((r, i) => <div key={i}>{r.REMARK}</div>)
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Calculations Breakdown (6 cols) */}
            <div className="p-2.5 sm:p-3 md:col-span-6 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-800">รวม</span>
                <span className="font-mono font-semibold text-slate-900">
                  {fmtMoney(grossAmount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-800">
                  หักส่วนลด {discountAmt > 0 ? fmtMoney(discountAmt) : ""}
                </span>
                <span className="font-mono text-slate-800">
                  {fmtMoney(discountAmt)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-800">จำนวนเงินหลังหักส่วนลด</span>
                <span className="font-mono font-semibold text-slate-900">
                  {fmtMoney(afterDiscount)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-1 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-800">
                    มูลค่าของสินค้าหรือบริการตามใบกำกับภาษีเดิม
                  </span>
                  <span className="font-mono text-slate-800">
                    {fmtMoney(origInvoiceVal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-800">
                    มูลค่าของสินค้าหรือบริการที่ถูกต้อง
                  </span>
                  <span className="font-mono text-slate-800">
                    {fmtMoney(correctVal)}
                  </span>
                </div>

                <div className="flex justify-between font-medium">
                  <span className="text-slate-800">ผลต่าง</span>
                  <span className="font-mono text-slate-900">
                    {fmtMoney(diffVal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-800">
                    จำนวนภาษีมูลค่าเพิ่ม {vatRate.toFixed(2)} %
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {fmtMoney(vatAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Bar */}
          <div className="border-t border-slate-700 grid grid-cols-1 md:grid-cols-12 items-center bg-slate-50/70">
            <div className="p-2.5 sm:p-3 md:col-span-7 font-bold text-slate-950 text-xs sm:text-sm border-b md:border-b-0 md:border-r border-slate-700">
              ({bahtText(netAmount)}).
            </div>
            <div className="p-2.5 sm:p-3 md:col-span-5 flex justify-between items-center">
              <span className="font-bold text-xs sm:text-sm text-slate-950">
                จำนวนเงินรวมทั้งสิ้น
              </span>
              <span className="font-mono font-extrabold text-sm sm:text-base text-slate-950">
                ฿{fmtMoney(netAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Signatures Box */}
        <div className="border border-slate-700 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-white/80 text-[10.5px]">
          {/* Left: Goods & Warehouse Received (8 cols) */}
          <div className="p-3 sm:p-4 md:col-span-8 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>ได้รับสินค้าข้างต้นคืนเรียบร้อยแล้ว</div>
              <div>ได้เก็บสินค้าข้างต้นในคลังสินค้าแล้ว</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center pt-3">
              <div>
                <div className="border-b border-slate-700 w-4/5 mx-auto h-4"></div>
                <div className="mt-1 text-[9.5px] text-slate-600">
                  แผนกรับสินค้า
                </div>
              </div>
              <div>
                <div className="border-b border-slate-700 w-4/5 mx-auto h-4"></div>
                <div className="mt-1 text-[9.5px] text-slate-600">
                  แผนกคลังสินค้า
                </div>
              </div>
            </div>
          </div>

          {/* Right: Authorized Signature (4 cols) */}
          <div className="p-3 sm:p-4 md:col-span-4 text-center flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[9.5px] text-slate-500">ในนาม</div>
              <div className="font-bold text-slate-900 text-xs">
                {company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}
              </div>
            </div>

            <div className="pt-1">
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
                <div className="mt-1 text-[9.5px] text-slate-600">
                  ผู้รับมอบอำนาจ
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

