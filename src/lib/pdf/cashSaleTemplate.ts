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

export function generateCashSaleHtml(data: {
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
  const discountAmt = invoice.DISCAMT || 0;
  const afterDiscount = invoice.AFTDISC || grossAmount - discountAmt;
  const vatRate = invoice.VATRAT || 7;
  const vatAmount = invoice.VATAMT || 0;
  const netAmount = invoice.NETAMT || 0;
  const taxWithheld = invoice.TAX || 0;
  const isCash = (invoice.CSHRCV || 0) > 0;
  const isCheque = (invoice.CHQRCV || 0) > 0;

  const CASH_SALE_PAGES = [
    {
      page: 1,
      topText: "เอกสารออกเป็นชุด",
      title: "ใบเสร็จรับเงิน",
      subtitle: "ต้นฉบับ (ไม่ใช่ใบกำกับภาษี)",
      headerBg: "#9ec5f7",
      tableHeaderBg: "#cde3fc",
      summaryBg: "#9ec5f7",
      showPaymentBox: true,
      showReceiptNote: true,
    },
    {
      page: 2,
      topText: "เอกสารออกเป็นชุด",
      title: "ใบเสร็จรับเงิน",
      subtitle: "สำเนา (ไม่ใช่ใบกำกับภาษี)",
      headerBg: "#fde047",
      tableHeaderBg: "#fef9c3",
      summaryBg: "#fde047",
      showPaymentBox: true,
      showReceiptNote: true,
    },
    {
      page: 3,
      topText: "เอกสารออกเป็นชุด",
      title: "ใบกำกับสินค้า/ใบกำกับภาษี",
      subtitle: "ต้นฉบับ (สำหรับลูกค้า)",
      headerBg: "#d946ef",
      tableHeaderBg: "#fae8ff",
      summaryBg: "#d946ef",
      showPaymentBox: false,
      showReceiptNote: false,
    },
    {
      page: 4,
      topText: "เอกสารออกเป็นชุด",
      title: "ใบกำกับสินค้า/ใบกำกับภาษี",
      subtitle: "สำเนา (สำหรับลูกค้า)",
      headerBg: "#86efac",
      tableHeaderBg: "#dcfce7",
      summaryBg: "#86efac",
      showPaymentBox: false,
      showReceiptNote: false,
    },
    {
      page: 5,
      topText: "เอกสารออกเป็นชุด",
      title: "ใบกำกับสินค้า/ใบกำกับภาษี",
      subtitle: "สำเนา (สำหรับฝ่ายบัญชี)",
      headerBg: "#ffa439",
      tableHeaderBg: "#ffd296",
      summaryBg: "#ffa439",
      showPaymentBox: false,
      showReceiptNote: false,
    },
    {
      page: 6,
      topText: "เอกสารออกเป็นชุด",
      title: "ใบแจ้งหนี้",
      subtitle: "ต้นฉบับ",
      headerBg: "#84cc16",
      tableHeaderBg: "#ecfccb",
      summaryBg: "#84cc16",
      showPaymentBox: false,
      showReceiptNote: false,
    },
  ];

  const pageChunks: { items: any[]; isLastPage: boolean }[] = [];
  if (items.length <= 10) {
    pageChunks.push({ items, isLastPage: true });
  } else {
    let i = 0;
    while (i < items.length) {
      const remainingCount = items.length - i;
      if (remainingCount <= 10) {
        pageChunks.push({ items: items.slice(i), isLastPage: true });
        break;
      } else {
        const take = remainingCount <= 14 ? Math.ceil(remainingCount / 2) : 14;
        pageChunks.push({ items: items.slice(i, i + take), isLastPage: false });
        i += take;
      }
    }
  }

  const renderHeader = (p: typeof CASH_SALE_PAGES[0]) => `
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
                <span style="font-weight: 600;">เลขประจำตัวผู้เสียภาษี/ Tax ID</span> &nbsp; <span class="font-mono font-bold">${company?.TAXID || "0105558016255"}</span> &nbsp;&nbsp;&nbsp; สำนักงานใหญ่
              </div>
            </div>
          </div>
        </td>
        <td style="vertical-align: top; width: 40%; text-align: right; padding-top: 2px;">
          <div style="font-size: 10.5px; font-weight: 600; color: #333; margin-bottom: 2px; padding-right: 6px;">${p.topText}</div>
          <div style="display: inline-block; background-color: ${p.headerBg}; border-radius: 10px; padding: 4px 14px; text-align: center; border: 1px solid rgba(0,0,0,0.2); min-width: 220px;">
            <div style="font-size: 14.5px; font-weight: 700; color: #000; letter-spacing: 0.3px;">${p.title}</div>
            <div style="font-size: 11.5px; font-weight: 600; color: #111; margin-top: 1px;">${p.subtitle}</div>
          </div>
        </td>
      </tr>
    </table>
  `;

  const renderCustomerDocBox = () => `
    <div class="box-bordered" style="margin-bottom: 6px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
        <tr>
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
                <td colspan="2" style="color: #333; padding-top: 1px;">
                  โทร. ${customer?.TELNUM || "-"}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color: #333; padding-top: 1px;">
                  <span style="font-weight: 600;">เลขประจำตัวผู้เสียภาษี</span> &nbsp; <span class="font-mono">${customer?.TAXID || "-"}</span> &nbsp;&nbsp;&nbsp; <span>☑ ${customer?.ORGNUM ? `สาขาที่ ${customer.ORGNUM}` : "สำนักงานใหญ่"}</span>
                </td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 1px;">อ้างอิง<br><span style="font-size: 9px; font-weight: 400; color: #555;">Reference</span></td>
                <td style="padding-top: 1px; font-weight: 600;">${invoice.YOUREF || "-"}</td>
              </tr>
            </table>
          </td>

          <td style="width: 45%; vertical-align: top; padding: 5px 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
              <tr>
                <td style="font-weight: 600; width: 95px;">เลขที่<br><span style="font-size: 9px; font-weight: 400; color: #555;">No.</span></td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 12px;">${invoice.DOCNUM}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">วันที่<br><span style="font-size: 9px; font-weight: 400; color: #555;">Date</span></td>
                <td style="text-align: right; padding-top: 2px; font-weight: 600;">${fmtThaiDateShort(invoice.DOCDAT)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 2px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="font-weight: 600;">เครดิต<br><span style="font-size: 9px; font-weight: 400; color: #555;">Credit</span></td>
                      <td style="text-align: right; font-weight: 600;">${invoice.PAYTRM || 0} &nbsp; วัน <span style="font-size: 8.5px; color: #555;">Days</span></td>
                      <td style="text-align: right; font-weight: 600; padding-left: 8px;">ครบกำหนด<br><span style="font-size: 9px; font-weight: 400; color: #555;">Due Date</span></td>
                      <td style="text-align: right; font-weight: 600;">${fmtThaiDateShort(invoice.DUEDAT)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">เลขที่ใบสั่งขาย<br><span style="font-size: 9px; font-weight: 400; color: #555;">Sales Order No.</span></td>
                <td style="text-align: right; padding-top: 2px; font-family: monospace;">${invoice.SONUM || "-"}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">พนักงานขาย<br><span style="font-size: 9px; font-weight: 400; color: #555;">Salesman</span></td>
                <td style="text-align: right; padding-top: 2px;">${invoice.SLMCOD || "-"}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">เขตการขาย<br><span style="font-size: 9px; font-weight: 400; color: #555;">Territory</span></td>
                <td style="text-align: right; padding-top: 2px;">${invoice.AREACOD || "-"}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const renderItemsTable = (itemsToRender: any[], p: typeof CASH_SALE_PAGES[0], isFullTable: boolean) => `
    <div class="box-bordered" style="margin-bottom: 6px;">
      <table class="items-table">
        <thead>
          <tr style="background-color: ${p.tableHeaderBg};">
            <th style="width: 6%;">ลำดับ<br><span style="font-size: 8.5px; font-weight: 400;">No.</span></th>
            <th style="width: 44%; text-align: left;">รหัสสินค้า/รายละเอียด<br><span style="font-size: 8.5px; font-weight: 400;">Code/ Descriptions</span></th>
            <th style="width: 14%; text-align: right;">จำนวน<br><span style="font-size: 8.5px; font-weight: 400;">Quantity</span></th>
            <th style="width: 12%; text-align: right;">หน่วยละ<br><span style="font-size: 8.5px; font-weight: 400;">Unit Price</span></th>
            <th style="width: 10%; text-align: center;">ส่วนลด<br><span style="font-size: 8.5px; font-weight: 400;">Discount</span></th>
            <th style="width: 14%; text-align: right;">จำนวนเงิน<br><span style="font-size: 8.5px; font-weight: 400;">Amount</span></th>
          </tr>
        </thead>
        <tbody>
          ${itemsToRender.length > 0 ? itemsToRender
            .map(
              (it, idx) => `
            <tr style="height: 27px;">
              <td style="text-align: center; font-family: monospace;">${it.SEQNUM ? parseInt(it.SEQNUM, 10) : idx + 1}</td>
              <td style="text-align: left;">
                ${it.STKCOD ? `<span style="font-family: monospace; font-weight: 600;">${it.STKCOD}/ </span>` : ""}
                ${it.STKDES || ""}
              </td>
              <td style="text-align: right; font-family: monospace; white-space: nowrap;">${it.TRNQTY.toFixed(2)} ${it.TQUCOD || ""}</td>
              <td style="text-align: right; font-family: monospace;">${fmtMoney(it.UNITPR)}</td>
              <td style="text-align: center; font-family: monospace;">${it.DISC || ""}</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmtMoney(it.TRNVAL)}</td>
            </tr>
          `
            )
            .join("") : ""}
          ${Array.from({ length: Math.max(0, (isFullTable ? 10 : 14) - itemsToRender.length) })
            .map(
              () => `
            <tr style="height: 27px;">
              <td style="color: transparent;">&nbsp;</td>
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

      ${
        isFullTable
          ? `
      <!-- Calculations & Summary Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border-top: 1.2px solid #334155;">
        <tr>
          <td style="width: 60%; vertical-align: bottom; padding: 6px 10px; border-right: 1.2px solid #334155;">
            ${
              p.showReceiptNote
                ? `<div style="font-size: 9.5px; color: #333; line-height: 1.35; padding-bottom: 4px;">
                    ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์ต่อเมื่อมีลายเซ็นผู้รับมอบอำนาจและลายเซ็นผู้รับเงิน และได้เรียกเก็บเงินตามเช็คเรียบร้อยแล้ว
                  </div>`
                : ""
            }
          </td>

          <td style="width: 40%; vertical-align: top; padding: 4px 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
              <tr>
                <td style="font-weight: 600;">รวมเป็นเงิน<br><span style="font-size: 8.5px; font-weight: 400; color: #555;">Gross Amount</span></td>
                <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmtMoney(grossAmount)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">หักส่วนลด<br><span style="font-size: 8.5px; font-weight: 400; color: #555;">Less Discount</span></td>
                <td style="text-align: right; font-family: monospace; padding-top: 2px;">${fmtMoney(discountAmt)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">ยอดหลังหักส่วนลด<br><span style="font-size: 8.5px; font-weight: 400; color: #555;">After Discount</span></td>
                <td style="text-align: right; font-family: monospace; padding-top: 2px;">${fmtMoney(afterDiscount)}</td>
              </tr>
              ${(invoice.ADVAMT || 0) > 0 ? `
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">หักเงินมัดจำ<br><span style="font-size: 8.5px; font-weight: 400; color: #555;">Less Deposit</span></td>
                <td style="text-align: right; font-family: monospace; padding-top: 2px;">${fmtMoney(invoice.ADVAMT)}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="font-weight: 600; padding-top: 2px;">
                  จำนวนภาษีมูลค่าเพิ่ม &nbsp; <span class="font-mono">${vatRate}.00</span> %<br>
                  <span style="font-size: 8.5px; font-weight: 400; color: #555;">VAT</span>
                </td>
                <td style="text-align: right; font-family: monospace; padding-top: 2px; font-weight: 600;">${fmtMoney(vatAmount)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Full-width Colored Total Bar -->
        <tr style="background-color: ${p.summaryBg}; border-top: 1.2px solid #334155;">
          <td style="padding: 5px 10px; font-weight: 700; border-right: 1.2px solid #334155; font-size: 11px;">
            (${bahtText(netAmount)})
          </td>
          <td style="padding: 5px 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: 700; font-size: 11px;">จำนวนเงินรวมทั้งสิ้น<br><span style="font-size: 8.5px; font-weight: 400;">Total Invoice</span></td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 13px;">${fmtMoney(netAmount)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      `
          : ""
      }
    </div>
  `;

  const renderBottomSignatures = (p: typeof CASH_SALE_PAGES[0]) => `
    <!-- Bottom Box: Signatures & Payment / Conditions -->
    <div class="box-bordered" style="margin-top: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <tr>
          <!-- Left: Delivery & Receipt -->
          <td style="width: 33%; vertical-align: top; padding: 6px 8px; border-right: 1.2px solid #334155;">
            <div style="font-weight: 700; text-align: center; margin-bottom: 8px;">ได้รับสินค้าตามรายการถูกต้องแล้ว</div>
            <div style="margin-top: 10px;">
              <table style="width: 95%; margin: 0 auto;">
                <tr style="height: 26px;">
                  <td style="border-bottom: 1px solid #444; width: 65%; vertical-align: bottom;"></td>
                  <td style="width: 5%;"></td>
                  <td style="border-bottom: 1px solid #444; width: 30%; vertical-align: bottom;"></td>
                </tr>
                <tr>
                  <td style="font-size: 9px; padding-top: 2px;">ผู้รับสินค้า/ Goods Received by</td>
                  <td></td>
                  <td style="font-size: 9px; text-align: center; padding-top: 2px;">วันที่/ Date</td>
                </tr>
              </table>
            </div>
            <div style="margin-top: 10px;">
              <table style="width: 95%; margin: 0 auto;">
                <tr style="height: 26px;">
                  <td style="border-bottom: 1px solid #444; width: 65%; vertical-align: bottom;"></td>
                  <td style="width: 5%;"></td>
                  <td style="border-bottom: 1px solid #444; width: 30%; vertical-align: bottom;"></td>
                </tr>
                <tr>
                  <td style="font-size: 9px; padding-top: 2px;">ผู้ส่งสินค้า/ Delivery by</td>
                  <td></td>
                  <td style="font-size: 9px; text-align: center; padding-top: 2px;">วันที่/ Date</td>
                </tr>
              </table>
            </div>
          </td>

          <!-- Middle: Payment (Copies 1 & 2) OR Terms (Copies 3-6) -->
          <td style="width: 37%; vertical-align: top; padding: 6px 8px; border-right: 1.2px solid #334155;">
            ${
              p.showPaymentBox
                ? `
              <div style="margin-bottom: 4px;">
                <span style="font-weight: 600;">ชำระเงินโดย</span> &nbsp;&nbsp;
                <span>${isCash ? "☑" : "☐"} เงินสด</span> &nbsp;&nbsp;&nbsp;&nbsp;
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
              <div style="margin-bottom: 4px; font-size: 9.5px;">
                ภาษีหัก ณ ที่จ่าย ${taxWithheld > 0 ? fmtMoney(taxWithheld) : "___________________________________"}
              </div>
              <div style="margin-top: 4px;">
                <table style="width: 95%; margin: 0 auto;">
                  <tr style="height: 24px;">
                    <td style="border-bottom: 1px solid #444; width: 65%; vertical-align: bottom;"></td>
                    <td style="width: 5%;"></td>
                    <td style="border-bottom: 1px solid #444; width: 30%; vertical-align: bottom;"></td>
                  </tr>
                  <tr>
                    <td style="font-size: 9px; padding-top: 2px;">ผู้รับเงิน/ Collector</td>
                    <td></td>
                    <td style="font-size: 9px; text-align: center; padding-top: 2px;">วันที่/ Date</td>
                  </tr>
                </table>
              </div>
            `
                : `
              <div style="font-size: 9px; line-height: 1.45; color: #222;">
                <div>o สินค้านี้ขายขาดไม่รับคืนหรือเปลี่ยน</div>
                <div>o บริษัทฯ จะนำใบเสร็จรับเงินมาเรียกเก็บเงินในภายหลัง</div>
                <div>o บริษัทฯ จะคิดดอกเบี้ย 1.25% ต่อเดือน เมื่อชำระบิลเกินกำหนด</div>
                <div>o กรุณาชำระเงินด้วยเช็ค ในนามบริษัทฯ ขีดผู้ถือและขีดคล่อมเท่านั้น</div>
              </div>
            `
            }
          </td>

          <!-- Right: Authorized Signatures -->
          <td style="width: 30%; vertical-align: top; padding: 6px 8px; text-align: center;">
            <div style="font-size: 9px; color: #333;">ในนาม</div>
            <div style="font-weight: 700; font-size: 11px; margin-bottom: 6px;">${company?.THINAM || "บริษัท ธงธัญ99 จำกัด"}</div>

            <div style="margin-bottom: 8px;">
              ${signatureBase64 ? `
                <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: -2px;">
                  <img src="${signatureBase64}" style="height: 48px; width: auto; object-fit: contain; vertical-align: bottom;" />
                </div>
              ` : `
                <div style="height: 30px;"></div>
              `}
              <div style="border-bottom: 1px solid #444; width: 85%; margin: 0 auto;"></div>
              <div style="font-size: 9px; margin-top: 2px;">ผู้รับมอบอำนาจ/ Authorized Signature</div>
            </div>

            <div>
              <div style="height: 28px;"></div>
              <div style="border-bottom: 1px solid #444; width: 85%; margin: 0 auto;"></div>
              <div style="font-size: 9px; margin-top: 2px;">ผู้ตรวจเช็คสินค้า/ Approved by</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

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
    .cash-sale-page {
      page-break-after: always;
      position: relative;
      height: 280mm;
      max-height: 280mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .cash-sale-page:last-child {
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
      font-size: 10px;
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
      padding: 3px 5px;
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
  ${CASH_SALE_PAGES.map((p) => {
    return pageChunks
      .map(
        (chunk) => `
        <div class="cash-sale-page">
          ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark-layer" alt="Watermark" />` : ""}
          <div class="content-layer">
            ${renderHeader(p)}
            ${renderCustomerDocBox()}
            ${renderItemsTable(chunk.items, p, chunk.isLastPage)}
            ${chunk.isLastPage ? renderBottomSignatures(p) : `
              <div style="margin-top: auto; padding: 10px 0; text-align: right; font-size: 11px; color: #555;">
                (ต่อหน้าถัดไป)
              </div>
            `}
          </div>
        </div>
      `
      )
      .join("");
  }).join("")}
</body>
</html>
`;
}

