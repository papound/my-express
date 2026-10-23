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
  ORDQTY: number;
  REMQTY: number;
  TQUCOD: string;
  UNITPR: number;
  DISC: string;
  DISCAMT: number;
  TRNVAL: number;
}

interface QuotationDetailResponse {
  quotation: {
    SONUM: string;
    SODAT: string | null;
    CUSCOD: string;
    SLMCOD: string;
    YOUREF: string;
    PAYTRM: number;
    DLVDAT: string | null;
    AMOUNT: number;
    DISC: string;
    DISCAMT: number;
    VATAMT: number;
    NETAMT: number;
    TOTAL: number;
    VATRAT: number;
    DOCSTAT: string;
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
  items: Item[];
  remarks?: { SEQNUM: string; REMARK: string }[];
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
    label: "เปิดเสนอราคา",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  "0": {
    label: "เปิดเสนอราคา",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  F: {
    label: "สำเร็จ (เสร็จสิ้น)",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  C: {
    label: "ยกเลิก",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
};

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtThaiDateShort(d: string | null) {
  if (!d) return "-";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return "-";
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const buddhistYear = dateObj.getFullYear() + 543;
  const yearShort = String(buddhistYear % 100).padStart(2, "0");
  return `${day}/${month}/${yearShort}`;
}

export default function QuotationDetailPage({
  params,
}: {
  params: Promise<{ sonum: string }>;
}) {
  const { sonum } = use(params);
  const [data, setData] = useState<QuotationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/quotations/${encodeURIComponent(sonum)}`);
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
  }, [sonum]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="animate-spin inline-block mr-2" size={20} />
          กำลังโหลดรายละเอียดใบเสนอราคา...
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="p-8 max-w-4xl mx-auto">
          <Link
            href="/quotations"
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

  const { quotation, customer, items, remarks, company } = data;

  const statusCfg = STATUS_CONFIG[quotation.DOCSTAT] || {
    label: quotation.DOCSTAT,
    badgeClass: "bg-slate-100 text-slate-700",
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href="/quotations"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} /> กลับหน้ารายการ
          </Link>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block px-3 py-1 font-bold text-xs rounded-lg border ${statusCfg.badgeClass}`}
            >
              {statusCfg.label}
            </span>
            <a
              href={`/api/pdf/quotation/${encodeURIComponent(quotation.SONUM)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition w-full sm:w-auto"
            >
              <Printer size={16} /> พิมพ์ / ดาวน์โหลด PDF (Quotation)
            </a>
          </div>
        </div>

        {/* Paper Container - Formatted exactly like Express Quotation */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-10 font-sans text-slate-900 relative overflow-hidden max-w-[850px] mx-auto">
          {/* Header with circular logo and company text */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <img
                src="/api/logo"
                alt="Logo"
                className="h-14 w-14 sm:h-16 sm:w-16 object-contain shrink-0"
              />
              <div className="space-y-0.5 text-xs text-slate-800">
                <h1 className="text-base sm:text-lg font-bold text-slate-950">
                  {company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}
                </h1>
                <p className="text-[11.5px] sm:text-xs text-slate-700 leading-tight">
                  {company?.ADDR01} {company?.ADDR02}
                </p>
                <p className="text-[11.5px] sm:text-xs text-slate-700">
                  {company?.TELNUM || "โทรศัพท์. 02-896-8068-9 แฟกซ์. 02-896-8065"}
                </p>
              </div>
            </div>
          </div>

          {/* Quotation Title */}
          <div className="text-right -mt-2 sm:-mt-4 mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 tracking-wide">
              ใบเสนอราคา
            </h2>
          </div>

          {/* Top Customer & Quotation Info Box */}
          <div className="border border-slate-400 rounded-xl overflow-hidden mb-3 text-xs text-slate-900 grid grid-cols-1 md:grid-cols-2">
            {/* Left Column: ถึง */}
            <div className="p-3 space-y-1 md:border-r border-slate-400 flex flex-col justify-between">
              <div>
                <div className="font-semibold text-slate-900 mb-0.5">ถึง</div>
                <div className="font-medium text-slate-900">
                  {customer?.PRENAM ? customer.PRENAM + " " : ""}
                  {customer?.CUSNAM || "-"}
                </div>
                <div className="text-slate-700 leading-relaxed text-[11.5px] mt-0.5">
                  {customer?.ADDR01} {customer?.ADDR02}
                </div>
              </div>
              <div className="pt-2 space-y-0.5 text-[11.5px]">
                <div>โทร. {customer?.TELNUM || "-"}</div>
                <div>อ้างอิง {quotation.YOUREF || ""}</div>
              </div>
            </div>

            {/* Right Column: Quotation details */}
            <div className="p-3 text-xs space-y-2 flex flex-col justify-between border-t md:border-t-0 border-slate-400">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-slate-800">เลขที่ใบเสนอราคา</span>
                <span className="font-mono font-bold text-sm text-slate-950">
                  {quotation.SONUM}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-slate-800">วันที่</span>
                <span className="font-medium text-slate-900">
                  {fmtThaiDateShort(quotation.SODAT)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11.5px]">
                <div>
                  <span className="font-semibold text-slate-800">ยืนราคา</span>
                  <span className="font-semibold px-2">0</span>
                  <span>วัน</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">ถึงวันที่ </span>
                  <span className="font-medium">
                    {quotation.DLVDAT ? fmtThaiDateShort(quotation.DLVDAT) : ""}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-slate-800">เงื่อนไขชำระเงิน</span>
                <span className="font-medium text-slate-900">
                  {quotation.PAYTRM > 0 ? `เครดิต ${quotation.PAYTRM} วัน` : "เงินสด"}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-heading */}
          <div className="text-xs text-slate-800 mb-2 font-medium">
            บริษัทฯ มีความยินดีที่จะเสนอราคาสินค้าดังต่อไปนี้ :
          </div>

          {/* Items Table with Watermark */}
          <div className="border border-slate-400 rounded-xl overflow-hidden relative">
            {/* Background Watermark inside table area */}
            <img
              src="/api/logo/watermark"
              alt="Watermark"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] opacity-[0.14] pointer-events-none select-none z-0"
            />

            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-xs border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-50/70 font-semibold text-slate-900 text-center">
                    <th className="py-2 px-2 border-r border-slate-400 w-10">No.</th>
                    <th className="py-2 px-3 border-r border-slate-400 text-left">
                      รหัสสินค้า/รายละเอียด
                    </th>
                    <th className="py-2 px-3 border-r border-slate-400 text-right w-24">
                      จำนวน
                    </th>
                    <th className="py-2 px-3 border-r border-slate-400 text-right w-20">
                      หน่วยละ
                    </th>
                    <th className="py-2 px-3 border-r border-slate-400 text-right w-20">
                      ส่วนลด
                    </th>
                    <th className="py-2 px-3 text-right w-28">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-200/80 hover:bg-slate-50/30">
                      <td className="py-1.5 px-2 text-center border-r border-slate-400 font-mono text-[11px] text-slate-700">
                        {it.SEQNUM ? parseInt(it.SEQNUM, 10) : idx + 1}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-400 text-slate-900 text-[11.5px]">
                        {it.STKDES || it.STKCOD}
                      </td>
                      <td className="py-1.5 px-3 text-right border-r border-slate-400 font-mono text-[11.5px]">
                        {it.ORDQTY.toFixed(2)} {it.TQUCOD || ""}
                      </td>
                      <td className="py-1.5 px-3 text-right border-r border-slate-400 font-mono text-[11.5px]">
                        {fmtMoney(it.UNITPR)}
                      </td>
                      <td className="py-1.5 px-3 text-right border-r border-slate-400 font-mono text-[11.5px]">
                        {it.DISC || (it.DISCAMT > 0 ? fmtMoney(it.DISCAMT) : "")}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-[11.5px] font-semibold text-slate-950">
                        {fmtMoney(it.TRNVAL)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Integrated Footer Summary */}
                <tfoot className="border-t border-slate-400 bg-white/95 text-xs">
                  {/* Row 1: รวมเป็นเงิน */}
                  <tr className="border-b border-slate-300">
                    <td colSpan={4} className="border-r border-slate-400"></td>
                    <td className="py-1 px-3 text-right font-medium border-r border-slate-400 whitespace-nowrap">
                      รวมเป็นเงิน
                    </td>
                    <td className="py-1 px-3 text-right font-mono font-medium text-slate-900">
                      {fmtMoney(quotation.AMOUNT)}
                    </td>
                  </tr>

                  {/* Row 2: หัก ส่วนลด */}
                  <tr className="border-b border-slate-300">
                    <td colSpan={4} className="border-r border-slate-400"></td>
                    <td className="py-1 px-3 text-right font-medium border-r border-slate-400 whitespace-nowrap">
                      หัก ส่วนลด
                      {quotation.DISC ? (
                        <span className="font-mono text-[11px] ml-1.5 text-slate-700">
                          {quotation.DISC.trim()}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-1 px-3 text-right font-mono font-medium text-slate-900">
                      {quotation.DISCAMT > 0 ? fmtMoney(quotation.DISCAMT) : ""}
                    </td>
                  </tr>

                  {/* Row 3: จำนวนเงินหลังหักส่วนลด */}
                  <tr className="border-b border-slate-300">
                    <td colSpan={4} className="border-r border-slate-400"></td>
                    <td className="py-1 px-3 text-right font-medium border-r border-slate-400 whitespace-nowrap">
                      จำนวนเงินหลังหักส่วนลด
                    </td>
                    <td className="py-1 px-3 text-right font-mono font-medium text-slate-900">
                      {fmtMoney(quotation.TOTAL || quotation.AMOUNT - quotation.DISCAMT)}
                    </td>
                  </tr>

                  {/* Row 4: จำนวนภาษีมูลค่าเพิ่ม */}
                  <tr className="border-b border-slate-300">
                    <td colSpan={4} className="border-r border-slate-400"></td>
                    <td className="py-1 px-3 text-right font-medium border-r border-slate-400 whitespace-nowrap">
                      จำนวนภาษีมูลค่าเพิ่ม {quotation.VATRAT || 7}.00 %
                    </td>
                    <td className="py-1 px-3 text-right font-mono font-medium text-slate-900">
                      {fmtMoney(quotation.VATAMT)}
                    </td>
                  </tr>

                  {/* Row 5: ตัวอักษร on left & จำนวนเงินรวมทั้งสิ้น on right */}
                  <tr>
                    <td
                      colSpan={4}
                      className="py-2 px-3 border-r border-slate-400 text-left font-medium text-slate-800 text-[11.5px]"
                    >
                      ตัวอักษร: ({bahtText(quotation.NETAMT)})
                    </td>
                    <td className="py-2 px-3 text-right font-bold border-r border-slate-400 whitespace-nowrap text-slate-950">
                      จำนวนเงินรวมทั้งสิ้น
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-950 text-sm">
                      {fmtMoney(quotation.NETAMT)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Remarks & Signatures Bottom Box */}
          <div className="border border-slate-400 rounded-xl p-4 mt-3 text-xs grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left side: หมายเหตุ */}
            <div className="md:col-span-6 space-y-1.5 text-slate-800 text-[11.5px]">
              <div className="font-semibold text-slate-950">
                หมายเหตุ:
              </div>
              {remarks && remarks.length > 0 ? (
                <div className="space-y-0.5">
                  {remarks.map((r, i) => (
                    <div key={i} className="text-slate-800">
                      {r.REMARK}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 italic">- ไม่มีหมายเหตุ -</div>
              )}
            </div>

            {/* Right side: ขอแสดงความนับถือ & 3 Signatures */}
            <div className="md:col-span-6 flex flex-col justify-between">
              <div className="text-right text-xs font-semibold text-slate-800 mb-6">
                ขอแสดงความนับถือ
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-800">
                <div>
                  <div className="border-b border-slate-400 mb-1 mx-2"></div>
                  <div>ผู้ตรวจสอบ</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-1 mx-2"></div>
                  <div>ผู้รับทราบ</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-1 mx-2"></div>
                  <div>ผู้อนุมัติ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

