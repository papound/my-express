import { readAll, cleanStr, cleanNum, cleanDate } from "@/lib/dbf/reader";
import { renderHtmlToPdf } from "@/lib/pdf/renderer";
import { generateBillingHtml } from "@/lib/pdf/templates";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bilnum: string }> }
) {
  try {
    const { bilnum } = await params;
    const bilNum = decodeURIComponent(bilnum).trim();
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "1";
    const pageParam = searchParams.get("page");

    const [rawBil, rawMas, rawTrn, rawRm, rawInfo] = await Promise.all([
      readAll<Record<string, unknown>>("ARBIL"),
      readAll<Record<string, unknown>>("ARMAS"),
      readAll<Record<string, unknown>>("ARTRN"),
      readAll<Record<string, unknown>>("ARTRNRM"),
      readAll<Record<string, unknown>>("ISINFO"),
    ]);

    const header = rawBil.find((r) => cleanStr(r.BILNUM) === bilNum);
    if (!header) {
      return new NextResponse(`ไม่พบใบวางบิลเลขที่ ${bilNum}`, { status: 404 });
    }

    const cuscod = cleanStr(header.CUSCOD);
    const customer = rawMas.find((r) => cleanStr(r.CUSCOD) === cuscod);

    // In Express, invoices belonging to a bill have ARTRN.BILNUM === bilNum
    const invoices = rawTrn
      .filter((trn) => cleanStr(trn.BILNUM) === bilNum)
      .map((inv) => ({
        DOCNUM: cleanStr(inv.DOCNUM),
        DOCDAT: cleanDate(inv.DOCDAT),
        DUEDAT: cleanDate(inv.DUEDAT),
        RECTYP: cleanStr(inv.RECTYP),
        AMOUNT: cleanNum(inv.AMOUNT),
        VATAMT: cleanNum(inv.VATAMT),
        NETAMT: cleanNum(inv.NETAMT),
        RCVAMT: cleanNum(inv.RCVAMT),
        REMAMT: cleanNum(inv.REMAMT),
      }))
      .sort((a, b) => (a.DOCDAT?.getTime() ?? 0) - (b.DOCDAT?.getTime() ?? 0));

    // Remarks from ARTRNRM (where DOCNUM === bilNum)
    const remarks = rawRm
      .filter((r) => cleanStr(r.DOCNUM) === bilNum)
      .map((r) => ({
        SEQNUM: cleanStr(r.SEQNUM),
        REMARK: cleanStr(r.REMARK),
      }))
      .sort((a, b) => a.SEQNUM.localeCompare(b.SEQNUM));

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

    const billing = {
      BILNUM: cleanStr(header.BILNUM),
      BILDAT: cleanDate(header.BILDAT),
      CUSCOD: cuscod,
      BILOUT: cleanDate(header.BILOUT),
      APPDAT: cleanDate(header.APPDAT),
      PAYCOND: cleanStr(header.PAYCOND),
      REMARK: cleanStr(header.REMARK),
      NETAMT: cleanNum(header.NETAMT),
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

    const html = generateBillingHtml({
      billing,
      customer: customerData,
      invoices,
      remarks,
      company,
      page: pageParam ? (pageParam === "all" ? "all" : parseInt(pageParam, 10)) : "all",
    });

    const pdfBuffer = await renderHtmlToPdf(html);
    const disposition = isDownload ? "attachment" : "inline";

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `${disposition}; filename="billing_${bilNum}.pdf"; filename*=UTF-8''${encodeURIComponent(`billing_${bilNum}.pdf`)}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err) {
    console.error("Billing PDF error:", err);
    return new NextResponse(
      `เกิดข้อผิดพลาดในการสร้าง PDF: ${String(err)}`,
      { status: 500 }
    );
  }
}
