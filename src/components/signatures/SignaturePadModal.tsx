"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  RotateCcw,
  Eraser,
  Check,
  Building2,
  FileSignature,
  PenTool,
  Ban,
  RefreshCw,
  Sparkles,
  Copy,
  History,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

export type SignatureType = "default" | "custom" | "blank";

export interface SignatureLibraryItem {
  roleId?: string;
  roleName: string;
  dataUrl: string;
  updatedAt?: string;
}

export interface SignatureRoleItem {
  id: string;
  name: string;
  subname: string;
  docs: string;
  defaultHasImage: boolean;
}

export const SIGNATURE_ROLES: SignatureRoleItem[] = [
  {
    id: "authorized",
    name: "ผู้รับมอบอำนาจ",
    subname: "Authorized Signature",
    docs: "ขายเชื่อ (IV), ขายสด (HS), ใบเสร็จ (RE), มัดจำ (AI), ใบลดหนี้ (SR)",
    defaultHasImage: true,
  },
  {
    id: "approved",
    name: "ผู้ตรวจเช็ค / ผู้อนุมัติ",
    subname: "Approved by",
    docs: "ขายเชื่อ (IV), ขายสด (HS), มัดจำ (AI), ใบเสนอราคา (QT)",
    defaultHasImage: false,
  },
  {
    id: "collector",
    name: "ผู้รับเงิน",
    subname: "Collector",
    docs: "ขายสด (HS), ใบเสร็จ (RE), ใบรับมัดจำ (AI)",
    defaultHasImage: false,
  },
  {
    id: "billing",
    name: "ผู้วางบิล",
    subname: "Billing Issuer",
    docs: "ใบวางบิล (BL)",
    defaultHasImage: true,
  },
  {
    id: "prepared",
    name: "ผู้เตรียมเอกสาร",
    subname: "Prepared by",
    docs: "ใบเสร็จรับเงิน (RE)",
    defaultHasImage: false,
  },
  {
    id: "checked",
    name: "ผู้ตรวจสอบ",
    subname: "Checked by",
    docs: "ใบเสนอราคา (QT)",
    defaultHasImage: false,
  },
  {
    id: "acknowledged",
    name: "ผู้รับทราบ",
    subname: "Acknowledged by",
    docs: "ใบเสนอราคา (QT)",
    defaultHasImage: false,
  },
];

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];

function getTrimmedCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        hasPixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixels || minX > maxX || minY > maxY) {
    return canvas;
  }

  // Add 8px padding around drawing
  const pad = 8;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width - cropX, maxX - minX + pad * 2);
  const cropH = Math.min(height - cropY, maxY - minY + pad * 2);

  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = cropW;
  trimmedCanvas.height = cropH;
  const trimmedCtx = trimmedCanvas.getContext("2d");
  if (!trimmedCtx) return canvas;

  trimmedCtx.drawImage(
    canvas,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  );

  return trimmedCanvas;
}

