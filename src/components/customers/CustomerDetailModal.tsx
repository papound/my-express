"use client";

import { useEffect } from "react";
import {
  X,
  Building,
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export interface CustomerDetail {
  CUSCOD: string;
  PRENAM: string;
  CUSNAM: string;
  CUSNAM2?: string;
  TELNUM: string;
  TAXID: string;
  ORGNUM?: number;
  CONTACT?: string;
  ADDR01?: string;
  ADDR02?: string;
  ADDR03?: string;
  ZIPCOD?: string;
  PAYTRM: number;
  PAYCOND?: string;
  BALANCE: number;
  CRLINE?: number;
  STATUS: string;
  statusType?: "A" | "UNSPECIFIED" | "I";
  isActive?: boolean;
  statusLabel?: string;
  SLMCOD?: string;
  AREACOD?: string;
  REMARK?: string;
  lastInvoiceDate?: string | null;
  lastInvoiceDocnum?: string | null;
  lastInvoiceAmount?: number | null;
}

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CustomerDetailModal({
  customer,
  onClose,
  onViewInvoice,
}: {
  customer: CustomerDetail | null;
  onClose: () => void;
  onViewInvoice?: (docnum: string) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (customer) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customer, onClose]);

  if (!customer) return null;

  const fullAddress = [
    customer.ADDR01,
    customer.ADDR02,
    customer.ADDR03,
    customer.ZIPCOD,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Building size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/10 text-blue-200 font-bold border border-white/10">
                  {customer.CUSCOD}
                </span>
                {customer.statusType === "A" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Active
                  </span>
                ) : customer.statusType === "UNSPECIFIED" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    ไม่ได้ระบุ (Active)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/20 text-slate-300 border border-slate-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    ยกเลิก (Inactive)
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white mt-1 leading-snug">
                {customer.PRENAM} {customer.CUSNAM}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Latest Bill Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <FileText size={18} />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                  บิลล่าสุดที่เปิดกับบริษัท
                </div>
                {customer.lastInvoiceDate ? (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-slate-900">
                      {new Date(customer.lastInvoiceDate).toLocaleDateString(
                        "th-TH",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>
                    {customer.lastInvoiceDocnum && (
                      <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-xs">
                        {customer.lastInvoiceDocnum}
                      </span>
                    )}
                    {customer.lastInvoiceAmount !== null &&
                      customer.lastInvoiceAmount !== undefined && (
                        <span className="text-xs font-semibold text-slate-600">
                          (฿{fmtMoney(customer.lastInvoiceAmount)})
                        </span>
                      )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mt-0.5">
                    ไม่มีประวัติบิลในระบบ
                  </div>
                )}
              </div>
            </div>

            {customer.lastInvoiceDocnum && onViewInvoice && (
              <button
                type="button"
                onClick={() => onViewInvoice(customer.lastInvoiceDocnum!)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition self-start sm:self-auto cursor-pointer"
              >
                <span>เปิดดูบิลล่าสุด</span>
                <ExternalLink size={13} />
              </button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tax & Contact Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-600" />
                <span>ข้อมูลนิติบุคคลและการติดต่อ</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">เลขประจำตัวผู้เสียภาษี</span>
                  <span className="font-mono font-bold text-slate-800">
                    {customer.TAXID || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">สาขา</span>
                  <span className="font-semibold text-slate-800">
                    {customer.ORGNUM === 0 || !customer.ORGNUM
                      ? "สำนักงานใหญ่ (00000)"
                      : `สาขาที่ ${customer.ORGNUM}`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">ผู้ติดต่อ</span>
                  <span className="font-semibold text-slate-800">
                    {customer.CONTACT || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">เบอร์โทรศัพท์</span>
                  <span className="font-semibold text-slate-800">
                    {customer.TELNUM || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial & Terms Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard size={14} className="text-blue-600" />
                <span>เงื่อนไขการเงินและการค้า</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">เครดิตเทอม</span>
                  <span className="font-semibold text-slate-800">
                    {customer.PAYTRM > 0
                      ? `${customer.PAYTRM} วัน`
                      : "เงินสด (Cash)"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">วงเงินเครดิต</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {customer.CRLINE ? `฿${fmtMoney(customer.CRLINE)}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">ยอดหนี้ค้างชำระ</span>
                  <span
                    className={`font-mono font-bold ${
                      customer.BALANCE > 0 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    ฿{fmtMoney(customer.BALANCE || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">พนักงานขาย / เขต</span>
                  <span className="font-semibold text-slate-800">
                    {[customer.SLMCOD, customer.AREACOD]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Address Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-500" />
              <span>ที่อยู่จดทะเบียน</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {fullAddress || "-"}
            </p>
          </div>

          {customer.REMARK && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
              <span className="font-bold">หมายเหตุ:</span> {customer.REMARK}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
