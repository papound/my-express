import { bahtText } from "@/lib/baht-text";
import {
  getCompanyLogoBase64,
  getWatermarkLogoBase64,
  getAuthorizedSignatureBase64,
} from "@/lib/logo";
export { generateCashSaleHtml } from "./cashSaleTemplate";
export { generateReceiptHtml } from "./receiptTemplate";

function fmtMoney(n: number): string {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d: Date | null): string {
  if (!d) return "-";
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
  @page {
    size: A4;
    margin: 8mm 10mm;
  }
  * {
    box-sizing: border-box;
    font-family: 'Sarabun', 'Noto Sans Thai', Tahoma, sans-serif;
  }
  body {
    font-size: 13px;
    line-height: 1.4;
    color: #111;
    margin: 0;
    padding: 0;
    position: relative;
  }
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 480px;
    opacity: 0.15;
    pointer-events: none;
    z-index: 0;
  }
  .content-layer {
    position: relative;
    z-index: 1;
  }
  .company-logo {
    max-height: 60px;
    max-width: 120px;
    object-fit: contain;
    margin-right: 12px;
  }
  .doc-title {
    font-size: 18px;
    font-weight: 700;
    text-align: right;
  }
  .doc-num {
    font-size: 14px;
    font-weight: 600;
    text-align: right;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    background-color: transparent;
  }
  .items-table th {
    background-color: rgba(243, 244, 246, 0.85);
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
    padding: 6px 8px;
    font-weight: 600;
  }
  .items-table td {
    padding: 5px 8px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-mono { font-family: monospace; }
  .border-box {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px 12px;
    background-color: rgba(255, 255, 255, 0.7);
  }
  .summary-table {
    width: 100%;
    border-collapse: collapse;
  }
  .summary-table td {
    padding: 3px 6px;
  }
  .signatures {
    margin-top: 45px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    text-align: center;
  }
  .sig-col {
    width: 30%;
  }
  .sig-line {
    border-bottom: 1px dashed #666;
    margin-bottom: 6px;
    height: 35px;
  }
`;

export function generateInvoiceHtml(data: {
  invoice: any;
  customer?: any;
  items: any[];
  remarks: any[];
  company?: any;
}): string {
  const { invoice, customer, items, remarks, company } = data;

  const logoBase64 = getCompanyLogoBase64();
  const watermarkBase64 = getWatermarkLogoBase64();
  const signatureBase64 = getAuthorizedSignatureBase64();

  const fmtThaiDateShort = (d: Date | string | null): string => {
    if (!d) return "-";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "-";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const buddhistYear = dateObj.getFullYear() + 543;
    const yearShort = String(buddhistYear % 100).padStart(2, "0");
    return `${day}/${month}/${yearShort}`;
  };

  const INVOICE_PAGES = [
    {
      page: 1,
      title: "ใบกำกับภาษี/ใบส่งสินค้า",
      subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
      headerBg: "#9ec5f7",
      tableHeaderBg: "#cde3fc",
      summaryBg: "#9ec5f7",
      showReceiptNote: true,
    },
    {
      page: 2,
      title: "ใบกำกับภาษี/ใบส่งสินค้า",
      subtitle: "สำเนา (สำหรับลูกค้า)",
      headerBg: "#e88ef5",
      tableHeaderBg: "#f2befa",
      summaryBg: "#e88ef5",
      showReceiptNote: true,
    },
    {
      page: 3,
      title: "ใบกำกับภาษี/ใบแจ้งหนี้",
      subtitle: "สำเนา (สำหรับวางบิล)",
      headerBg: "#ffa439",
      tableHeaderBg: "#ffd296",
      summaryBg: "#ffa439",
      showReceiptNote: false,
    },
    {
      page: 4,
      title: "ใบกำกับภาษี/ใบแจ้งหนี้",
      subtitle: "สำเนา (สำหรับฝ่ายบัญชี)",
      headerBg: "#fde047",
      tableHeaderBg: "#fef9c3",
      summaryBg: "#fde047",
      showReceiptNote: false,
    },
  ];

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
    @page {
      size: A4;
      margin: 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Sarabun', 'Noto Sans Thai', Tahoma, sans-serif;
    }
    body {
      font-size: 11.5px;
      line-height: 1.3;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .invoice-page {
      page-break-after: always;
      position: relative;
      min-height: 278mm;
      max-height: 282mm;
      box-sizing: border-box;
      padding-bottom: 2mm;
    }
    .invoice-page:last-child {
      page-break-after: avoid;
    }
    .watermark-layer {
      position: absolute;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 410px;
      opacity: 0.13;
      pointer-events: none;
      z-index: 0;
    }
    .content-layer {
      position: relative;
      z-index: 1;
    }
    .company-logo {
      height: 56px;
      width: 56px;
      object-fit: contain;
      margin-right: 12px;
    }
    .box-bordered {
      border: 1px solid #444;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .items-table th {
      border-bottom: 1px solid #444;
      border-right: 1px solid #444;
      padding: 4px 6px;
      font-weight: 600;
      text-align: center;
    }
    .items-table th:last-child {
      border-right: none;
    }
    .items-table td {
      border-right: 1px solid #444;
      border-bottom: 1px solid #eee;
      padding: 3.5px 6px;
      vertical-align: top;
    }
    .items-table td:last-child {
      border-right: none;
    }
    .font-mono { font-family: monospace; }
  </style>
</head>
<body>
  ${INVOICE_PAGES.map(
    (p) => `
  <div class="invoice-page">
    ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark-layer" alt="Watermark" />` : ""}

    <div class="content-layer">
      <!-- Header -->
      <table style="width: 100%; margin-bottom: 4px; border-collapse: collapse;">
        <tr>
          <!-- Company details on Left -->
          <td style="vertical-align: top; width: 62%;">
            <div style="display: flex; align-items: flex-start;">
              ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo" />` : ""}
              <div>
                <div style="font-size: 15px; font-weight: 700; color: #000;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>
                <div style="font-size: 11px; color: #333; margin-top: 1px;">
                  ${company?.ADDR01 || ""} ${company?.ADDR02 || ""}<br>
                  ${company?.TELNUM || "โทรศัพท์. 02-896-8068-9 แฟกซ์.02-896-8065"}
                </div>
                <div style="font-size: 11px; color: #333; margin-top: 2px;">
                  <span style="font-weight: 600;">เลขประจำตัวผู้เสียภาษี/ Tax ID</span> &nbsp; <span class="font-mono font-bold">${company?.TAXID || "0105558016255"}</span> &nbsp;&nbsp;&nbsp; สำนักงานใหญ่
                </div>
              </div>
            </div>
          </td>

          <!-- Colored Header Pill on Right -->
          <td style="vertical-align: top; width: 38%; text-align: right; padding-top: 4px;">
            <div style="display: inline-block; background-color: ${p.headerBg}; border-radius: 10px; padding: 5px 14px; text-align: center; border: 1px solid rgba(0,0,0,0.15);">
              <div style="font-size: 15px; font-weight: 700; color: #000; letter-spacing: 0.3px;">${p.title}</div>
              <div style="font-size: 12px; font-weight: 600; color: #111; margin-top: 1px;">${p.subtitle}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Top Customer & Document Info Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <tr>
          <!-- Left: Customer -->
          <td style="width: 55%; vertical-align: top; padding: 6px 10px; border-right: 1px solid #444;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 70px; font-weight: 600; vertical-align: top;">ลูกค้า<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Customer</span></td>
                <td style="vertical-align: top; font-weight: 600;">${invoice.CUSCOD}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight: 600; font-size: 11.5px; padding-top: 2px;">
                  ${customer?.PRENAM ? customer.PRENAM + " " : ""}${customer?.CUSNAM || ""}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color: #333; line-height: 1.35; padding-top: 2px;">
                  ${customer?.ADDR01 || ""} ${customer?.ADDR02 || ""}<br>
                  ${customer?.ADDR03 || ""} ${customer?.ZIPCOD || ""}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color: #333; padding-top: 2px;">
                  โทร. ${customer?.TELNUM || "-"}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color: #333; padding-top: 2px;">
                  <span style="font-weight: 600;">เลขประจำตัวผู้เสียภาษี</span> &nbsp; <span class="font-mono">${customer?.TAXID || "-"}</span> &nbsp;&nbsp;&nbsp; <span>☑ ${customer?.ORGNUM ? `สาขาที่ ${customer.ORGNUM}` : "สำนักงานใหญ่"}</span>
                </td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">อ้างอิง<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Reference</span></td>
                <td style="padding-top: 2px; font-weight: 600;">${invoice.YOUREF || "-"}</td>
              </tr>
            </table>
          </td>

          <!-- Right: Document Info -->
          <td style="width: 45%; vertical-align: top; padding: 6px 10px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="font-weight: 600; width: 100px;">เลขที่<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">No.</span></td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 12.5px;">${invoice.DOCNUM}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">วันที่<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Date</span></td>
                <td style="text-align: right; padding-top: 2px; font-weight: 600;">${fmtThaiDateShort(invoice.DOCDAT)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 2px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="font-weight: 600;">เครดิต<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Credit</span></td>
                      <td style="text-align: right; font-weight: 600;">${invoice.PAYTRM || 0} &nbsp; วัน <span style="font-size: 9px; color: #555;">Days</span></td>
                      <td style="text-align: right; font-weight: 600; padding-left: 10px;">ครบกำหนด<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Due Date</span></td>
                      <td style="text-align: right; font-weight: 600;">${fmtThaiDateShort(invoice.DUEDAT)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">เลขที่ใบสั่งขาย<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Sales Order No.</span></td>
                <td style="text-align: right; padding-top: 2px; font-family: monospace;">${invoice.SONUM || "-"}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">พนักงานขาย<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Salesman</span></td>
                <td style="text-align: right; padding-top: 2px;">${invoice.SLMCOD || "-"}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">เขตการขาย<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Territory</span></td>
                <td style="text-align: right; padding-top: 2px;">${invoice.AREACOD || "-"}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <div class="box-bordered" style="margin-bottom: 0; border-bottom: none; border-bottom-left-radius: 0; border-bottom-right-radius: 0;">
        <table class="items-table">
          <thead>
            <tr style="background-color: ${p.tableHeaderBg};">
              <th style="width: 6%;">ลำดับ<br><span style="font-size: 9px; font-weight: 400;">No.</span></th>
              <th style="width: 48%; text-align: left;">รหัสสินค้า/รายละเอียด<br><span style="font-size: 9px; font-weight: 400;">Code/ Descriptions</span></th>
              <th style="width: 14%; text-align: right;">จำนวน<br><span style="font-size: 9px; font-weight: 400;">Quantity</span></th>
              <th style="width: 14%; text-align: right;">หน่วยละ<br><span style="font-size: 9px; font-weight: 400;">Unit Price</span></th>
              <th style="width: 18%; text-align: right;">จำนวนเงิน<br><span style="font-size: 9px; font-weight: 400;">Amount</span></th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (it, idx) => `
              <tr>
                <td style="text-align: center; font-family: monospace;">${it.SEQNUM ? parseInt(it.SEQNUM, 10) : idx + 1}</td>
                <td style="text-align: left;">
                  ${it.STKCOD ? `<span style="font-family: monospace; font-weight: 600;">${it.STKCOD}/ </span>` : ""}
                  ${it.STKDES || ""}
                </td>
                <td style="text-align: right; font-family: monospace;">${it.TRNQTY.toFixed(2)} ${it.TQUCOD || ""}</td>
                <td style="text-align: right; font-family: monospace;">${fmtMoney(it.UNITPR)}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmtMoney(it.TRNVAL)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Calculations & Summary -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 0; border-top-left-radius: 0; border-top-right-radius: 0;">
        <tr>
          <!-- Left: Receipt Notice & E.&O.E. -->
          <td style="width: 60%; vertical-align: top; padding: 6px 10px; border-right: 1px solid #444; position: relative;">
            <div style="font-size: 9.5px; color: #333; line-height: 1.35; min-height: 38px;">
              ${
                p.showReceiptNote
                  ? "ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์ต่อเมื่อมีลายเซ็นผู้รับมอบอำนาจและลายเซ็นผู้รับเงิน และได้เรียกเก็บเงินตามเช็คเรียบร้อยแล้ว"
                  : ""
              }
            </div>
          </td>

          <!-- Right: Summary Table -->
          <td style="width: 40%; vertical-align: top; padding: 4px 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="font-weight: 600;">รวมเป็นเงิน<br><span style="font-size: 9px; font-weight: 400; color: #555;">Gross Amount</span></td>
                <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmtMoney(invoice.AMOUNT)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">หักส่วนลด<br><span style="font-size: 9px; font-weight: 400; color: #555;">Less Discount</span></td>
                <td style="text-align: right; font-family: monospace; padding-top: 2px;">${fmtMoney(invoice.DISCAMT)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">ยอดหลังหักส่วนลด<br><span style="font-size: 9px; font-weight: 400; color: #555;">After Discount</span></td>
                <td style="text-align: right; font-family: monospace; padding-top: 2px;">${fmtMoney(invoice.AFTDISC || invoice.AMOUNT - invoice.DISCAMT)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">หักเงินมัดจำ<br><span style="font-size: 9px; font-weight: 400; color: #555;">Less Deposit</span></td>
                <td style="text-align: right; font-family: monospace; padding-top: 2px;">${fmtMoney(invoice.ADVAMT || 0)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">ยอดหลังหักเงินมัดจำ<br><span style="font-size: 9px; font-weight: 400; color: #555;">After Deposit</span></td>
                <td style="text-align: right; font-family: monospace; padding-top: 2px;">${fmtMoney((invoice.AFTDISC || invoice.AMOUNT - invoice.DISCAMT) - (invoice.ADVAMT || 0))}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">
                  จำนวนภาษีมูลค่าเพิ่ม &nbsp; <span class="font-mono">${invoice.VATRAT || 7}.00</span> %<br>
                  <span style="font-size: 9px; font-weight: 400; color: #555;">VAT</span>
                </td>
                <td style="text-align: right; font-family: monospace; padding-top: 2px; font-weight: 600;">${fmtMoney(invoice.VATAMT)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Full-width Colored Total Bar -->
        <tr style="background-color: ${p.summaryBg}; border-top: 1px solid #444;">
          <td style="padding: 6px 10px; font-weight: 700; border-right: 1px solid #444; font-size: 11.5px;">
            (${bahtText(invoice.NETAMT)})
          </td>
          <td style="padding: 6px 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: 700; font-size: 11.5px;">จำนวนเงินรวมทั้งสิ้น<br><span style="font-size: 9px; font-weight: 400;">Total Invoice</span></td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 13.5px;">${fmtMoney(invoice.NETAMT)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Bottom Conditions & Signatures Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
        <tr>
          <!-- Left: Received & Delivery -->
          <td style="width: 32%; vertical-align: top; padding: 6px 8px; border-right: 1px solid #444;">
            <div style="font-weight: 700; text-align: center; margin-bottom: 14px;">ได้รับสินค้าตามรายการถูกต้องแล้ว</div>
            <div style="margin-bottom: 12px;">
              <table style="width: 100%;">
                <tr>
                  <td style="border-bottom: 1px solid #444; width: 65%;"></td>
                  <td style="width: 5%;"></td>
                  <td style="border-bottom: 1px solid #444; width: 30%;"></td>
                </tr>
                <tr>
                  <td style="font-size: 9.5px; padding-top: 2px;">ผู้รับสินค้า/ Goods Received by</td>
                  <td></td>
                  <td style="font-size: 9.5px; text-align: center; padding-top: 2px;">วันที่/ Date</td>
                </tr>
              </table>
            </div>
            <div>
              <table style="width: 100%;">
                <tr>
                  <td style="border-bottom: 1px solid #444; width: 65%;"></td>
                  <td style="width: 5%;"></td>
                  <td style="border-bottom: 1px solid #444; width: 30%;"></td>
                </tr>
                <tr>
                  <td style="font-size: 9.5px; padding-top: 2px;">ผู้ส่งสินค้า/ Delivery by</td>
                  <td></td>
                  <td style="font-size: 9.5px; text-align: center; padding-top: 2px;">วันที่/ Date</td>
                </tr>
              </table>
            </div>
          </td>

          <!-- Middle: Conditions -->
          <td style="width: 35%; vertical-align: top; padding: 6px 8px; border-right: 1px solid #444; font-size: 9.5px; line-height: 1.4; color: #222;">
            <div>o สินค้านี้ขายขาดไม่รับคืนหรือเปลี่ยน</div>
            <div>o บริษัทฯ จะนำใบแจ้งหนี้มาเรียกเก็บเงินในภายหลัง</div>
            <div>o บริษัทฯ จะคิดดอกเบี้ย 1.25% ต่อเดือน เมื่อชำระบิลเกินกำหนด</div>
            <div>o กรุณาชำระเงินด้วยเช็ค ในนามบริษัท ธงธัญ 99 จำกัด ขีดผู้ถือและขีดคล่อมเท่านั้น</div>
          </td>

          <!-- Right: Authorized Signatures -->
          <td style="width: 33%; vertical-align: top; padding: 6px 8px; text-align: center;">
            <div style="font-size: 9.5px; color: #333;">ในนาม</div>
            <div style="font-weight: 700; font-size: 11px; margin-bottom: 18px;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>
            
            <div style="margin-bottom: 12px;">
              ${signatureBase64 ? `
                <div style="margin-bottom: -10px;">
                  <img src="${signatureBase64}" style="height: 72px; width: auto; display: inline-block; vertical-align: bottom;" />
                </div>
              ` : `
                <div style="height: 24px;"></div>
              `}
              <div style="border-bottom: 1px solid #444; width: 85%; margin: 0 auto;"></div>
              <div style="font-size: 9.5px; margin-top: 2px;">ผู้รับมอบอำนาจ/ Authorized Signature</div>
            </div>

            <div>
              <div style="border-bottom: 1px solid #444; width: 85%; margin: 0 auto;"></div>
              <div style="font-size: 9.5px; margin-top: 2px;">ผู้ตรวจเช็คสินค้า/ Approved by</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>
  `
  ).join("")}
</body>
</html>
`;
}

export function generateAdvanceInvoiceHtml(data: {
  invoice: any;
  customer?: any;
  items: any[];
  remarks?: any[];
  company?: any;
}): string {
  const { invoice, customer, items, company } = data;

  const logoBase64 = getCompanyLogoBase64();
  const watermarkBase64 = getWatermarkLogoBase64();
  const signatureBase64 = getAuthorizedSignatureBase64();

  const fmtThaiDateShort = (d: Date | string | null | undefined): string => {
    if (!d) return "-";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "-";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const buddhistYear = dateObj.getFullYear() + 543;
    const yearShort = String(buddhistYear % 100).padStart(2, "0");
    return `${day}/${month}/${yearShort}`;
  };

  const grossAmount = invoice.AMOUNT || 0;
  const vatRate = invoice.VATRAT || 7;
  const vatAmount = invoice.VATAMT || 0;
  const netAmount = invoice.NETAMT || 0;
  const taxWithheld = invoice.TAX || 0;
  const isCash = (invoice.CSHRCV || 0) > 0;
  const isCheque = (invoice.CHQRCV || 0) > 0;

  const ADVANCE_PAGES = [
    {
      page: 1,
      title: "ใบรับเงินมัดจำ/ใบกำกับภาษี",
      subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
      headerBg: "#9ec5f7",
      tableHeaderBg: "#cde3fc",
      summaryBg: "#9ec5f7",
    },
    {
      page: 2,
      title: "ใบรับเงินมัดจำ/ใบกำกับภาษี",
      subtitle: "สำเนา (สำหรับฝ่ายบัญชี)",
      headerBg: "#ffa439",
      tableHeaderBg: "#ffd296",
      summaryBg: "#ffa439",
    },
    {
      page: 3,
      title: "ใบรับเงินมัดจำ/ใบแจ้งหนี้",
      subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
      headerBg: "#fde047",
      tableHeaderBg: "#fef9c3",
      summaryBg: "#fde047",
    },
  ];

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
    @page {
      size: A4;
      margin: 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Sarabun', 'Noto Sans Thai', Tahoma, sans-serif;
    }
    body {
      font-size: 11.5px;
      line-height: 1.3;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .advance-page {
      page-break-after: always;
      position: relative;
      min-height: 278mm;
      max-height: 284mm;
      box-sizing: border-box;
      padding-bottom: 2mm;
    }
    .advance-page:last-child {
      page-break-after: avoid;
    }
    .watermark-layer {
      position: absolute;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 410px;
      opacity: 0.13;
      pointer-events: none;
      z-index: 0;
    }
    .content-layer {
      position: relative;
      z-index: 1;
    }
    .company-logo {
      height: 56px;
      width: 56px;
      object-fit: contain;
      margin-right: 12px;
    }
    .box-bordered {
      border: 1px solid #444;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .items-table th {
      border-bottom: 1px solid #444;
      border-right: 1px solid #444;
      padding: 5px 6px;
      font-weight: 600;
      text-align: center;
    }
    .items-table th:last-child {
      border-right: none;
    }
    .items-table td {
      border-right: 1px solid #444;
      border-bottom: 1px solid #eee;
      padding: 4px 8px;
      vertical-align: top;
    }
    .items-table td:last-child {
      border-right: none;
    }
    .font-mono { font-family: monospace; }
  </style>
</head>
<body>
  ${ADVANCE_PAGES.map(
    (p) => `
  <div class="advance-page">
    ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark-layer" alt="Watermark" />` : ""}

    <div class="content-layer">
      <!-- Header -->
      <table style="width: 100%; margin-bottom: 4px; border-collapse: collapse;">
        <tr>
          <!-- Company details on Left -->
          <td style="vertical-align: top; width: 60%;">
            <div style="display: flex; align-items: flex-start;">
              ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo" />` : ""}
              <div>
                <div style="font-size: 15px; font-weight: 700; color: #000;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>
                <div style="font-size: 11px; color: #333; margin-top: 1px;">
                  ${company?.ADDR01 || ""} ${company?.ADDR02 || ""}<br>
                  ${company?.TELNUM || "โทรศัพท์. 02-896-8068-9 แฟกซ์.02-896-8065"}
                </div>
                <div style="font-size: 11px; color: #333; margin-top: 2px;">
                  <span style="font-weight: 600;">เลขประจำตัวผู้เสียภาษี/ Tax ID</span> &nbsp; <span class="font-mono font-bold">${company?.TAXID || "0105558016255"}</span> &nbsp;&nbsp;&nbsp; สำนักงานใหญ่
                </div>
              </div>
            </div>
          </td>

          <!-- Colored Header Pill on Right -->
          <td style="vertical-align: top; width: 40%; text-align: right; padding-top: 4px;">
            <div style="display: inline-block; background-color: ${p.headerBg}; border-radius: 10px; padding: 5px 14px; text-align: center; border: 1px solid rgba(0,0,0,0.15); min-width: 210px;">
              <div style="font-size: 15px; font-weight: 700; color: #000; letter-spacing: 0.3px;">${p.title}</div>
              <div style="font-size: 12px; font-weight: 600; color: #111; margin-top: 1px;">${p.subtitle}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Customer & Document Info Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <tr>
          <!-- Left: Customer -->
          <td style="width: 55%; vertical-align: top; padding: 6px 10px; border-right: 1px solid #444;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 65px; font-weight: 600; vertical-align: top;">ลูกค้า<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Customer</span></td>
                <td style="vertical-align: top; font-weight: 600;">${invoice.CUSCOD}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight: 600; font-size: 11.5px; padding-top: 2px;">
                  ${customer?.PRENAM ? customer.PRENAM + " " : ""}${customer?.CUSNAM || ""}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color: #333; line-height: 1.35; padding-top: 2px;">
                  ${customer?.ADDR01 || ""} ${customer?.ADDR02 || ""}<br>
                  ${customer?.ADDR03 || ""} ${customer?.ZIPCOD || ""}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color: #333; padding-top: 2px;">
                  โทร. ${customer?.TELNUM || "-"}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color: #333; padding-top: 2px;">
                  <span style="font-weight: 600;">เลขประจำตัวผู้เสียภาษี</span> &nbsp; <span class="font-mono">${customer?.TAXID || "-"}</span> &nbsp;&nbsp;&nbsp; <span>☑ ${customer?.ORGNUM ? `สาขาที่ ${customer.ORGNUM}` : "สำนักงานใหญ่"}</span>
                </td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">อ้างอิง<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Reference</span></td>
                <td style="padding-top: 2px; font-weight: 600;">${invoice.YOUREF || "-"}</td>
              </tr>
            </table>
          </td>

          <!-- Right: Document Info -->
          <td style="width: 45%; vertical-align: top; padding: 6px 10px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="font-weight: 600; width: 80px;">เลขที่<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">No.</span></td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 12.5px;">${invoice.DOCNUM}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 4px;">วันที่<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Date</span></td>
                <td style="text-align: right; padding-top: 4px; font-weight: 600;">${fmtThaiDateShort(invoice.DOCDAT)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 6px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="font-weight: 600;">เครดิต<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Credit</span></td>
                      <td style="text-align: right; font-weight: 600;">${invoice.PAYTRM || 0} &nbsp; วัน <span style="font-size: 9px; color: #555;">Days</span></td>
                      <td style="text-align: right; font-weight: 600; padding-left: 10px;">ครบกำหนด<br><span style="font-size: 9.5px; font-weight: 400; color: #555;">Due Date</span></td>
                      <td style="text-align: right; font-weight: 600;">${fmtThaiDateShort(invoice.DUEDAT)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Items Table Box (3 Columns) -->
      <div class="box-bordered" style="margin-bottom: 0; border-bottom: none; border-bottom-left-radius: 0; border-bottom-right-radius: 0;">
        <table class="items-table">
          <thead>
            <tr style="background-color: ${p.tableHeaderBg};">
              <th style="width: 8%;">ลำดับ<br><span style="font-size: 9px; font-weight: 400;">No.</span></th>
              <th style="width: 67%; text-align: left; padding-left: 14px;">รายการ/รายละเอียด<br><span style="font-size: 9px; font-weight: 400;">Items/ Descriptions</span></th>
              <th style="width: 25%; text-align: right; padding-right: 14px;">จำนวนเงิน<br><span style="font-size: 9px; font-weight: 400;">Amount</span></th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (it, idx) => `
              <tr>
                <td style="text-align: center; font-family: monospace;">${it.SEQNUM ? parseInt(it.SEQNUM, 10) : idx + 1}</td>
                <td style="text-align: left; padding-left: 14px; font-weight: 500;">
                  ${it.STKDES || it.STKCOD || "ค่ามัดจำ"}
                </td>
                <td style="text-align: right; padding-right: 14px; font-family: monospace; font-weight: 600;">${fmtMoney(it.TRNVAL || grossAmount)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Calculations & Summary Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 0; border-top-left-radius: 0; border-top-right-radius: 0;">
        <tr>
          <!-- Left: Empty (60%) -->
          <td style="width: 60%; vertical-align: top; padding: 6px 10px; border-right: 1px solid #444;">
          </td>

          <!-- Right: Summary Table (40%) -->
          <td style="width: 40%; vertical-align: top; padding: 6px 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="font-weight: 600;">จำนวนเงิน<br><span style="font-size: 9px; font-weight: 400; color: #555;">Amount</span></td>
                <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmtMoney(grossAmount)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 4px;">
                  จำนวนภาษีมูลค่าเพิ่ม &nbsp; <span class="font-mono">${vatRate}.00</span> %<br>
                  <span style="font-size: 9px; font-weight: 400; color: #555;">VAT</span>
                </td>
                <td style="text-align: right; font-family: monospace; padding-top: 4px; font-weight: 600;">${fmtMoney(vatAmount)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Full-width Colored Total Bar -->
        <tr style="background-color: ${p.summaryBg}; border-top: 1px solid #444;">
          <td style="padding: 6px 10px; font-weight: 700; border-right: 1px solid #444; font-size: 11.5px;">
            (${bahtText(netAmount)})
          </td>
          <td style="padding: 6px 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: 700; font-size: 11.5px;">จำนวนเงินรวมทั้งสิ้น<br><span style="font-size: 9px; font-weight: 400;">Total Invoice</span></td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 13.5px;">${fmtMoney(netAmount)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Bottom Payment Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <tr>
          <td colspan="2" style="padding: 5px 8px; border-bottom: 1px solid #444; font-size: 9.5px; color: #333;">
            ใบรับเงินมัดจำฉบับนี้จะสมบูรณ์ต่อเมื่อมีลายเซ็นผู้รับมอบอำนาจและลายเซ็นผู้รับเงิน และได้เรียกเก็บเงินตามเช็คเรียบร้อยแล้ว
          </td>
        </tr>
        <tr>
          <!-- Left: Payment details -->
          <td style="width: 65%; vertical-align: top; padding: 6px 8px; border-right: 1px solid #444;">
            <div style="margin-bottom: 6px;">
              <span style="font-weight: 600;">ชำระเงินโดย</span> &nbsp;&nbsp;&nbsp;
              <span>${isCash ? "☑" : "☐"} เงินสด</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span>${isCheque ? "☑" : "☐"} เช็ค</span>
            </div>
            <div style="margin-bottom: 4px;">
              เช็คธนาคาร____________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; สาขา________________
            </div>
            <div style="margin-bottom: 4px;">
              เลขที่__________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; วันที่ ____/_____/_______
            </div>
            <div style="margin-bottom: 4px;">
              จำนวนเงิน ${fmtMoney(netAmount)} บาท
            </div>
            <div style="margin-bottom: 8px;">
              ภาษีหัก ณ ที่จ่าย ${taxWithheld > 0 ? fmtMoney(taxWithheld) : "___________________________________"}
            </div>

            <!-- Signatures: Payer & Collector -->
            <table style="width: 100%; text-align: center; margin-top: 10px;">
              <tr>
                <td style="width: 45%;">
                  <div style="border-bottom: 1px solid #444; width: 85%; margin: 0 auto; height: 18px;"></div>
                  <div style="font-size: 9.5px; margin-top: 2px;">ผู้ชำระเงิน/ Payer</div>
                </td>
                <td style="width: 55%;">
                  <table style="width: 90%; margin: 0 auto;">
                    <tr>
                      <td style="border-bottom: 1px solid #444; width: 65%;"></td>
                      <td style="width: 5%;"></td>
                      <td style="border-bottom: 1px solid #444; width: 30%;"></td>
                    </tr>
                    <tr>
                      <td style="font-size: 9.5px; padding-top: 2px;">ผู้รับเงิน/ Collector</td>
                      <td></td>
                      <td style="font-size: 9.5px; text-align: center; padding-top: 2px;">วันที่/ Date</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>

          <!-- Right: Authorized Signatures -->
          <td style="width: 35%; vertical-align: top; padding: 6px 8px; text-align: center;">
            <div style="font-size: 9.5px; color: #333;">ในนาม</div>
            <div style="font-weight: 700; font-size: 11px; margin-bottom: 18px;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>

            <div style="margin-bottom: 12px;">
              ${signatureBase64 ? `
                <div style="margin-bottom: -10px;">
                  <img src="${signatureBase64}" style="height: 72px; width: auto; display: inline-block; vertical-align: bottom;" />
                </div>
              ` : `
                <div style="height: 24px;"></div>
              `}
              <div style="border-bottom: 1px solid #444; width: 85%; margin: 0 auto;"></div>
              <div style="font-size: 9.5px; margin-top: 2px;">ผู้รับมอบอำนาจ/ Authorized Signature</div>
            </div>

            <div>
              <div style="border-bottom: 1px solid #444; width: 85%; margin: 0 auto;"></div>
              <div style="font-size: 9.5px; margin-top: 2px;">ผู้ตรวจสอบ/ Approved by</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>
  `
  ).join("")}
</body>
</html>
`;
}


export function generateSalesReturnHtml(data: {
  invoice: any;
  customer?: any;
  items: any[];
  remarks?: any[];
  company?: any;
}): string {
  const { invoice, customer, items, remarks, company } = data;

  const logoBase64 = getCompanyLogoBase64();
  const watermarkBase64 = getWatermarkLogoBase64();
  const signatureBase64 = getAuthorizedSignatureBase64();

  const fmtThaiDateShort = (d: Date | string | null | undefined): string => {
    if (!d) return "-";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "-";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const buddhistYear = dateObj.getFullYear() + 543;
    const yearShort = String(buddhistYear % 100).padStart(2, "0");
    return `${day}/${month}/${yearShort}`;
  };

  const grossAmount = invoice.AMOUNT || 0;
  const discountAmt = invoice.DISCAMT || 0;
  const afterDiscount = invoice.AFTDISC || grossAmount - discountAmt;
  const vatRate = invoice.VATRAT || 7;
  const vatAmount = invoice.VATAMT || 0;
  const netAmount = invoice.NETAMT || 0;
  const origInvoiceVal = invoice.IVCAMT || afterDiscount;
  const correctVal = 0;
  const diffVal = origInvoiceVal - correctVal;

  const ITEMS_PER_PAGE = 11;
  const pageChunks: any[][] = [];
  if (items.length <= ITEMS_PER_PAGE) {
    pageChunks.push(items);
  } else {
    for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
      pageChunks.push(items.slice(i, i + ITEMS_PER_PAGE));
    }
  }

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
    @page {
      size: A4;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Sarabun', 'Noto Sans Thai', Tahoma, sans-serif;
    }
    body {
      font-size: 11.5px;
      line-height: 1.35;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .sr-page {
      page-break-after: always;
      position: relative;
      min-height: 278mm;
      max-height: 284mm;
      box-sizing: border-box;
      padding-bottom: 2mm;
    }
    .sr-page:last-child {
      page-break-after: avoid;
    }
    .watermark-layer {
      position: absolute;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 410px;
      opacity: 0.12;
      pointer-events: none;
      z-index: 0;
    }
    .content-layer {
      position: relative;
      z-index: 1;
    }
    .company-logo {
      height: 56px;
      width: 56px;
      object-fit: contain;
      margin-right: 12px;
    }
    .box-bordered {
      border: 1px solid #444;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .items-table th {
      border-bottom: 1px solid #444;
      border-right: 1px solid #444;
      padding: 4px 6px;
      font-weight: 600;
      text-align: center;
      background-color: rgba(245, 245, 245, 0.6);
    }
    .items-table th:last-child {
      border-right: none;
    }
    .items-table td {
      border-right: 1px solid #444;
      border-bottom: 1px solid #eee;
      padding: 3.5px 6px;
      vertical-align: top;
    }
    .items-table td:last-child {
      border-right: none;
    }
    .font-mono { font-family: monospace; }
  </style>
</head>
<body>
  ${pageChunks
    .map(
      (chunkItems, pIdx) => `
  <div class="sr-page">
    ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark-layer" alt="Watermark" />` : ""}

    <div class="content-layer">
      <!-- Header -->
      <table style="width: 100%; margin-bottom: 4px; border-collapse: collapse;">
        <tr>
          <!-- Company details on Left -->
          <td style="vertical-align: top; width: 62%;">
            <div style="display: flex; align-items: flex-start;">
              ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo" />` : ""}
              <div>
                <div style="font-size: 15px; font-weight: 700; color: #000;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>
                <div style="font-size: 11px; color: #333; margin-top: 1px;">
                  ${company?.ADDR01 || ""} ${company?.ADDR02 || ""}<br>
                  ${company?.TELNUM || "โทรศัพท์. 02-896-8068-9 แฟกซ์.02-896-8065"}
                </div>
                <div style="font-size: 11px; color: #333; margin-top: 2px;">
                  <span style="font-weight: 600;">เลขประจำตัวผู้เสียภาษี</span> &nbsp; <span class="font-mono font-bold">${company?.TAXID || "0105558016255"}</span>
                </div>
              </div>
            </div>
          </td>

          <!-- Title on Right -->
          <td style="vertical-align: top; width: 38%; text-align: right; padding-top: 4px;">
            <div style="font-size: 17px; font-weight: 700; color: #000; letter-spacing: 0.5px;">
              ใบลดหนี้/ รับคืนสินค้า
            </div>
          </td>
        </tr>
      </table>

      <!-- Customer & Document Info Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 5px;">
        <tr>
          <!-- Left: Customer Info -->
          <td style="width: 55%; vertical-align: top; padding: 6px 10px; border-right: 1px solid #444;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50px; font-weight: 600; vertical-align: top;">ลูกค้า</td>
                <td style="vertical-align: top; font-weight: 600;">${invoice.CUSCOD}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight: 600; font-size: 11.5px; padding-top: 2px;">
                  ${customer?.PRENAM ? customer.PRENAM + " " : ""}${customer?.CUSNAM || ""}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color: #333; line-height: 1.35; padding-top: 2px;">
                  ${customer?.ADDR01 || ""}<br>
                  ${customer?.ADDR02 || ""}<br>
                  ${customer?.ADDR03 || ""} ${customer?.ZIPCOD || ""}
                </td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 4px;">อ้างอิง</td>
                <td style="padding-top: 4px; color: #333;">${invoice.YOUREF || "-"}</td>
              </tr>
            </table>
          </td>

          <!-- Right: Document Info -->
          <td style="width: 45%; vertical-align: top; padding: 6px 10px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="font-weight: 600; width: 110px;">เลขที่ใบลดหนี้</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 12.5px;">${invoice.DOCNUM}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 3px;">วันที่</td>
                <td style="text-align: right; padding-top: 3px; font-weight: 600;">${fmtThaiDateShort(invoice.DOCDAT)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 3px;">อ้างถึงใบกำกับภาษี</td>
                <td style="text-align: right; padding-top: 3px; font-family: monospace;">
                  ${invoice.SONUM || "-"} ${invoice.SODAT ? fmtThaiDateShort(invoice.SODAT) : ""}
                </td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 3px;">พนักงานขาย</td>
                <td style="text-align: right; padding-top: 3px;">${invoice.SLMCOD || "-"}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 3px;">เขตการขาย</td>
                <td style="text-align: right; padding-top: 3px;">${invoice.AREACOD || "-"}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Subheader notice -->
      <div style="font-size: 11px; font-weight: 500; margin-bottom: 5px;">
        บริษัทได้รับคืนสินค้าและเครดิตบัญชีของท่านตามรายการต่อไปนี้ :-
      </div>

      <!-- Items Table Box -->
      <div class="box-bordered" style="margin-bottom: 0; border-bottom: none; border-bottom-left-radius: 0; border-bottom-right-radius: 0;">
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">No.</th>
              <th style="width: 41%; text-align: left;">รหัสสินค้า/รายละเอียด</th>
              <th style="width: 7%;">คลัง</th>
              <th style="width: 8%;">รับคืน?</th>
              <th style="width: 11%; text-align: right;">จำนวน</th>
              <th style="width: 12%; text-align: right;">หน่วยละ</th>
              <th style="width: 6%; text-align: right;">ส่วนลด</th>
              <th style="width: 10%; text-align: right;">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${chunkItems
              .map(
                (it, idx) => `
              <tr>
                <td style="text-align: center; font-family: monospace;">${it.SEQNUM ? parseInt(it.SEQNUM, 10) : pIdx * ITEMS_PER_PAGE + idx + 1}</td>
                <td style="text-align: left;">
                  <span style="font-family: monospace; font-weight: 600;">${it.STKCOD}</span>
                  ${it.STKDES || ""}
                </td>
                <td style="text-align: center; font-family: monospace;">${it.LOCCOD || "-"}</td>
                <td style="text-align: center; font-family: monospace;">${it.RETSTK || "Y"}</td>
                <td style="text-align: right; font-family: monospace;">${it.TRNQTY.toFixed(2)} ${it.TQUCOD || ""}</td>
                <td style="text-align: right; font-family: monospace;">${it.UNITPR.toFixed(4)}</td>
                <td style="text-align: right; font-family: monospace;">${it.DISC || ""}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmtMoney(it.TRNVAL)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      ${
        pIdx === pageChunks.length - 1
          ? `
      <!-- Calculations & Summary Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 0; border-top-left-radius: 0; border-top-right-radius: 0;">
        <tr>
          <!-- Left: Reason for return -->
          <td style="width: 50%; vertical-align: top; padding: 6px 10px; border-right: 1px solid #444;">
            <div style="font-weight: 600; margin-bottom: 4px;">สาเหตุที่รับคืน:</div>
            <div style="color: #333;">
              ${
                remarks && remarks.length > 0
                  ? remarks.map((r: any) => `<div>${r.REMARK}</div>`).join("")
                  : "-"
              }
            </div>
          </td>

          <!-- Right: Summary Table -->
          <td style="width: 50%; vertical-align: top; padding: 4px 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="text-align: right; padding: 1.5px 4px;">รวม</td>
                <td style="text-align: right; font-family: monospace; font-weight: 600; width: 100px;">${fmtMoney(grossAmount)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 1.5px 4px;">หักส่วนลด ${discountAmt > 0 ? fmtMoney(discountAmt) : ""}</td>
                <td style="text-align: right; font-family: monospace; width: 100px;">${fmtMoney(discountAmt)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 1.5px 4px;">จำนวนเงินหลังหักส่วนลด</td>
                <td style="text-align: right; font-family: monospace; font-weight: 600; width: 100px;">${fmtMoney(afterDiscount)}</td>
              </tr>
              <tr style="border-top: 1px dashed #aaa;">
                <td style="text-align: right; padding: 1.5px 4px;">มูลค่าของสินค้าหรือบริการตามใบกำกับภาษีเดิม</td>
                <td style="text-align: right; font-family: monospace; width: 100px;">${fmtMoney(origInvoiceVal)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 1.5px 4px;">มูลค่าของสินค้าหรือบริการที่ถูกต้อง</td>
                <td style="text-align: right; font-family: monospace; width: 100px;">${fmtMoney(correctVal)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 1.5px 4px;">ผลต่าง</td>
                <td style="text-align: right; font-family: monospace; width: 100px;">${fmtMoney(diffVal)}</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 1.5px 4px;">จำนวนภาษีมูลค่าเพิ่ม ${vatRate.toFixed(2)} %</td>
                <td style="text-align: right; font-family: monospace; font-weight: 600; width: 100px;">${fmtMoney(vatAmount)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Full-width Total Row -->
        <tr style="background-color: rgba(245, 245, 245, 0.7); border-top: 1px solid #444;">
          <td style="padding: 6px 10px; font-weight: 600; border-right: 1px solid #444;">
            (${bahtText(netAmount)}).
          </td>
          <td style="padding: 6px 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: 700;">จำนวนเงินรวมทั้งสิ้น</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 13px;">${fmtMoney(netAmount)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Bottom Signatures Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px;">
        <tr>
          <!-- Left: Received -->
          <td style="width: 60%; vertical-align: top; padding: 8px 12px; border-right: 1px solid #444;">
            <table style="width: 100%; text-align: center;">
              <tr>
                <td style="width: 50%;">ได้รับสินค้าข้างต้นคืนเรียบร้อยแล้ว</td>
                <td style="width: 50%;">ได้เก็บสินค้าข้างต้นในคลังสินค้าแล้ว</td>
              </tr>
              <tr>
                <td style="padding-top: 25px;">___________________</td>
                <td style="padding-top: 25px;">____________________</td>
              </tr>
              <tr>
                <td style="font-size: 9.5px; padding-top: 2px;">แผนกรับสินค้า</td>
                <td style="font-size: 9.5px; padding-top: 2px;">แผนกคลังสินค้า</td>
              </tr>
            </table>
          </td>

          <!-- Right: Authorized -->
          <td style="width: 40%; vertical-align: top; padding: 8px 12px; text-align: center;">
            <div style="font-size: 9.5px; color: #333;">ในนาม</div>
            <div style="font-weight: 700; font-size: 11px; margin-bottom: 14px;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>
            <div>
              ${signatureBase64 ? `
                <div style="margin-bottom: -10px;">
                  <img src="${signatureBase64}" style="height: 72px; width: auto; display: inline-block; vertical-align: bottom;" />
                </div>
              ` : `
                <div style="height: 24px;"></div>
              `}
              <div style="border-bottom: 1px solid #444; width: 75%; margin: 0 auto;"></div>
              <div style="font-size: 9.5px; margin-top: 2px;">ผู้รับมอบอำนาจ</div>
            </div>
          </td>
        </tr>
      </table>
      `
          : `
      <!-- Table bottom border on continuation pages -->
      <div style="border-bottom: 1px solid #444; height: 1px; width: 100%;"></div>
      <div style="text-align: right; font-size: 10px; color: #555; margin-top: 4px;">
        (ต่อหน้าถัดไป)
      </div>
      `
      }
    </div>
  </div>
  `
    )
    .join("")}
</body>
</html>
`;
}


export function generateQuotationHtml(data: {
  quotation: any;
  customer?: any;
  items: any[];
  remarks?: any[];
  company?: any;
  showItemCode?: boolean;
}): string {
  const { quotation, customer, items, remarks, company, showItemCode = true } = data;

  const logoBase64 = getCompanyLogoBase64();
  const watermarkBase64 = getWatermarkLogoBase64();

  const fmtThaiDateShort = (d: Date | string | null): string => {
    if (!d) return "-";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "-";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const buddhistYear = dateObj.getFullYear() + 543;
    const yearShort = String(buddhistYear % 100).padStart(2, "0");
    return `${day}/${month}/${yearShort}`;
  };

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
    @page {
      size: A4;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Sarabun', 'Noto Sans Thai', Tahoma, sans-serif;
    }
    body {
      font-size: 12px;
      line-height: 1.35;
      color: #111;
      margin: 0;
      padding: 0;
      position: relative;
    }
    .watermark {
      position: fixed;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 440px;
      opacity: 0.12;
      pointer-events: none;
      z-index: 0;
    }
    .content-layer {
      position: relative;
      z-index: 1;
    }
    .company-logo {
      height: 58px;
      width: 58px;
      object-fit: contain;
      margin-right: 14px;
    }
    .box-container {
      border: 1px solid #444;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .table-container {
      border: 1px solid #444;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 10px;
      position: relative;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    .items-table th {
      border-bottom: 1px solid #444;
      border-right: 1px solid #444;
      padding: 5px 6px;
      font-weight: 600;
      background-color: rgba(245, 245, 245, 0.6);
      text-align: center;
    }
    .items-table th:last-child {
      border-right: none;
    }
    .items-table td {
      border-right: 1px solid #444;
      border-bottom: 1px solid #ddd;
      padding: 4px 6px;
      vertical-align: top;
    }
    .items-table td:last-child {
      border-right: none;
    }
    .items-table tfoot td {
      border-top: 1px solid #444;
      border-right: 1px solid #444;
      padding: 3px 6px;
      background-color: #fff;
    }
    .items-table tfoot td:last-child {
      border-right: none;
    }
    .font-mono { font-family: monospace; }
  </style>
</head>
<body>
  ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark" alt="Watermark" />` : ""}

  <div class="content-layer">
    <!-- Header with LOGO.bmp -->
    <table style="width: 100%; margin-bottom: 4px;">
      <tr>
        <td style="vertical-align: top;">
          <div style="display: flex; align-items: flex-start;">
            ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo" />` : ""}
            <div>
              <div style="font-size: 15px; font-weight: 700; color: #000;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>
              <div style="font-size: 11.5px; color: #333; margin-top: 1px;">
                ${company?.ADDR01 || ""} ${company?.ADDR02 || ""}<br>
                ${company?.TELNUM || "โทรศัพท์. 02-896-8068-9 แฟกซ์. 02-896-8065"}
              </div>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td style="text-align: right; padding-top: 2px;">
          <div style="font-size: 18px; font-weight: 700; color: #000; letter-spacing: 0.5px;">ใบเสนอราคา</div>
        </td>
      </tr>
    </table>

    <!-- Customer & Quotation Info Box -->
    <table class="box-container" style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
      <tr>
        <!-- Left: Customer -->
        <td style="width: 55%; vertical-align: top; padding: 8px 12px; border-right: 1px solid #444;">
          <div style="font-weight: 600; margin-bottom: 2px;">ถึง</div>
          <div style="font-weight: 600; font-size: 12px;">${customer?.PRENAM ? customer.PRENAM + " " : ""}${customer?.CUSNAM || ""}</div>
          <div style="color: #333; margin-top: 2px; line-height: 1.4;">
            ${customer?.ADDR01 || ""} ${customer?.ADDR02 || ""}<br>
            ${customer?.ADDR03 || ""} ${customer?.ZIPCOD || ""}
          </div>
          <div style="margin-top: 8px; color: #333;">
            โทร. ${customer?.TELNUM || "-"}
          </div>
          <div style="color: #333;">
            อ้างอิง ${quotation.YOUREF || ""}
          </div>
        </td>

        <!-- Right: Document Details -->
        <td style="width: 45%; vertical-align: top; padding: 8px 12px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
            <tr>
              <td style="font-weight: 600; padding: 2px 0;">เลขที่ใบเสนอราคา</td>
              <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 13px; padding: 2px 0;">${quotation.SONUM}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; padding: 4px 0 2px 0;">วันที่</td>
              <td style="text-align: right; padding: 4px 0 2px 0;">${fmtThaiDateShort(quotation.SODAT)}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">
                <span style="font-weight: 600;">ยืนราคา</span> &nbsp; 0 &nbsp; วัน
              </td>
              <td style="text-align: right; padding: 2px 0;">
                <span style="font-weight: 600;">ถึงวันที่</span> ${quotation.DLVDAT ? fmtThaiDateShort(quotation.DLVDAT) : ""}
              </td>
            </tr>
            <tr>
              <td style="font-weight: 600; padding: 2px 0;">เงื่อนไขชำระเงิน</td>
              <td style="text-align: right; padding: 2px 0;">${quotation.PAYTRM > 0 ? `เครดิต ${quotation.PAYTRM} วัน` : "เงินสด"}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="font-size: 11.5px; font-weight: 500; margin-bottom: 6px;">
      บริษัทฯ มีความยินดีที่จะเสนอราคาสินค้าดังต่อไปนี้ :
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 5%;">No.</th>
            <th style="width: 45%; text-align: left;">รหัสสินค้า/รายละเอียด</th>
            <th style="width: 13%; text-align: right;">จำนวน</th>
            <th style="width: 11%; text-align: right;">หน่วยละ</th>
            <th style="width: 11%; text-align: right;">ส่วนลด</th>
            <th style="width: 15%; text-align: right;">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (it, idx) => `
            <tr>
              <td style="text-align: center; font-family: monospace;">${it.SEQNUM ? parseInt(it.SEQNUM, 10) : idx + 1}</td>
              <td style="text-align: left;">
                ${
                  showItemCode && it.STKCOD && it.STKDES && it.STKCOD !== it.STKDES
                    ? `<span style="font-family: monospace; font-weight: 600; color: #1e3a8a; margin-right: 5px;">[${it.STKCOD}]</span>${it.STKDES}`
                    : `${it.STKDES || it.STKCOD}`
                }
              </td>
              <td style="text-align: right; font-family: monospace;">${it.ORDQTY.toFixed(2)} ${it.TQUCOD || ""}</td>
              <td style="text-align: right; font-family: monospace;">${fmtMoney(it.UNITPR)}</td>
              <td style="text-align: right; font-family: monospace;">${it.DISC || (it.DISCAMT > 0 ? fmtMoney(it.DISCAMT) : "")}</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmtMoney(it.TRNVAL)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="border-right: 1px solid #444;"></td>
            <td style="text-align: right; font-weight: 600; white-space: nowrap; border-right: 1px solid #444;">รวมเป็นเงิน</td>
            <td style="text-align: right; font-family: monospace;">${fmtMoney(quotation.AMOUNT)}</td>
          </tr>
          <tr>
            <td colspan="4" style="border-right: 1px solid #444;"></td>
            <td style="text-align: right; font-weight: 600; white-space: nowrap; border-right: 1px solid #444;">
              หัก ส่วนลด ${quotation.DISC ? `<span style="font-family: monospace; margin-left: 4px;">${quotation.DISC.trim()}</span>` : ""}
            </td>
            <td style="text-align: right; font-family: monospace;">${quotation.DISCAMT > 0 ? fmtMoney(quotation.DISCAMT) : ""}</td>
          </tr>
          <tr>
            <td colspan="4" style="border-right: 1px solid #444;"></td>
            <td style="text-align: right; font-weight: 600; white-space: nowrap; border-right: 1px solid #444;">จำนวนเงินหลังหักส่วนลด</td>
            <td style="text-align: right; font-family: monospace;">${fmtMoney(quotation.TOTAL || quotation.AMOUNT - quotation.DISCAMT)}</td>
          </tr>
          <tr>
            <td colspan="4" style="border-right: 1px solid #444;"></td>
            <td style="text-align: right; font-weight: 600; white-space: nowrap; border-right: 1px solid #444;">จำนวนภาษีมูลค่าเพิ่ม ${quotation.VATRAT || 7}.00 %</td>
            <td style="text-align: right; font-family: monospace;">${fmtMoney(quotation.VATAMT)}</td>
          </tr>
          <tr>
            <td colspan="4" style="text-align: left; font-weight: 600; border-right: 1px solid #444;">
              ตัวอักษร: &nbsp; (${bahtText(quotation.NETAMT)})
            </td>
            <td style="text-align: right; font-weight: 700; white-space: nowrap; border-right: 1px solid #444;">จำนวนเงินรวมทั้งสิ้น</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 13px;">${fmtMoney(quotation.NETAMT)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Remarks & Signatures Bottom Box -->
    <table class="box-container" style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
      <tr>
        <!-- Left: Remarks -->
        <td style="width: 48%; vertical-align: top; padding: 8px 12px;">
          <div style="font-weight: 600; margin-bottom: 4px;">หมายเหตุ:</div>
          ${
            remarks && remarks.length > 0
              ? remarks.map((r) => `<div style="line-height: 1.4; color: #222;">${r.REMARK}</div>`).join("")
              : `<div style="color: #888; font-style: italic;">- ไม่มีหมายเหตุ -</div>`
          }
        </td>

        <!-- Right: Signatures -->
        <td style="width: 52%; vertical-align: top; padding: 8px 12px;">
          <div style="text-align: right; font-weight: 600; margin-bottom: 24px;">ขอแสดงความนับถือ</div>
          <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 11px;">
            <tr>
              <td style="width: 33.33%; padding: 0 4px;">
                <div style="border-bottom: 1px solid #444; margin-bottom: 4px;"></div>
                <div>ผู้ตรวจสอบ</div>
              </td>
              <td style="width: 33.33%; padding: 0 4px;">
                <div style="border-bottom: 1px solid #444; margin-bottom: 4px;"></div>
                <div>ผู้รับทราบ</div>
              </td>
              <td style="width: 33.33%; padding: 0 4px;">
                <div style="border-bottom: 1px solid #444; margin-bottom: 4px;"></div>
                <div>ผู้อนุมัติ</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;
}

export function generateBillingHtml(data: {
  billing: any;
  customer?: any;
  invoices: any[];
  remarks?: any[];
  company?: any;
}): string {
  const { billing, customer, invoices, remarks, company } = data;

  const logoBase64 = getCompanyLogoBase64();
  const watermarkBase64 = getWatermarkLogoBase64();

  const fmtThaiDateShort = (d: Date | string | null): string => {
    if (!d) return "-";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "-";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const buddhistYear = dateObj.getFullYear() + 543;
    const yearShort = String(buddhistYear % 100).padStart(2, "0");
    return `${day}/${month}/${yearShort}`;
  };

  const BILLING_PAGES = [
    {
      page: 1,
      title: "ใบวางบิล",
      subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
    },
    {
      page: 2,
      title: "ใบวางบิล",
      subtitle: "สำเนา (สำหรับฝ่ายการเงิน)",
    },
  ];

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
    @page {
      size: A4;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Sarabun', 'Noto Sans Thai', Tahoma, sans-serif;
    }
    body {
      font-size: 11.5px;
      line-height: 1.35;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .billing-page {
      page-break-after: always;
      position: relative;
      min-height: 275mm;
      max-height: 282mm;
      box-sizing: border-box;
      padding-bottom: 4mm;
    }
    .billing-page:last-child {
      page-break-after: avoid;
    }
    .watermark-layer {
      position: absolute;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 410px;
      opacity: 0.13;
      pointer-events: none;
      z-index: 0;
    }
    .content-layer {
      position: relative;
      z-index: 1;
    }
    .company-logo {
      height: 56px;
      width: 56px;
      object-fit: contain;
      margin-right: 12px;
    }
    .box-bordered {
      border: 1px solid #444;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .items-table th {
      border-bottom: 1px solid #444;
      border-right: 1px solid #444;
      padding: 4px 6px;
      font-weight: 600;
      text-align: center;
    }
    .items-table th:last-child {
      border-right: none;
    }
    .items-table td {
      border-right: 1px solid #444;
      border-bottom: 1px solid #eee;
      padding: 3.5px 6px;
      vertical-align: top;
    }
    .items-table td:last-child {
      border-right: none;
    }
    .font-mono { font-family: monospace; }
  </style>
</head>
<body>
  ${BILLING_PAGES.map(
    (p) => `
  <div class="billing-page">
    ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark-layer" alt="Watermark" />` : ""}

    <div class="content-layer">
      <!-- Header -->
      <table style="width: 100%; margin-bottom: 6px; border-collapse: collapse;">
        <tr>
          <!-- Company details on Left -->
          <td style="vertical-align: top; width: 62%;">
            <div style="display: flex; align-items: flex-start;">
              ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo" />` : ""}
              <div>
                <div style="font-size: 15px; font-weight: 700; color: #000;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>
                <div style="font-size: 11px; color: #333; margin-top: 1px;">
                  ${company?.ADDR01 || ""} ${company?.ADDR02 || ""}<br>
                  ${company?.TELNUM || "โทรศัพท์. 02-896-8068-9 แฟกซ์.02-896-8065"}
                </div>
              </div>
            </div>
          </td>

          <!-- Right: Pill Badge + Subtitle -->
          <td style="vertical-align: top; width: 38%; text-align: right; padding-top: 4px;">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <div style="background-color: #a6caf0; border-radius: 8px; padding: 4px 16px; font-size: 15px; font-weight: 700; color: #000; border: 1px solid rgba(0,0,0,0.2);">
                ${p.title}
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #000;">
                ${p.subtitle}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Customer & Billing Details Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px;">
        <tr>
          <!-- Left: Customer Info -->
          <td style="width: 55%; vertical-align: top; padding: 8px 12px; border-right: 1px solid #444;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 65px; font-weight: 600; vertical-align: top;">ลูกค้า</td>
                <td style="vertical-align: top; font-weight: 600;">${billing.CUSCOD}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight: 600; font-size: 11.5px; padding-top: 2px;">
                  ${customer?.PRENAM ? customer.PRENAM + " " : ""}${customer?.CUSNAM || ""}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color: #333; line-height: 1.35; padding-top: 2px;">
                  ${customer?.ADDR01 || ""}<br>
                  ${customer?.ADDR02 || ""}<br>
                  ${customer?.ADDR03 || ""} ${customer?.ZIPCOD || ""}
                </td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 4px; vertical-align: top;">หมายเหตุ</td>
                <td style="padding-top: 4px; color: #333;">${billing.REMARK || ""}</td>
              </tr>
            </table>
          </td>

          <!-- Right: Billing Details -->
          <td style="width: 45%; vertical-align: top; padding: 8px 12px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="font-weight: 600; width: 120px;">เลขที่ใบวางบิล</td>
                <td style="font-family: monospace; font-weight: 700; font-size: 12.5px;">${billing.BILNUM}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 8px;">วันที่</td>
                <td style="padding-top: 8px; font-weight: 600;">${fmtThaiDateShort(billing.BILDAT)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 8px;">เงื่อนไขการชำระเงิน</td>
                <td style="padding-top: 8px; font-weight: 600;">${billing.PAYCOND || "-"}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Invoices Table Box -->
      <div class="box-bordered" style="margin-bottom: 0; border-bottom: none; border-bottom-left-radius: 0; border-bottom-right-radius: 0;">
        <table class="items-table">
          <thead>
            <tr style="background-color: transparent;">
              <th style="width: 6%;">No.</th>
              <th style="width: 22%; text-align: left;">เลขที่ใบกำกับ</th>
              <th style="width: 14%;">วันที่</th>
              <th style="width: 14%;">ครบกำหนด</th>
              <th style="width: 15%; text-align: right;">จำนวนเงิน</th>
              <th style="width: 14%; text-align: right;">ชำระแล้ว</th>
              <th style="width: 15%; text-align: right;">เงินคงค้าง</th>
            </tr>
          </thead>
          <tbody>
            ${invoices
              .map(
                (inv, idx) => `
              <tr>
                <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
                <td style="text-align: left; font-family: monospace; font-weight: 600;">${inv.DOCNUM}</td>
                <td style="text-align: center;">${fmtThaiDateShort(inv.DOCDAT)}</td>
                <td style="text-align: center;">${fmtThaiDateShort(inv.DUEDAT)}</td>
                <td style="text-align: right; font-family: monospace;">${fmtMoney(inv.NETAMT || inv.AMOUNT)}</td>
                <td style="text-align: right; font-family: monospace;">${inv.RCVAMT > 0 ? fmtMoney(inv.RCVAMT) : ""}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmtMoney(inv.REMAMT !== undefined ? inv.REMAMT : inv.NETAMT)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Summary Total Bar -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 0; border-top-left-radius: 0; border-top-right-radius: 0;">
        <tr>
          <td style="width: 65%; padding: 7px 12px; font-weight: 600; border-right: 1px solid #444;">
            (${bahtText(billing.NETAMT)}).
          </td>
          <td style="width: 35%; padding: 7px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: 600;">รวมเงินทั้งสิ้น</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 12.5px;">${fmtMoney(billing.NETAMT)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Remarks Section (Banks / Notes) -->
      <div style="margin-top: 14px; margin-bottom: 24px; font-size: 11px; line-height: 1.6; padding-left: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 70px; vertical-align: top; font-weight: 600;">หมายเหตุ</td>
            <td style="vertical-align: top;">
              ${
                remarks && remarks.length > 0
                  ? remarks.map((r: any) => `<div>${r.REMARK}</div>`).join("")
                  : billing.REMARK
                  ? `<div>${billing.REMARK}</div>`
                  : ""
              }
            </td>
          </tr>
        </table>
      </div>

      <!-- Bottom Signatures Box -->
      <table class="box-bordered" style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px;">
        <tr>
          <!-- Left: Receiver Signatures -->
          <td style="width: 50%; vertical-align: top; padding: 12px 16px; border-right: 1px solid #444;">
            <div style="margin-bottom: 10px;">
              ชื่อผู้รับวางบิล &nbsp; ____________________
            </div>
            <div style="margin-bottom: 10px;">
              วันที่รับ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ___/___/___
            </div>
            <div>
              วันที่นัดรับเช็ค &nbsp; ___/___/___
            </div>
          </td>

          <!-- Right: Issuer Signatures -->
          <td style="width: 50%; vertical-align: top; padding: 12px 16px;">
            <div style="margin-bottom: 18px;">
              ในนาม &nbsp; <strong>${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</strong>
            </div>
            <div>
              ชื่อผู้วางบิล &nbsp; ____________________
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>
  `
  ).join("")}
</body>
</html>
`;
}
