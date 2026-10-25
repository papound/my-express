"use client";

import React from "react";
import { Eye } from "lucide-react";
import { bahtText } from "@/lib/baht-text";
import { useSignatureVersion } from "@/hooks/useSignatureVersion";

export interface BillingPageConfig {
  page: number;
  name: string;
  title: string;
  subtitle: string;
  badgeBg: string;
  badgeActiveBg: string;
}

export const BILLING_PAGES_CONFIG: BillingPageConfig[] = [
  {
    page: 1,
    name: "ชุดที่ 1: ต้นฉบับ (สำหรับลูกค้า)",
    title: "ใบวางบิล",
    subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeActiveBg: "bg-blue-600 text-white shadow-blue-500/20",
  },
  {
    page: 2,
    name: "ชุดที่ 2: สำเนา (สำหรับฝ่ายการเงิน)",
    title: "ใบวางบิล",
    subtitle: "สำเนา (สำหรับฝ่ายการเงิน)",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-300",
    badgeActiveBg: "bg-slate-700 text-white shadow-slate-700/20",
  },
];

export interface BillingInvoiceItem {
  DOCNUM: string;
  DOCDAT: string | Date | null;
  DUEDAT?: string | Date | null;
  RECTYP?: string;
  AMOUNT?: number;
  VATAMT?: number;
  NETAMT: number;
  RCVAMT?: number;
  REMAMT?: number;
}

