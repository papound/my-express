"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CustomerOption {
  CUSCOD: string;
  CUSNAM: string;
  TELNUM?: string;
}

interface ProductOption {
  STKCOD: string;
  STKDES: string;
  QUCOD?: string;
  SELLPR1: number;
}

interface LineItem {
  stkcod: string;
  stkdes: string;
  tqucod: string;
  ordqty: number;
  unitpr: number;
}

export interface QuotationFormInitialData {
  sonum: string;
  cuscod: string;
  cusnam: string;
  sodat: string;
  youref: string;
  items: LineItem[];
}

interface CreateQuotationModalProps {
  onClose: () => void;
  onCreated: (sonum: string) => void;
  initialData?: QuotationFormInitialData | null;
}

export function CreateQuotationModal({ onClose, onCreated, initialData }: CreateQuotationModalProps) {
  const isEdit = Boolean(initialData?.sonum);
  const [mounted, setMounted] = useState(false);
  const [cusSearch, setCusSearch] = useState("");
  const [cusOptions, setCusOptions] = useState<CustomerOption[]>([]);
  const [selectedCus, setSelectedCus] = useState<CustomerOption | null>(
    initialData ? { CUSCOD: initialData.cuscod, CUSNAM: initialData.cusnam } : null
  );

  const [prodSearch, setProdSearch] = useState("");
  const [prodOptions, setProdOptions] = useState<ProductOption[]>([]);

  const [sodat, setSodat] = useState(
    () => initialData?.sodat || new Date().toISOString().slice(0, 10)
  );
  const [youref, setYouref] = useState(initialData?.youref || "");
  const [items, setItems] = useState<LineItem[]>(initialData?.items || []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSonum, setCreatedSonum] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!cusSearch.trim() || selectedCus) {
      setCusOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(cusSearch)}&status=all&limit=8`);
        const json = await res.json();
        setCusOptions(json.data ?? []);
      } catch {
        setCusOptions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [cusSearch, selectedCus]);

  useEffect(() => {
    if (!prodSearch.trim()) {
      setProdOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/inventory?search=${encodeURIComponent(prodSearch)}&limit=8`);
        const json = await res.json();
        setProdOptions(json.data ?? []);
      } catch {
        setProdOptions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [prodSearch]);

  const addProduct = (p: ProductOption) => {
    setItems((prev) => [
      ...prev,
      {
        stkcod: p.STKCOD,
        stkdes: p.STKDES,
        tqucod: p.QUCOD || "ตั",
        ordqty: 1,
        unitpr: p.SELLPR1 || 0,
      },
    ]);
    setProdSearch("");
    setProdOptions([]);
  };

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, it) => sum + it.ordqty * it.unitpr, 0);
  const vatamt = Math.round(subtotal * 0.07 * 100) / 100;
  const netamt = Math.round((subtotal + vatamt) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedCus) {
      setError("กรุณาเลือกลูกค้า");
      return;
    }
    if (items.length === 0) {
      setError("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/quotations/${encodeURIComponent(initialData!.sonum)}`
        : "/api/quotations";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isEdit ? "update" : "create",
          cuscod: selectedCus.CUSCOD,
          sodat,
          youref,
          flgvat: "2",
          items: items.map((it) => ({
            stkcod: it.stkcod,
            stkdes: it.stkdes,
            tqucod: it.tqucod,
            ordqty: it.ordqty,
            unitpr: it.unitpr,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "ไม่สามารถบันทึกใบเสนอราคาได้");
        return;
      }
      setCreatedSonum(json.sonum);
      onCreated(json.sonum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4">
      <div className="my-auto w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEdit
                ? `แก้ไขใบเสนอราคา ${initialData!.sonum} (Sandbox: WriteTes)`
                : "สร้างใบเสนอราคาใหม่ (Sandbox: WriteTes)"}
            </h3>
            <p className="text-xs text-slate-500">
              ส่งผ่าน Jenkins (CT 121 → CT 114) → WIN-SERVER VFPOLEDB
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {createdSonum && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>
                  {isEdit ? "บันทึกการแก้ไข" : "สร้างใบเสนอราคา"} <strong>{createdSonum}</strong> ลง WriteTes สำเร็จแล้ว!
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          )}

          {/* Customer */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-semibold text-slate-700">
              ลูกค้า (ARMAS) <span className="text-rose-500">*</span>
            </label>
            {selectedCus ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <div>
                  <span className="font-bold text-blue-900">{selectedCus.CUSCOD}</span>{" "}
                  <span className="text-blue-800">{selectedCus.CUSNAM}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCus(null);
                    setCusSearch("");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  เปลี่ยน
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="พิมพ์รหัสหรือชื่อลูกค้า เช่น เดอะแบ็กยาร์ด..."
                    value={cusSearch}
                    onChange={(e) => setCusSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {cusOptions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                    {cusOptions.map((c) => (
                      <button
                        key={c.CUSCOD}
                        type="button"
                        onClick={() => {
                          setSelectedCus(c);
                          setCusOptions([]);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition flex items-center justify-between"
                      >
                        <span>
                          <strong className="text-slate-900">{c.CUSCOD}</strong> — {c.CUSNAM}
                        </span>
                        <span className="text-slate-400">{c.TELNUM}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่เอกสาร</label>
              <input
                type="date"
                value={sodat}
                onChange={(e) => setSodat(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">อ้างอิง (YOUREF)</label>
              <input
                type="text"
                placeholder="เช่น PO / หมายเหตุอ้างอิง"
                value={youref}
                onChange={(e) => setYouref(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Product Search */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-semibold text-slate-700">
              เพิ่มสินค้า (STMAS) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="พิมพ์รหัสหรือชื่อสินค้า เช่น 144535_12_L..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            {prodOptions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                {prodOptions.map((p) => (
                  <button
                    key={p.STKCOD}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition flex items-center justify-between"
                  >
                    <span>
                      <strong className="text-slate-900">{p.STKCOD}</strong> — {p.STKDES}
                    </span>
                    <span className="font-semibold text-slate-600">
                      {(p.SELLPR1 || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-3 py-2">สินค้า</th>
                    <th className="text-right px-2 py-2 w-20">จำนวน</th>
                    <th className="text-right px-2 py-2 w-24">ราคา/หน่วย</th>
                    <th className="text-right px-3 py-2 w-24">รวม</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={`${it.stkcod}-${idx}`}>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{it.stkcod}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[220px]">{it.stkdes}</div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={1}
                          step="1"
                          value={it.ordqty}
                          onChange={(e) => updateItem(idx, { ordqty: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-full text-right px-2 py-1 border border-slate-200 rounded-lg"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={it.unitpr}
                          onChange={(e) => updateItem(idx, { unitpr: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-full text-right px-2 py-1 border border-slate-200 rounded-lg"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">
                        {(it.ordqty * it.unitpr).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-1 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-60 space-y-1 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>รวมเป็นเงิน</span>
                <span>{subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ภาษีมูลค่าเพิ่ม 7%</span>
                <span>{vatamt.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>จำนวนเงินรวมทั้งสิ้น</span>
                <span>{netamt.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting
                ? "กำลังส่งเข้า Jenkins → Express..."
                : isEdit
                ? "บันทึกการแก้ไขลง WriteTes"
                : "บันทึกใบเสนอราคาลง WriteTes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
