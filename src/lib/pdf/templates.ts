import { bahtText } from "@/lib/baht-text";
import { getCompanyLogoBase64, getWatermarkLogoBase64 } from "@/lib/logo";

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
  const isCash = invoice.RECTYP === "1";
  const docTitle = isCash
    ? "ใบเสร็จรับเงิน / ใบกำกับภาษี"
    : "ใบแจ้งหนี้ / ใบกำกับภาษี";

  const logoBase64 = getCompanyLogoBase64();
  const watermarkBase64 = getWatermarkLogoBase64();

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>${baseStyles}</style>
</head>
<body>
  ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark" alt="Watermark" />` : ""}

  <div class="content-layer">
    <!-- Header with LOGO.bmp -->
    <table style="width: 100%; margin-bottom: 15px;">
      <tr>
        <td style="width: 65%; vertical-align: middle;">
          <div style="display: flex; align-items: center;">
            ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo" />` : ""}
            <div>
              <div style="font-size: 16px; font-weight: 700;">${company?.THINAM || "บริษัท ธงธัญ จำกัด"}</div>
              <div style="font-size: 12px; color: #444; margin-top: 3px;">
                ${company?.ADDR01 || ""} ${company?.ADDR02 || ""}<br>
                โทรศัพท์: ${company?.TELNUM || "-"} | เลขประจำตัวผู้เสียภาษี: ${company?.TAXID || "-"}
              </div>
            </div>
          </div>
        </td>
        <td style="width: 35%; vertical-align: top; text-align: right;">
          <div class="doc-title">${docTitle}</div>
          <div class="doc-num" style="margin-top: 4px;">เลขที่: <span class="font-mono">${invoice.DOCNUM}</span></div>
          <div style="font-size: 12px; color: #555; margin-top: 2px;">วันที่: ${fmtDate(invoice.DOCDAT)}</div>
        </td>
      </tr>
    </table>

    <!-- Customer & Details -->
    <table style="width: 100%; margin-bottom: 15px;" class="border-box">
      <tr>
        <td style="width: 60%; vertical-align: top; padding-right: 15px;">
          <div><strong>ลูกค้า:</strong> [${invoice.CUSCOD}] ${customer?.PRENAM || ""} ${customer?.CUSNAM || ""}</div>
          <div style="font-size: 12px; color: #444; margin-top: 2px;">
            ที่อยู่: ${customer?.ADDR01 || ""} ${customer?.ADDR02 || ""} ${customer?.ADDR03 || ""} ${customer?.ZIPCOD || ""}
          </div>
          <div style="font-size: 12px; color: #444; margin-top: 2px;">
            เลขประจำตัวผู้เสียภาษี: ${customer?.TAXID || "-"} ${customer?.ORGNUM ? `(สาขาที่ ${customer.ORGNUM})` : "(สำนักงานใหญ่)"}
          </div>
          <div style="font-size: 12px; color: #444;">โทร: ${customer?.TELNUM || "-"}</div>
        </td>
        <td style="width: 40%; vertical-align: top; font-size: 12px; border-left: 1px solid #ddd; padding-left: 15px;">
          <div><strong>อ้างอิง SO:</strong> ${invoice.SONUM || "-"}</div>
          <div><strong>อ้างอิงลูกค้า:</strong> ${invoice.YOUREF || "-"}</div>
          <div><strong>พนักงานขาย:</strong> ${invoice.SLMCOD || "-"}</div>
          <div><strong>เงื่อนไขชำระ:</strong> ${invoice.PAYTRM > 0 ? `${invoice.PAYTRM} วัน` : "เงินสด"}</div>
          <div><strong>วันครบกำหนด:</strong> ${fmtDate(invoice.DUEDAT)}</div>
        </td>
      </tr>
    </table>

    <!-- Items Table -->
    <table class="items-table" style="margin-bottom: 15px;">
      <thead>
        <tr>
          <th class="text-center" style="width: 5%;">ลำดับ</th>
          <th class="text-left" style="width: 18%;">รหัสสินค้า</th>
          <th class="text-left" style="width: 37%;">รายละเอียด</th>
          <th class="text-right" style="width: 10%;">จำนวน</th>
          <th class="text-center" style="width: 8%;">หน่วย</th>
          <th class="text-right" style="width: 11%;">ราคา/หน่วย</th>
          <th class="text-right" style="width: 11%;">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (it, idx) => `
          <tr>
            <td class="text-center font-mono">${it.SEQNUM || idx + 1}</td>
            <td class="font-mono">${it.STKCOD}</td>
            <td>${it.STKDES}</td>
            <td class="text-right font-mono">${it.TRNQTY}</td>
            <td class="text-center">${it.TQUCOD || ""}</td>
            <td class="text-right font-mono">${fmtMoney(it.UNITPR)}</td>
            <td class="text-right font-mono">${fmtMoney(it.TRNVAL)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <!-- Remarks & Total Summary -->
    <table style="width: 100%;">
      <tr>
        <td style="width: 55%; vertical-align: top; padding-right: 20px;">
          <div><strong>หมายเหตุ:</strong></div>
          <div style="font-size: 12px; color: #444; min-height: 40px; margin-top: 4px;">
            ${remarks.map((r) => `<div>${r.REMARK}</div>`).join("") || "-"}
          </div>
          <div style="margin-top: 15px; background-color: rgba(249, 250, 251, 0.85); padding: 6px 10px; border-radius: 4px; font-weight: 600;">
            ( ${bahtText(invoice.NETAMT)} )
          </div>
        </td>
        <td style="width: 45%; vertical-align: top;">
          <table class="summary-table">
            <tr>
              <td class="text-right">รวมเป็นเงิน:</td>
              <td class="text-right font-mono" style="width: 100px;">${fmtMoney(invoice.AMOUNT)}</td>
            </tr>
            ${
              invoice.DISCAMT > 0
                ? `
            <tr>
              <td class="text-right">หักส่วนลด:</td>
              <td class="text-right font-mono">-${fmtMoney(invoice.DISCAMT)}</td>
            </tr>
            `
                : ""
            }
            <tr>
              <td class="text-right">ยอดหลังหักส่วนลด:</td>
              <td class="text-right font-mono">${fmtMoney(invoice.AFTDISC || invoice.AMOUNT - invoice.DISCAMT)}</td>
            </tr>
            <tr>
              <td class="text-right">ภาษีมูลค่าเพิ่ม (${invoice.VATRAT || 7}%):</td>
              <td class="text-right font-mono">${fmtMoney(invoice.VATAMT)}</td>
            </tr>
            <tr style="border-top: 1px solid #333; border-bottom: 2px solid #333; font-weight: 700; font-size: 14px;">
              <td class="text-right" style="padding: 6px 4px;">จำนวนเงินรวมทั้งสิ้น:</td>
              <td class="text-right font-mono" style="padding: 6px 4px;">${fmtMoney(invoice.NETAMT)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div>ผู้รับของ / ลูกค้า</div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">วันที่ ...../...../.....</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div>ผู้ส่งของ</div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">วันที่ ...../...../.....</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div>ผู้มีอำนาจลงนาม</div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">วันที่ ...../...../.....</div>
      </div>
    </div>
  </div>
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
}): string {
  const { quotation, customer, items, remarks, company } = data;

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
              <td style="text-align: left;">${it.STKDES || it.STKCOD}</td>
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
  company?: any;
}): string {
  const { billing, customer, invoices, company } = data;

  const logoBase64 = getCompanyLogoBase64();
  const watermarkBase64 = getWatermarkLogoBase64();

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>${baseStyles}</style>
</head>
<body>
  ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark" alt="Watermark" />` : ""}

  <div class="content-layer">
    <!-- Header with LOGO.bmp -->
    <table style="width: 100%; margin-bottom: 15px;">
      <tr>
        <td style="width: 65%; vertical-align: middle;">
          <div style="display: flex; align-items: center;">
            ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo" />` : ""}
            <div>
              <div style="font-size: 16px; font-weight: 700;">${company?.THINAM || "บริษัท ธงธัญ จำกัด"}</div>
              <div style="font-size: 12px; color: #444; margin-top: 3px;">
                ${company?.ADDR01 || ""} ${company?.ADDR02 || ""}<br>
                โทรศัพท์: ${company?.TELNUM || "-"} | เลขประจำตัวผู้เสียภาษี: ${company?.TAXID || "-"}
              </div>
            </div>
          </div>
        </td>
        <td style="width: 35%; vertical-align: top; text-align: right;">
          <div class="doc-title">ใบวางบิล / ใบแจ้งหนี้</div>
          <div class="doc-num" style="margin-top: 4px;">เลขที่: <span class="font-mono">${billing.BILNUM}</span></div>
          <div style="font-size: 12px; color: #555; margin-top: 2px;">วันที่: ${fmtDate(billing.BILDAT)}</div>
        </td>
      </tr>
    </table>

    <!-- Customer & Details -->
    <table style="width: 100%; margin-bottom: 15px;" class="border-box">
      <tr>
        <td style="width: 60%; vertical-align: top; padding-right: 15px;">
          <div><strong>ลูกค้า:</strong> [${billing.CUSCOD}] ${customer?.CUSNAM || ""}</div>
          <div style="font-size: 12px; color: #444; margin-top: 2px;">
            ที่อยู่: ${customer?.ADDR01 || ""} ${customer?.ADDR02 || ""} ${customer?.ADDR03 || ""} ${customer?.ZIPCOD || ""}
          </div>
          <div style="font-size: 12px; color: #444;">โทร: ${customer?.TELNUM || "-"}</div>
        </td>
        <td style="width: 40%; vertical-align: top; font-size: 12px; border-left: 1px solid #ddd; padding-left: 15px;">
          <div><strong>วันที่นัดรับเงิน:</strong> ${fmtDate(billing.APPDAT)}</div>
          <div><strong>เงื่อนไขชำระ:</strong> ${billing.PAYCOND || "-"}</div>
          <div><strong>หมายเหตุ:</strong> ${billing.REMARK || "-"}</div>
        </td>
      </tr>
    </table>

    <!-- Invoices Table -->
    <table class="items-table" style="margin-bottom: 15px;">
      <thead>
        <tr>
          <th class="text-center" style="width: 8%;">ลำดับ</th>
          <th class="text-left" style="width: 25%;">เลขที่เอกสาร</th>
          <th class="text-center" style="width: 20%;">วันที่เอกสาร</th>
          <th class="text-right" style="width: 22%;">ภาษีมูลค่าเพิ่ม</th>
          <th class="text-right" style="width: 25%;">จำนวนเงินสุทธิ</th>
        </tr>
      </thead>
      <tbody>
        ${invoices
          .map(
            (inv, idx) => `
          <tr>
            <td class="text-center font-mono">${idx + 1}</td>
            <td class="font-mono font-bold">${inv.DOCNUM}</td>
            <td class="text-center">${fmtDate(inv.DOCDAT)}</td>
            <td class="text-right font-mono">${fmtMoney(inv.VATAMT || 0)}</td>
            <td class="text-right font-mono font-bold">${fmtMoney(inv.NETAMT || inv.RCVAMT || 0)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <!-- Total Summary -->
    <table style="width: 100%;">
      <tr>
        <td style="width: 55%; vertical-align: top; padding-right: 20px;">
          <div style="margin-top: 10px; background-color: rgba(249, 250, 251, 0.85); padding: 6px 10px; border-radius: 4px; font-weight: 600;">
            ( ${bahtText(billing.NETAMT)} )
          </div>
        </td>
        <td style="width: 45%; vertical-align: top;">
          <table class="summary-table">
            <tr style="border-top: 1px solid #333; border-bottom: 2px solid #333; font-weight: 700; font-size: 14px;">
              <td class="text-right" style="padding: 6px 4px;">ยอดรวมทั้งสิ้น:</td>
              <td class="text-right font-mono" style="padding: 6px 4px; width: 120px;">${fmtMoney(billing.NETAMT)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div>ผู้วางบิล</div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">วันที่ ...../...../.....</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div>ผู้รับวางบิล (ลูกค้า)</div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">วันที่ ...../...../.....</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div>ผู้มีอำนาจลงนาม</div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">วันที่ ...../...../.....</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}
