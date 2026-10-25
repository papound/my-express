/**
 * Client-side PDF Actions: Direct Print & Direct Download with Global Loading Backdrop
 */

function showPdfBackdrop(
  title: string,
  subtitle: string,
  iconType: "print" | "download" = "print"
): () => void {
  if (typeof document === "undefined") return () => {};

  // Inject CSS animations if not already added
  if (!document.getElementById("__pdf_backdrop_style__")) {
    const style = document.createElement("style");
    style.id = "__pdf_backdrop_style__";
    style.textContent = `
      @keyframes pdf-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pdf-fade-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  // Remove any previously open backdrop
  const existing = document.getElementById("__pdf_backdrop__");
  if (existing) existing.remove();

  const backdrop = document.createElement("div");
  backdrop.id = "__pdf_backdrop__";
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    transition: opacity 0.25s ease;
    opacity: 1;
    padding: 16px;
    touch-action: none;
    pointer-events: auto;
  `;

  const isPrint = iconType === "print";
  const iconSvg = isPrint
    ? `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>`
    : `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

  const spinnerColor = isPrint ? "#2563eb" : "#16a34a";
  const badgeBg = isPrint ? "#eff6ff" : "#f0fdf4";

  backdrop.innerHTML = `
    <div style="
      background: #ffffff;
      border-radius: 24px;
      padding: 32px 28px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(226, 232, 240, 0.9);
      animation: pdf-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <div style="position: relative; width: 72px; height: 72px; margin: 0 auto 20px;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3.5px solid #f1f5f9;
          border-top-color: ${spinnerColor};
          animation: pdf-spin 0.9s linear infinite;
        "></div>
        <div style="
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: ${badgeBg};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${iconSvg}
        </div>
      </div>
      <h3 style="
        font-family: inherit;
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 8px 0;
        letter-spacing: -0.01em;
      ">${title}</h3>
      <p style="
        font-family: inherit;
        font-size: 12px;
        color: #64748b;
        margin: 0;
        line-height: 1.5;
      ">${subtitle}</p>
      <div style="
        margin-top: 20px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 14px;
        border-radius: 9999px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      ">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${spinnerColor};"></span>
        ระบบกำลังเรนเดอร์เอกสาร โปรดรอสักครู่
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  return () => {
    backdrop.style.opacity = "0";
    setTimeout(() => {
      backdrop.remove();
    }, 250);
  };
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export async function printPdf(
  url: string,
  _title: string = "กำลังเตรียมพิมพ์เอกสาร..."
): Promise<void> {
  const printUrl = `${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`;

  // เปิดไฟล์ PDF ต้นฉบับในแท็บใหม่ทันที
  // วิธีนี้ป้องกันปัญหาเบราว์เซอร์ (Chrome/Edge) สั่งพิมพ์หน้าเว็บ HTML แทนเอกสาร PDF จาก hidden iframe sandbox
  // และทำให้เอกสารที่พิมพ์ มีรูปแบบและข้อมูลตรงกับไฟล์ที่กดดาวน์โหลด (Download) 100% ทุกประการ
  const win = window.open(printUrl, "_blank");
  if (win) {
    win.focus();
  }
}

export async function downloadPdf(
  url: string,
  filename: string,
  title: string = "กำลังดาวน์โหลดไฟล์ PDF..."
): Promise<void> {
  const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const downloadUrl = `${url}${url.includes("?") ? "&" : "?"}download=1&_t=${Date.now()}`;

  const hideBackdrop = showPdfBackdrop(
    title,
    "ระบบกำลังสร้างไฟล์ PDF และเตรียมดาวน์โหลดลงเครื่อง...",
    "download"
  );

  try {
    const res = await fetch(downloadUrl);
    if (!res.ok) {
      throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ได้ (${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = safeFilename;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      hideBackdrop();
      URL.revokeObjectURL(blobUrl);
      a.remove();
    }, 1500);
  } catch (err) {
    hideBackdrop();
    console.error("Failed to download PDF:", err);
    // Fallback direct download
    window.location.href = downloadUrl;
  }
}
