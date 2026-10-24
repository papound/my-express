import { bahtText } from "@/lib/baht-text";
import {
  getCompanyLogoBase64,
  getWatermarkLogoBase64,
  getAuthorizedSignatureBase64,
} from "@/lib/logo";

function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0.00";
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function generateReceiptHtml(data: {
  invoice: any;
  customer?: any;
  items: any[];
  receiptItems?: any[];
  remarks?: any[];
  company?: any;
}): string {
  const { invoice, customer, items, receiptItems, company } = data;

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

  const appliedItems =
    receiptItems && receiptItems.length > 0
      ? receiptItems
      : items && items.length > 0 && items[0].DOCNUM
      ? items
      : [];

  const netAmount = invoice.NETAMT || 0;
  const taxWithheld = invoice.TAX || 0;
  const isCash = (invoice.CSHRCV || 0) > 0 && (invoice.CHQRCV || 0) === 0;
  const isCheque = (invoice.CHQRCV || 0) > 0;

  const RECEIPT_PAGES = [
    {
      page: 1,
      title: "ใบเสร็จรับเงิน",
      subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
      headerBg: "#9ec5f7",
      tableHeaderBg: "#cde3fc",
      summaryBg: "#9ec5f7",
    },
    {
      page: 2,
      title: "ใบเสร็จรับเงิน",
      subtitle: "สำเนา (สำหรับฝ่ายบัญชี)",
      headerBg: "#fde047",
      tableHeaderBg: "#fef9c3",
      summaryBg: "#fde047",
    },
    {
      page: 3,
      title: "ใบเสร็จรับเงิน",
      subtitle: "สำเนา (สำหรับลูกค้า)",
      headerBg: "#e88ef5",
      tableHeaderBg: "#f2befa",
      summaryBg: "#e88ef5",
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
      font-size: 11px;
      line-height: 1.25;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .receipt-page {
      page-break-after: always;
      position: relative;
      min-height: 278mm;
      max-height: 284mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .receipt-page:last-child {
      page-break-after: avoid;
    }
    .watermark-layer {
      position: absolute;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 410px;
      opacity: 0.24;
      pointer-events: none;
      z-index: 0;
    }
    .content-layer {
      position: relative;
      z-index: 1;
      height: 100%;
      min-height: 276mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .company-logo {
      height: 54px;
      width: 54px;
      object-fit: contain;
      margin-right: 12px;
    }
    .box-bordered {
      border: 1.2px solid #334155;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 6px;
      background-color: #fff;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .items-table th {
      border-bottom: 1.2px solid #334155;
      border-right: 1.2px solid #334155;
      padding: 5px 5px;
      font-weight: 700;
      text-align: center;
      background-color: #f1f5f9;
      color: #0f172a;
    }
    .items-table th:last-child {
      border-right: none;
    }
    .items-table td {
      border-right: 1.2px solid #334155;
      border-bottom: 1px solid #cbd5e1;
      padding: 4px 6px;
      vertical-align: middle;
    }
    .items-table td:last-child {
      border-right: none;
    }
    .items-table tbody tr:last-child td {
      border-bottom: none;
    }
    .font-mono { font-family: monospace; }
  </style>
</head>
<body>
  ${RECEIPT_PAGES.map(
    (p) => `
    <div class="receipt-page">
      ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark-layer" alt="Watermark" />` : ""}

      <div class="content-layer">
        <!-- Header -->
        <table style="width: 100%; margin-bottom: 4px; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; width: 60%;">
              <div style="display: flex; align-items: flex-start;">
                ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo" />` : ""}
                <div>
                  <div style="font-size: 14.5px; font-weight: 700; color: #000;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>
                  <div style="font-size: 10.5px; color: #333; margin-top: 1px;">
                    ${company?.ADDR01 || ""} ${company?.ADDR02 || ""}<br>
                    ${company?.TELNUM || "โทรศัพท์. 02-896-8068-9 แฟกซ์.02-896-8065"}
                  </div>
                  <div style="font-size: 10.5px; color: #333; margin-top: 2px;">
                    <span style="font-weight: 600;">เลขประจำตัวผู้เสียภาษี/ Tax ID</span> &nbsp; <span class="font-mono font-bold">${company?.TAXID || "0105558016255"}</span> &nbsp;&nbsp;&nbsp; ☑ สนญ.
                  </div>
                </div>
              </div>
            </td>

            <td style="vertical-align: top; width: 40%; text-align: right; padding-top: 4px;">
              <div style="display: inline-block; background-color: ${p.headerBg}; border-radius: 10px; padding: 5px 14px; text-align: center; border: 1px solid rgba(0,0,0,0.2); min-width: 210px;">
                <div style="font-size: 15px; font-weight: 700; color: #000; letter-spacing: 0.3px;">${p.title}</div>
                <div style="font-size: 12px; font-weight: 600; color: #111; margin-top: 1px;">${p.subtitle}</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Customer & Document Info Box -->
        <div class="box-bordered" style="margin-bottom: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
            <tr>
              <!-- Left: Customer -->
              <td style="width: 55%; vertical-align: top; padding: 5px 8px; border-right: 1.2px solid #334155;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 65px; font-weight: 600; vertical-align: top;">ลูกค้า<br><span style="font-size: 9px; font-weight: 400; color: #555;">Customer</span></td>
                    <td style="vertical-align: top; font-weight: 600;">${invoice.CUSCOD}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="font-weight: 600; font-size: 11px; padding-top: 1px;">
                      ${customer?.PRENAM ? customer.PRENAM + " " : ""}${customer?.CUSNAM || ""}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="color: #333; line-height: 1.3; padding-top: 1px;">
                      ${customer?.ADDR01 || ""} ${customer?.ADDR02 || ""}<br>
                      ${customer?.ADDR03 || ""} ${customer?.ZIPCOD || ""}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="color: #333; padding-top: 2px;">
                      <span style="font-weight: 600;">เลขประจำตัวผู้เสียภาษี</span> &nbsp; <span class="font-mono">${customer?.TAXID || "-"}</span> &nbsp;&nbsp;&nbsp; <span>☑ ${customer?.ORGNUM ? `สาขาที่ ${customer.ORGNUM}` : "สำนักงานใหญ่"}</span>
                    </td>
                  </tr>
                </table>
              </td>

              <!-- Right: Document Info -->
              <td style="width: 45%; vertical-align: top; padding: 5px 8px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
                  <tr>
                    <td style="font-weight: 600; width: 95px;">เลขที่ใบเสร็จ<br><span style="font-size: 9px; font-weight: 400; color: #555;">Receipt No.</span></td>
                    <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 12px;">${invoice.DOCNUM}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; padding-top: 3px;">วันที่<br><span style="font-size: 9px; font-weight: 400; color: #555;">Date</span></td>
                    <td style="text-align: right; padding-top: 3px; font-weight: 600;">${fmtThaiDateShort(invoice.DOCDAT)}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600; padding-top: 3px;">พนักงานขาย<br><span style="font-size: 9px; font-weight: 400; color: #555;">Salesman</span></td>
                    <td style="text-align: right; padding-top: 3px;">${invoice.SLMCOD || "-"}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>

        <!-- Invoices Table & Summary Box (7 Columns) -->
        <div class="box-bordered" style="margin-bottom: 6px;">
          <table class="items-table">
            <thead>
              <tr style="background-color: ${p.tableHeaderBg};">
                <th style="width: 6%;">ลำดับ<br><span style="font-size: 8.5px; font-weight: 400;">No.</span></th>
                <th style="width: 24%; text-align: left; padding-left: 8px;">เลขที่ใบกำกับ/ Invoice</th>
                <th style="width: 14%;">วันที่<br><span style="font-size: 8.5px; font-weight: 400;">Date</span></th>
                <th style="width: 14%;">ครบกำหนด<br><span style="font-size: 8.5px; font-weight: 400;">Due Date</span></th>
                <th style="width: 14%; text-align: right;">จำนวนเงิน<br><span style="font-size: 8.5px; font-weight: 400;">Amount</span></th>
                <th style="width: 14%; text-align: right;">ยอดคงค้าง<br><span style="font-size: 8.5px; font-weight: 400;">Remain Amount</span></th>
                <th style="width: 14%; text-align: right; padding-right: 8px;">ยอดชำระ<br><span style="font-size: 8.5px; font-weight: 400;">Paid Amount</span></th>
              </tr>
            </thead>
            <tbody>
              ${appliedItems
                .map(
                  (it: any, idx: number) => `
                <tr style="height: 27px;">
                  <td style="text-align: center; font-family: monospace;">${it.SEQNUM ? parseInt(it.SEQNUM, 10) : idx + 1}</td>
                  <td style="text-align: left; padding-left: 8px; font-family: monospace; font-weight: 700;">${it.DOCNUM}</td>
                  <td style="text-align: center;">${fmtThaiDateShort(it.DOCDAT)}</td>
                  <td style="text-align: center;">${fmtThaiDateShort(it.DUEDAT)}</td>
                  <td style="text-align: right; font-family: monospace;">${fmtMoney(it.AMOUNT || it.RCVAMT)}</td>
                  <td style="text-align: right; font-family: monospace;">${it.REMAMT !== undefined && it.REMAMT > 0 ? fmtMoney(it.REMAMT) : ""}</td>
                  <td style="text-align: right; padding-right: 8px; font-family: monospace; font-weight: 700;">${fmtMoney(it.RCVAMT)}</td>
                </tr>
              `
                )
                .join("")}
              ${Array.from({ length: Math.max(0, 7 - appliedItems.length) })
                .map(
                  () => `
                <tr style="height: 27px;">
                  <td style="color: transparent;">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <!-- Summary Total Bar -->
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border-top: 1.2px solid #334155;">
            <tr style="background-color: ${p.summaryBg};">
              <td style="width: 65%; padding: 6px 10px; font-weight: 700; border-right: 1.2px solid #334155;">
                (${bahtText(netAmount)}).
              </td>
              <td style="width: 35%; padding: 6px 10px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="font-weight: 700;">รวมเป็นเงิน<br><span style="font-size: 8.5px; font-weight: 400;">Total Amount</span></td>
                    <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 13px;">${fmtMoney(netAmount)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>

        <!-- Bottom Payment & Signatures Box -->
        <div class="box-bordered" style="margin-top: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <tr>
              <td colspan="2" style="padding: 5px 8px; border-bottom: 1.2px solid #334155; font-size: 9.5px; color: #333;">
                ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์ต่อเมื่อมีลายเซ็นผู้รับมอบอำนาจและลายเซ็นผู้รับเงิน และได้เรียกเก็บเงินตามเช็คเรียบร้อยแล้ว
              </td>
            </tr>
            <tr>
              <!-- Left: Payment details -->
              <td style="width: 65%; vertical-align: top; padding: 6px 8px; border-right: 1.2px solid #334155;">
                <div style="margin-bottom: 4px;">
                  <span style="font-weight: 600;">ชำระเงินโดย</span> &nbsp;&nbsp;
                  <span>${isCash ? "☑" : "☐"} เงินสด</span> &nbsp;&nbsp;&nbsp;&nbsp;
                  <span>☐ เงินโอน</span> &nbsp;&nbsp;&nbsp;&nbsp;
                  <span>${isCheque ? "☑" : "☐"} เช็ค</span>
                </div>
                <div style="margin-bottom: 3px; font-size: 9.5px;">
                  เช็คธนาคาร__________________ สาขา____________________
                </div>
                <div style="margin-bottom: 3px; font-size: 9.5px;">
                  เลขที่__________________________ วันที่ ____/_____/_______
                </div>
                <div style="margin-bottom: 3px; font-size: 9.5px;">
                  จำนวนเงิน_______________________________________
                </div>
                <div style="margin-bottom: 6px; font-size: 9.5px;">
                  ภาษีหัก ณ ที่จ่าย ${taxWithheld > 0 ? fmtMoney(taxWithheld) : "___________________________________"}
                </div>

                <div style="margin-top: 10px;">
                  <table style="width: 65%;">
                    <tr>
                      <td style="border-bottom: 1px solid #444; width: 65%;"></td>
                      <td style="width: 5%;"></td>
                      <td style="border-bottom: 1px solid #444; width: 30%;"></td>
                    </tr>
                    <tr>
                      <td style="font-size: 9px; padding-top: 2px;">ผู้รับเงิน/ Collector</td>
                      <td></td>
                      <td style="font-size: 9px; text-align: center; padding-top: 2px;">วันที่/ Date</td>
                    </tr>
                  </table>
                </div>
              </td>

              <!-- Right: Signatures -->
              <td style="width: 35%; vertical-align: top; padding: 6px 8px; text-align: center;">
                <div style="font-size: 9px; color: #333;">ในนาม</div>
                <div style="font-weight: 700; font-size: 11px; margin-bottom: 14px;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>

                <div style="margin-bottom: 12px;">
                  ${signatureBase64 ? `
                    <div style="margin-bottom: -10px;">
                      <img src="${signatureBase64}" style="height: 72px; width: auto; display: inline-block; vertical-align: bottom;" />
                    </div>
                  ` : `
                    <div style="height: 24px;"></div>
                  `}
                  <div style="border-bottom: 1px solid #444; width: 85%; margin: 0 auto;"></div>
                  <div style="font-size: 9px; margin-top: 2px;">ผู้รับมอบอำนาจ/ Authorized Signature</div>
                </div>

                <div>
                  <div style="border-bottom: 1px solid #444; width: 85%; margin: 0 auto;"></div>
                  <div style="font-size: 9px; margin-top: 2px;">ผู้เตรียมเอกสาร/ Prepared by</div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `
  ).join("")}
</body>
</html>
`;
}

