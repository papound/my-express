/**
 * Client-side PDF Actions: Direct Print & Direct Download without opening a new tab
 */

export async function printPdf(url: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`ไม่สามารถโหลดไฟล์ PDF ได้ (${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print dialog error:", err);
      } finally {
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          iframe.remove();
        }, 60000);
      }
    };
  } catch (err) {
    console.error("Failed to print PDF:", err);
    alert("เกิดข้อผิดพลาดในการสั่งพิมพ์ PDF กรุณาลองใหม่อีกครั้ง");
  }
}

export async function downloadPdf(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ได้ (${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      a.remove();
    }, 2000);
  } catch (err) {
    console.error("Failed to download PDF:", err);
    alert("เกิดข้อผิดพลาดในการดาวน์โหลด PDF กรุณาลองใหม่อีกครั้ง");
  }
}