export interface BillingData {
  billing: {
    BILNUM: string;
    BILDAT: string | Date | null;
    CUSCOD: string;
    BILOUT?: string | Date | null;
    APPDAT?: string | Date | null;
    PAYCOND?: string;
    REMARK?: string;
    NETAMT: number;
    DOCSTAT?: string;
    USERID?: string;
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
  invoices: BillingInvoiceItem[];
  remarks?: { SEQNUM?: string; REMARK: string }[];
  company?: {
    THINAM?: string;
    ADDR01?: string;
    ADDR02?: string;
    TELNUM?: string;
    TAXID?: string;
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

export function BillingSheet({
  data,
  config,
  onViewInvoice,
}: {
  data: BillingData;
  config: BillingPageConfig;
  onViewInvoice?: (docnum: string) => void;
}) {
  const sigVersion = useSignatureVersion();
  const { billing, customer, invoices, remarks, company } = data;
  const totalAmount = billing.NETAMT || 0;

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
            </div>
          </div>

          {/* Document Title Badge (Colored Pill + Subtitle) */}
          <div className="w-full sm:w-auto text-left sm:text-right shrink-0">
            <div className="inline-flex items-center gap-2.5">
              <span
                style={{ backgroundColor: "#a6caf0" }}
                className="border border-slate-700/40 rounded-lg px-4 py-1.5 text-sm sm:text-base font-bold text-slate-950 shadow-sm"
              >
                {config.title}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {config.subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Billing Details Box */}
        <div className="border border-slate-700 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-white/70">
          {/* Left: Customer Info (7 cols) */}
          <div className="p-2.5 sm:p-3 md:col-span-7 space-y-1 border-b md:border-b-0 md:border-r border-slate-700">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-900 w-16 shrink-0 leading-tight">
                ลูกค้า
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                {billing.CUSCOD}
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
                หมายเหตุ
              </span>
              <span className="text-slate-800 text-[11px]">
                {billing.REMARK || "-"}
              </span>
            </div>
          </div>

          {/* Right: Billing Attributes (5 cols) */}
          <div className="p-2.5 sm:p-3 md:col-span-5 space-y-2 text-[11px]">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                เลขที่ใบวางบิล
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {billing.BILNUM}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                วันที่
              </span>
              <span className="font-semibold text-slate-800">
                {fmtThaiDateShort(billing.BILDAT)}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 leading-tight">
                เงื่อนไขการชำระเงิน
              </span>
              <span className="font-semibold text-slate-800">
                {billing.PAYCOND || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table Box */}
        <div className="border border-slate-700 rounded-t-lg overflow-x-auto bg-white/70">
          <table className="w-full text-xs border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-900 font-bold bg-slate-50/50">
                <th className="py-2 px-2 text-center w-12 border-r border-slate-700">
                  No.
                </th>
                <th className="py-2 px-3 text-left border-r border-slate-700">
                  เลขที่ใบกำกับ
                </th>
                <th className="py-2 px-3 text-center w-24 border-r border-slate-700">
                  วันที่
                </th>
                <th className="py-2 px-3 text-center w-24 border-r border-slate-700">
                  ครบกำหนด
                </th>
                <th className="py-2 px-3 text-right w-28 border-r border-slate-700">
                  จำนวนเงิน
                </th>
                <th className="py-2 px-3 text-right w-24 border-r border-slate-700">
                  ชำระแล้ว
                </th>
                <th className="py-2 px-3 text-right w-28">
                  เงินคงค้าง
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2 px-2 text-center font-mono text-slate-700 border-r border-slate-700">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 text-left border-r border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">
                        {inv.DOCNUM}
                      </span>
                      {onViewInvoice && (
                        <button
                          type="button"
                          onClick={() => onViewInvoice(inv.DOCNUM)}
                          className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition print:hidden"
                          title={`ดูใบกำกับภาษี ${inv.DOCNUM}`}
                        >
                          <Eye size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center text-slate-800 border-r border-slate-700">
                    {fmtThaiDateShort(inv.DOCDAT)}
                  </td>
                  <td className="py-2 px-3 text-center text-slate-800 border-r border-slate-700">
                    {fmtThaiDateShort(inv.DUEDAT)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-800 border-r border-slate-700">
                    {fmtMoney(inv.NETAMT || inv.AMOUNT)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600 border-r border-slate-700">
                    {inv.RCVAMT && inv.RCVAMT > 0 ? fmtMoney(inv.RCVAMT) : ""}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {fmtMoney(inv.REMAMT !== undefined ? inv.REMAMT : inv.NETAMT)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Summary Row Box */}
        <div className="border border-slate-700 border-t-0 rounded-b-lg overflow-hidden bg-white/80 -mt-3 sm:-mt-4 grid grid-cols-1 md:grid-cols-12 items-center text-xs">
          <div className="p-2.5 sm:p-3 md:col-span-7 font-bold text-slate-950 text-xs sm:text-sm border-b md:border-b-0 md:border-r border-slate-700">
            ({bahtText(totalAmount)}).
          </div>
          <div className="p-2.5 sm:p-3 md:col-span-5 flex justify-between items-center">
            <span className="font-bold text-xs sm:text-sm text-slate-950">
              รวมเงินทั้งสิ้น
            </span>
            <span className="font-mono font-extrabold text-sm sm:text-base text-slate-950">
              {fmtMoney(totalAmount)}
            </span>
          </div>
        </div>

        {/* Remarks Section (Bank Accounts / Terms) */}
        <div className="pt-2 pb-1 px-1 text-[11px] leading-relaxed text-slate-700">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 shrink-0">
              หมายเหตุ
            </span>
            <div className="space-y-0.5">
              {remarks && remarks.length > 0 ? (
                remarks.map((r, i) => (
                  <div key={i} className="text-slate-800">
                    {r.REMARK}
                  </div>
                ))
              ) : billing.REMARK ? (
                <div className="text-slate-800">{billing.REMARK}</div>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Signatures Box */}
        <div className="border border-slate-700 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-white/80 text-[10.5px]">
          {/* Left: Receiver (6 cols) */}
          <div className="p-3 sm:p-4 md:col-span-6 border-b md:border-b-0 md:border-r border-slate-700 space-y-3">
            <div>
              ชื่อผู้รับวางบิล &nbsp; ____________________
            </div>
            <div>
              วันที่รับ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ___/___/___
            </div>
            <div>
              วันที่นัดรับเช็ค &nbsp; ___/___/___
            </div>
          </div>

          {/* Right: Issuer (6 cols) */}
          <div className="p-3 sm:p-4 md:col-span-6 flex flex-col justify-between">
            <div>
              ในนาม &nbsp;{" "}
              <strong className="text-slate-900 font-bold">
                {company?.THINAM || ""}
              </strong>
            </div>
            <div className="pt-2 text-center">
              <div className="h-12 sm:h-14 flex items-end justify-center -mb-0.5 pointer-events-none">
                <img
                  src={`/api/logo/signature?role=billing&v=${sigVersion}`}
                  alt="ลายเซ็นผู้วางบิล"
                  className="h-12 sm:h-14 w-auto object-contain object-bottom"
                />
              </div>
              <div className="w-56 border-b border-slate-700/80 mx-auto mb-1"></div>
              <div className="text-[11px] text-slate-700">
                ชื่อผู้วางบิล
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

