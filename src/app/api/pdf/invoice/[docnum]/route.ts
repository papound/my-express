import { readAll, cleanStr, cleanNum, cleanDate } from "@/lib/dbf/reader";
import { renderHtmlToPdf } from "@/lib/pdf/renderer";
import { generateInvoiceHtml, generateSalesReturnHtml } from "@/lib/pdf/templates";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ docnum: string }> }
) {
  try {
    const { docnum } = await params;
    const docNum = decodeURIComponent(docnum).trim();

    const [rawTrn, rawMas, rawCrd, rawRm, rawInfo, rawTab] = await Promise.all([
      readAll<Record<string, unknown>>("ARTRN"),
      readAll<Record<string, unknown>>("ARMAS"),
      readAll<Record<string, unknown>>("STCRD"),
      readAll<Record<string, unknown>>("ARTRNRM"),
      readAll<Record<string, unknown>>("ISINFO"),
      readAll<Record<string, unknown>>("ISTAB"),
    ]);

    const header = rawTrn.find((r) => cleanStr(r.DOCNUM) === docNum);
    if (!header) {
      return new NextResponse(`ไม่พบเอกสารเลขที่ ${docNum}`, { status: 404 });
    }

    const cuscod = cleanStr(header.CUSCOD);
    const customer = rawMas.find((r) => cleanStr(r.CUSCOD) === cuscod);

    // Build unit map from ISTAB (TABTYP = "20")
    const unitMap = new Map<string, string>();
    rawTab
      .filter((r) => cleanStr(r.TABTYP) === "20")
      .forEach((r) => {
        const code = cleanStr(r.TYPCOD);
        const name = cleanStr(r.SHORTNAM) || cleanStr(r.TYPDES);
        if (code && name) unitMap.set(code, name);
      });

    const items = rawCrd
      .filter((r) => cleanStr(r.DOCNUM) === docNum && cleanStr(r.POSOPR) !== "-")
      .map((r) => ({
        STKCOD: cleanStr(r.STKCOD),
        STKDES: cleanStr(r.STKDES),
        SEQNUM: cleanStr(r.SEQNUM),
        TRNQTY: cleanNum(r.TRNQTY),
        TQUCOD: unitMap.get(cleanStr(r.TQUCOD)) || cleanStr(r.TQUCOD),
        UNITPR: cleanNum(r.UNITPR),
        DISC: cleanStr(r.DISC),
        DISCAMT: cleanNum(r.DISCAMT),
        TRNVAL: cleanNum(r.TRNVAL),
        LOCCOD: cleanStr(r.LOCCOD),
        RETSTK: cleanStr(r.RETSTK),
      }))
      .sort((a, b) => parseInt(a.SEQNUM || "0", 10) - parseInt(b.SEQNUM || "0", 10));

    const remarks = rawRm
      .filter((r) => cleanStr(r.DOCNUM) === docNum)
      .map((r) => ({
        SEQNUM: cleanStr(r.SEQNUM),
        REMARK: cleanStr(r.REMARK),
      }));

    const companyRaw = rawInfo[0];
    const company = companyRaw
      ? {
          THINAM: cleanStr(companyRaw.THINAM),
          ADDR01: cleanStr(companyRaw.ADDR01),
          ADDR02: cleanStr(companyRaw.ADDR02),
          TELNUM: cleanStr(companyRaw.TELNUM),
          TAXID: cleanStr(companyRaw.TAXID),
        }
      : null;

    const soNum = cleanStr(header.SONUM);
    const refTrn = soNum ? rawTrn.find((r) => cleanStr(r.DOCNUM) === soNum) : null;
    const soDat = refTrn ? cleanDate(refTrn.DOCDAT) : null;

    const invoice = {
      RECTYP: cleanStr(header.RECTYP),
      DOCNUM: cleanStr(header.DOCNUM),
      DOCDAT: cleanDate(header.DOCDAT),
      CUSCOD: cuscod,
      SONUM: soNum,
      SODAT: soDat,
      YOUREF: cleanStr(header.YOUREF),
      SLMCOD: cleanStr(header.SLMCOD),
      AREACOD: cleanStr(header.AREACOD),
      PAYTRM: cleanNum(header.PAYTRM),
      DUEDAT: cleanDate(header.DUEDAT),
      AMOUNT: cleanNum(header.AMOUNT),
      DISCAMT: cleanNum(header.DISCAMT),
      AFTDISC: cleanNum(header.AFTDISC),
      ADVAMT: cleanNum(header.ADVAMT),
      VATAMT: cleanNum(header.VATAMT),
      NETAMT: cleanNum(header.NETAMT),
      IVCAMT: cleanNum(header.IVCAMT),
      VATRAT: cleanNum(header.VATRAT),
    };

    const customerData = customer
      ? {
          CUSNAM: cleanStr(customer.CUSNAM),
          PRENAM: cleanStr(customer.PRENAM),
          ADDR01: cleanStr(customer.ADDR01),
          ADDR02: cleanStr(customer.ADDR02),
          ADDR03: cleanStr(customer.ADDR03),
          ZIPCOD: cleanStr(customer.ZIPCOD),
          TELNUM: cleanStr(customer.TELNUM),
          TAXID: cleanStr(customer.TAXID),
          ORGNUM: cleanNum(customer.ORGNUM),
        }
      : null;

    const isSalesReturn =
      invoice.RECTYP === "5" || docNum.toUpperCase().startsWith("SR");

    const html = isSalesReturn
      ? generateSalesReturnHtml({
          invoice,
          customer: customerData,
          items,
          remarks,
          company,
        })
      : generateInvoiceHtml({
          invoice,
          customer: customerData,
          items,
          remarks,
          company,
        });

    const pdfBuffer = await renderHtmlToPdf(html);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${docNum}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Invoice PDF error:", err);
    return new NextResponse(`เกิดข้อผิดพลาดในการสร้าง PDF: ${String(err)}`, {
      status: 500,
    });
  }
}