export function SignaturePadModal({
  isOpen,
  onClose,
  initialRole = "authorized",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: string;
}) {
  const [activeRole, setActiveRole] = useState(initialRole);
  const [mounted, setMounted] = useState(false);
  const [roleConfigs, setRoleConfigs] = useState<
    Record<string, { type: SignatureType; dataUrl?: string | null; updatedAt?: string }>
  >({});
  const [signatureLibrary, setSignatureLibrary] = useState<SignatureLibraryItem[]>([]);
  const [defaultBase64, setDefaultBase64] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Drawing tools state
  const [penColor, setPenColor] = useState<string>("#1e3a8a"); // Default Navy blue
  const [penWidth, setPenWidth] = useState<number>(3); // Medium
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRedrawing, setIsRedrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rolesTabsRef = useRef<HTMLDivElement | null>(null);

  const scrollTabs = (direction: "left" | "right") => {
    if (rolesTabsRef.current) {
      rolesTabsRef.current.scrollBy({
        left: direction === "left" ? -240 : 240,
        behavior: "smooth",
      });
    }
  };

  // Reference dimensions: 152 x 124 -> 380 x 310 px on screen (Retina 2.5x)
  const CANVAS_WIDTH = 380;
  const CANVAS_HEIGHT = 310;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load signatures from server
  const fetchSignatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/signatures");
      if (res.ok) {
        const json = await res.json();
        if (json.config) setRoleConfigs(json.config);
        if (json.defaultBase64) setDefaultBase64(json.defaultBase64);
        if (Array.isArray(json.library)) setSignatureLibrary(json.library);
      }
    } catch (err) {
      console.error("Failed to fetch signatures:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSignatures();
      setActiveRole(initialRole);
      setSaveSuccess(false);
    }
  }, [isOpen, initialRole, fetchSignatures]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-scroll active role tab into view
  useEffect(() => {
    if (isOpen && rolesTabsRef.current) {
      const activeEl = rolesTabsRef.current.querySelector<HTMLElement>(
        `[data-role-id="${activeRole}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeRole, isOpen]);

  const currentRoleInfo =
    SIGNATURE_ROLES.find((r) => r.id === activeRole) || SIGNATURE_ROLES[0];
  const currentRoleConfig = roleConfigs[activeRole] || {
    type: currentRoleInfo.defaultHasImage ? "default" : "blank",
  };

  // Collect all unique saved signatures into a reusable library (never lost even if role reverts to default/blank)
  const savedLibrary = useMemo(() => {
    const list: SignatureLibraryItem[] = [];
    const seen = new Set<string>();

    // 1. From persistent library
    signatureLibrary.forEach((item) => {
      if (item.dataUrl && !seen.has(item.dataUrl)) {
        seen.add(item.dataUrl);
        list.push(item);
      }
    });

    // 2. From all role configs that have a dataUrl saved (regardless of type: custom, default, or blank)
    Object.entries(roleConfigs).forEach(([rId, cfg]) => {
      if (cfg?.dataUrl && !seen.has(cfg.dataUrl)) {
        seen.add(cfg.dataUrl);
        const rInfo = SIGNATURE_ROLES.find((r) => r.id === rId);
        list.push({
          roleId: rId,
          roleName: rInfo?.name || rId,
          dataUrl: cfg.dataUrl,
          updatedAt: cfg.updatedAt,
        });
      }
    });

    return list;
  }, [roleConfigs, signatureLibrary]);

  // Re-draw canvas whenever strokes, penColor, or penWidth change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    strokes.forEach((stroke) => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;

      if (stroke.length === 1) {
        ctx.arc(stroke[0].x, stroke[0].y, penWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = penColor;
        ctx.fill();
      } else {
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          const midX = (stroke[i - 1].x + stroke[i].x) / 2;
          const midY = (stroke[i - 1].y + stroke[i].y) / 2;
          ctx.quadraticCurveTo(stroke[i - 1].x, stroke[i - 1].y, midX, midY);
        }
        ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
        ctx.stroke();
      }
    });
  }, [strokes, penColor, penWidth]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Pointer event helpers for mouse & touch
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setStrokes((prev) => [...prev, [point]]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    setStrokes((prev) => {
      if (prev.length === 0) return [[point]];
      const last = prev[prev.length - 1];
      return [...prev.slice(0, -1), [...last, point]];
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    setStrokes([]);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  // Switch mode for active role
  const handleModeChange = (type: SignatureType) => {
    setIsRedrawing(false);
    setStrokes([]);
    setRoleConfigs((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        type,
      },
    }));
  };

  // Reset current role to default
  const handleResetCurrentRole = () => {
    handleModeChange(currentRoleInfo.defaultHasImage ? "default" : "blank");
  };

  // Reset all roles to Express system default
  const handleResetAllToDefault = async () => {
    if (
      !confirm(
        "คุณต้องการคืนค่าการตั้งค่าลายเซ็นทุกตำแหน่งกลับเป็นค่าเริ่มต้นเดิมของระบบ Express หรือไม่?\n(ตำแหน่งผู้รับมอบอำนาจและผู้วางบิลจะใช้ไฟล์ลายเซ็นระบบ ส่วนตำแหน่งอื่นจะเว้นว่าง โดยลายเซ็นในคลังจะยังคงถูกเก็บไว้)"
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const resetConfig: Record<
        string,
        { type: SignatureType; dataUrl?: string | null; updatedAt?: string }
      > = {};

      SIGNATURE_ROLES.forEach((r) => {
        const prevDataUrl = roleConfigs[r.id]?.dataUrl || null;
        resetConfig[r.id] = {
          type: r.defaultHasImage ? "default" : "blank",
          dataUrl: prevDataUrl,
          updatedAt: new Date().toISOString(),
        };
      });

      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: resetConfig,
          library: savedLibrary, // Keep the library intact
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setRoleConfigs(json.config || resetConfig);
        if (Array.isArray(json.library)) {
          setSignatureLibrary(json.library);
        }
        setStrokes([]);
        setIsRedrawing(false);
        setSaveSuccess(true);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("express-signatures-updated", {
              detail: { resetAll: true },
            })
          );
        }

        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Reset all signatures failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Delete signature from library and any role using it
  const handleDeleteFromLibrary = async (dataUrlToDelete: string) => {
    if (!confirm("คุณต้องการลบลายเซ็นนี้ออกจากคลังหรือไม่?")) {
      return;
    }

    setSaving(true);
    try {
      // 1. Filter out from signatureLibrary
      const updatedLib = signatureLibrary.filter(
        (item) => item.dataUrl !== dataUrlToDelete
      );
      setSignatureLibrary(updatedLib);

      // 2. Clean up any roles using this dataUrl
      const updatedRoleConfigs: Record<
        string,
        { type: SignatureType; dataUrl?: string | null; updatedAt?: string }
      > = {};

      Object.entries(roleConfigs).forEach(([rId, cfg]) => {
        if (cfg.dataUrl === dataUrlToDelete) {
          const rInfo = SIGNATURE_ROLES.find((r) => r.id === rId);
          // If this role was actively using the deleted signature, revert to default/blank
          updatedRoleConfigs[rId] = {
            type:
              cfg.type === "custom"
                ? (rInfo?.defaultHasImage ? "default" : "blank")
                : cfg.type,
            dataUrl: null,
            updatedAt: new Date().toISOString(),
          };
        } else {
          updatedRoleConfigs[rId] = cfg;
        }
      });

      setRoleConfigs(updatedRoleConfigs);
      setStrokes([]);
      setIsRedrawing(false);

      // 3. Persist to server
      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedRoleConfigs,
          library: updatedLib,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setRoleConfigs(json.config || updatedRoleConfigs);
        if (Array.isArray(json.library)) {
          setSignatureLibrary(json.library);
        }
        setSaveSuccess(true);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("express-signatures-updated", {
              detail: { deletedSignature: true },
            })
          );
        }

        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Delete signature failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Save current role signature
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      let dataUrlToSave: string | null = null;

      if (currentRoleConfig.type === "custom") {
        const canvas = canvasRef.current;
        if (canvas && strokes.length > 0) {
          // Auto-trim transparent borders so signature fills the document signature slot cleanly
          const trimmedCanvas = getTrimmedCanvas(canvas);
          dataUrlToSave = trimmedCanvas.toDataURL("image/png");
        } else if (currentRoleConfig.dataUrl) {
          dataUrlToSave = currentRoleConfig.dataUrl;
        }
      } else {
        // If type is "default" or "blank", preserve existing dataUrl so it is never lost from library
        dataUrlToSave = currentRoleConfig.dataUrl || null;
      }

      // Build updated library array
      const updatedLibrary = [...savedLibrary];
      if (dataUrlToSave && !updatedLibrary.some((p) => p.dataUrl === dataUrlToSave)) {
        updatedLibrary.push({
          roleId: activeRole,
          roleName: currentRoleInfo.name,
          dataUrl: dataUrlToSave,
          updatedAt: new Date().toISOString(),
        });
      }

      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeRole,
          type: currentRoleConfig.type,
          dataUrl: dataUrlToSave,
          library: updatedLibrary,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setRoleConfigs(json.config || {});
        if (Array.isArray(json.library)) {
          setSignatureLibrary(json.library);
        } else {
          setSignatureLibrary(updatedLibrary);
        }
        setSaveSuccess(true);
        // Clear canvas strokes after save
        setStrokes([]);

        // Dispatch browser event so open sheets update immediately
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("express-signatures-updated", {
              detail: { role: activeRole, type: currentRoleConfig.type },
            })
          );
        }

        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save signature failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Centering container that respects top boundary */}
      <div className="min-h-full flex items-start justify-center p-2.5 sm:p-4 md:p-6 pointer-events-none">
        {/* Modal Dialog */}
        <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col pointer-events-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/80 text-blue-700 rounded-xl">
              <FileSignature size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                จัดการลายเซ็นเอกสารฝ่ายบริษัท (Handwritten Signatures)
              </h2>
              <p className="text-[11px] text-slate-500">
                วาดลายเซ็นออนไลน์ หรือเลือกใช้ลายเซ็น Express สำหรับพิมพ์และแสดงผล
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Roles Selector Horizontal Tabs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>เลือกตำแหน่ง/บทบาทลายเซ็นที่ต้องการตั้งค่า:</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({SIGNATURE_ROLES.length} ตำแหน่ง)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollTabs("left")}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition shadow-2xs cursor-pointer"
                  title="เลื่อนซ้าย"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollTabs("right")}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition shadow-2xs cursor-pointer"
                  title="เลื่อนขวา"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div
              ref={rolesTabsRef}
              className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
            >
              {SIGNATURE_ROLES.map((role) => {
                const isActive = activeRole === role.id;
                const cfg = roleConfigs[role.id];
                const modeLabel =
                  cfg?.type === "custom"
                    ? "วาดเอง"
                    : cfg?.type === "blank"
                    ? "เว้นว่าง"
                    : role.defaultHasImage
                    ? "เริ่มต้น"
                    : "เว้นว่าง";

                return (
                  <button
                    key={role.id}
                    data-role-id={role.id}
                    type="button"
                    onClick={() => {
                      setActiveRole(role.id);
                      setStrokes([]);
                      setIsRedrawing(false);
                      setSaveSuccess(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition text-left shrink-0 border cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{role.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? "bg-blue-700 text-blue-100"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {modeLabel}
                      </span>
                    </div>
                    <div
                      className={`text-[10.5px] font-normal truncate max-w-[170px] ${
                        isActive ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {role.subname}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Role Card & Mode Selector */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {currentRoleInfo.name} ({currentRoleInfo.subname})
                  </h3>
                  <button
                    type="button"
                    onClick={handleResetCurrentRole}
                    className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    title={`คืนค่าเริ่มต้นสำหรับ ${currentRoleInfo.name}`}
                  >
                    (คืนค่าเริ่มต้นตำแหน่งนี้)
                  </button>
                </div>
                <p className="text-[11.5px] text-slate-500">
                  ใช้งานในเอกสาร: {currentRoleInfo.docs}
                </p>
              </div>

              {/* Mode Options (3 options) */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleModeChange("custom")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    currentRoleConfig.type === "custom"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <PenTool size={13} />
                  <span>วาดลายเซ็นเอง</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("default")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    currentRoleConfig.type === "default"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Building2 size={13} />
                  <span>ใช้ลายเซ็นระบบ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("blank")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    currentRoleConfig.type === "blank"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Ban size={13} />
                  <span>เว้นว่าง</span>
                </button>
              </div>
            </div>

            {/* Mode Content */}
            {currentRoleConfig.type === "custom" ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Left: Saved Signature Preview OR Interactive Canvas Area (7 cols) */}
                <div className="md:col-span-7 space-y-2.5">
                  {currentRoleConfig.dataUrl && !isRedrawing && strokes.length === 0 ? (
                    /* Case 1: Already has saved signature -> Show clear Preview Card */
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <Check size={13} />
                          <span>มีลายเซ็นที่บันทึกไว้สำหรับตำแหน่งนี้แล้ว</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {currentRoleConfig.updatedAt
                            ? new Date(currentRoleConfig.updatedAt).toLocaleDateString("th-TH")
                            : "พร้อมใช้งาน"}
                        </span>
                      </div>

                      {/* Checkered Preview Box */}
                      <div className="h-44 rounded-xl border border-dashed border-slate-300 flex items-center justify-center p-4 bg-slate-50/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentRoleConfig.dataUrl}
                          alt="Saved Signature"
                          className="max-h-36 max-w-full object-contain filter drop-shadow-sm"
                        />
                      </div>

                      <div className="flex items-center justify-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRedrawing(true);
                            setStrokes([]);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <PenTool size={13} />
                          <span>วาดลายเซ็นใหม่ทับ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleModeChange(currentRoleInfo.defaultHasImage ? "default" : "blank");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
                        >
                          <Eraser size={13} />
                          <span>ล้างเพื่อเว้นว่าง</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Case 2: Redrawing or New Drawing -> Interactive Canvas */
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            พื้นที่วาดลายเซ็น
                          </span>
                          {currentRoleConfig.dataUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setStrokes([]);
                                setIsRedrawing(false);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                            >
                              <RotateCcw size={11} />
                              <span>ใช้ลายเซ็นเดิม</span>
                            </button>
                          )}
                        </div>

                        {/* Color and Width Controls */}
                        <div className="flex items-center gap-3">
                          {/* Pen Colors */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPenColor("#1e3a8a")}
                              className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                                penColor === "#1e3a8a"
                                  ? "ring-2 ring-blue-500 scale-110"
                                  : "opacity-80 hover:opacity-100"
                              }`}
                              style={{ backgroundColor: "#1e3a8a" }}
                              title="สีน้ำเงินเข้ม (Navy Blue)"
                            />
                            <button
                              type="button"
                              onClick={() => setPenColor("#0f172a")}
                              className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                                penColor === "#0f172a"
                                  ? "ring-2 ring-slate-800 scale-110"
                                  : "opacity-80 hover:opacity-100"
                              }`}
                              style={{ backgroundColor: "#0f172a" }}
                              title="สีดำเข้ม (Pure Black)"
                            />
                          </div>

                          <div className="h-4 w-px bg-slate-300" />

                          {/* Pen Width */}
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                            <span>เส้น:</span>
                            {[
                              { w: 2, label: "บาง" },
                              { w: 3, label: "กลาง" },
                              { w: 4.5, label: "หนา" },
                            ].map((item) => (
                              <button
                                key={item.w}
                                type="button"
                                onClick={() => setPenWidth(item.w)}
                                className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                                  penWidth === item.w
                                    ? "bg-slate-900 text-white font-bold"
                                    : "bg-slate-200/70 hover:bg-slate-200"
                              }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* HTML5 Canvas with Guide Lines */}
                      <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner flex items-center justify-center">
                        <canvas
                          ref={canvasRef}
                          width={CANVAS_WIDTH}
                          height={CANVAS_HEIGHT}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className="touch-none cursor-crosshair w-full max-w-[380px] h-auto aspect-[152/124]"
                        />

                        {/* Baseline Guide */}
                        <div className="absolute bottom-[28%] left-[10%] right-[10%] border-b border-blue-300/40 pointer-events-none" />
                        <span className="absolute bottom-[16%] left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-medium pointer-events-none select-none">
                          วาดลายเซ็นให้อยู่เหนือเส้นแนวนอน
                        </span>

                        {strokes.length === 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-slate-400 space-y-1">
                            <PenTool size={22} className="opacity-40" />
                            <span className="text-xs">
                              ใช้นิ้วหรือเมาส์วาดลายเซ็นในกรอบนี้
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Canvas Action Buttons */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleUndo}
                            disabled={strokes.length === 0}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer text-xs"
                          >
                            <RotateCcw size={13} />
                            <span>ย้อนกลับ</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleClear}
                            disabled={strokes.length === 0}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer text-xs"
                          >
                            <Eraser size={13} />
                            <span>ล้าง</span>
                          </button>
                        </div>

                        <span className="text-[11px] text-slate-500">
                          สัดส่วน 152 × 124 px (Auto-trim PNG)
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Live Preview Box (5 cols) */}
                <div className="md:col-span-5 space-y-3">
                  <div className="text-xs font-semibold text-slate-700">
                    ตัวอย่างการแสดงผลบนบิลจริง:
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-300/80 shadow-sm text-center space-y-1">
                    <div className="text-[10px] text-slate-500">ในนาม</div>
                    <div className="font-bold text-xs text-slate-900 mb-1">
                      บริษัทฯ (ฝ่ายบริหาร)
                    </div>

                    {/* Preview Image Container */}
                    <div className="h-14 flex items-end justify-center mb-1">
                      {strokes.length > 0 ? (
                        <canvas
                          ref={(node) => {
                            if (!node || strokes.length === 0) return;
                            const ctx = node.getContext("2d");
                            if (!ctx) return;
                            ctx.clearRect(0, 0, node.width, node.height);
                            ctx.lineCap = "round";
                            ctx.lineJoin = "round";
                            const scale = node.width / CANVAS_WIDTH;
                            strokes.forEach((stroke) => {
                              if (stroke.length === 0) return;
                              ctx.beginPath();
                              ctx.strokeStyle = penColor;
                              ctx.lineWidth = penWidth * scale;
                              ctx.moveTo(stroke[0].x * scale, stroke[0].y * scale);
                              for (let i = 1; i < stroke.length; i++) {
                                const midX =
                                  ((stroke[i - 1].x + stroke[i].x) / 2) * scale;
                                const midY =
                                  ((stroke[i - 1].y + stroke[i].y) / 2) * scale;
                                ctx.quadraticCurveTo(
                                  stroke[i - 1].x * scale,
                                  stroke[i - 1].y * scale,
                                  midX,
                                  midY
                                );
                              }
                              ctx.lineTo(
                                stroke[stroke.length - 1].x * scale,
                                stroke[stroke.length - 1].y * scale
                              );
                              ctx.stroke();
                            });
                          }}
                          width={152}
                          height={124}
                          className="h-12 w-auto object-contain object-bottom"
                        />
                      ) : currentRoleConfig.dataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={currentRoleConfig.dataUrl}
                          alt="Current Custom Signature"
                          className="h-12 w-auto object-contain object-bottom"
                        />
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          (วาดลายเซ็นด้านซ้ายเพื่อดูตัวอย่าง)
                        </div>
                      )}
                    </div>

                    <div className="border-b border-slate-700 w-4/5 mx-auto mb-1"></div>
                    <div className="text-[10px] text-slate-700 font-medium">
                      {currentRoleInfo.name} / {currentRoleInfo.subname}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/60 leading-relaxed">
                    💡 <strong>เคล็ดลับ:</strong> ลายเซ็นที่วาดจะถูกตัดพื้นหลังให้เป็นแบบโปร่งใสอัตโนมัติ ทำให้เมื่อนำไปวางในบิล ลายเซ็นจะลอยอยู่เหนือเส้นอย่างสวยงามเสมือนเซ็นสด
                  </div>
                </div>
              </div>
            ) : currentRoleConfig.type === "default" ? (
              <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                  <Sparkles size={13} />
                  <span>ใช้ไฟล์ลายเซ็นต้นฉบับจากระบบ Express</span>
                </div>

                <div className="h-16 flex items-end justify-center">
                  {defaultBase64 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={defaultBase64}
                      alt="Default Signature"
                      className="h-14 w-auto object-contain"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/api/logo/signature"
                      alt="Default Signature"
                      className="h-14 w-auto object-contain"
                    />
                  )}
                </div>

                <div className="border-b border-slate-700 w-1/2 mx-auto"></div>
                <div className="text-xs text-slate-600 font-medium">
                  {currentRoleInfo.name} / {currentRoleInfo.subname}
                </div>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  ระบบจะใช้ไฟล์ <code>my-express-authorized-signature.bmp</code> เป็นลายเซ็นหลักสำหรับเอกสารนี้
                </p>
              </div>
            ) : (
              <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-300">
                  <Ban size={13} />
                  <span>เว้นว่างช่องลายเซ็นนี้</span>
                </div>

                <div className="h-12"></div>
                <div className="border-b border-slate-700 w-1/2 mx-auto"></div>
                <div className="text-xs text-slate-600 font-medium">
                  {currentRoleInfo.name} / {currentRoleInfo.subname}
                </div>
                <p className="text-[11px] text-slate-500">
                  เอกสารจะแสดงเป็นเส้นประ/เส้นทึบว่างเปล่า สำหรับให้ผู้ใช้งานพิมพ์ออกมาแล้วเซ็นสดด้วยปากกาจริง
                </p>
              </div>
            )}
          </div>

          {/* Reusable Library of Previously Signed Signatures */}
          {savedLibrary.length > 0 && (
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100/70 text-blue-700 rounded-lg">
                    <History size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      คลังลายเซ็นที่เคยเซ็นไว้ในระบบ ({savedLibrary.length} รายการ)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      คลิกเลือกเพื่อนำลายเซ็นที่เคยเซ็นไว้ มาใช้งานกับตำแหน่ง {currentRoleInfo.name} ได้ทันทีโดยไม่ต้องวาดใหม่
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-0.5">
                {savedLibrary.map((item, idx) => {
                  const isCurrent =
                    currentRoleConfig.type === "custom" &&
                    currentRoleConfig.dataUrl === item.dataUrl;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        isCurrent
                          ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                          : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-14 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.dataUrl}
                            alt={item.roleName}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-slate-800 truncate">
                            {item.roleName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.updatedAt
                              ? new Date(item.updatedAt).toLocaleDateString("th-TH")
                              : "ลายเซ็นที่บันทึกไว้"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg">
                            <Check size={12} />
                            <span>ใช้อยู่</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRoleConfigs((prev) => ({
                                ...prev,
                                [activeRole]: {
                                  type: "custom",
                                  dataUrl: item.dataUrl,
                                  updatedAt: new Date().toISOString(),
                                },
                              }));
                              setStrokes([]);
                              setIsRedrawing(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-[11px] font-semibold transition shadow-xs cursor-pointer"
                            title="นำลายเซ็นนี้ไปใช้กับตำแหน่งที่เลือก"
                          >
                            <Copy size={11} />
                            <span>ใช้ลายเซ็นนี้</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteFromLibrary(item.dataUrl)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
                          title="ลบลายเซ็นนี้ออกจากคลัง"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleResetAllToDefault}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="คืนค่าการตั้งค่าลายเซ็นทุกตำแหน่งกลับเป็นค่าเริ่มต้นเดิมของระบบ Express"
            >
              <RotateCcw size={13} />
              <span>คืนค่าเริ่มต้นทุกแบบ</span>
            </button>

            <div className="text-xs text-slate-500">
              {saveSuccess ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Check size={14} /> บันทึกการตั้งค่าเรียบร้อยแล้ว!
                </span>
              ) : (
                <span className="hidden sm:inline">
                  กดบันทึกเพื่อนำลายเซ็นไปใช้กับเอกสารทันที
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              ปิด
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}

