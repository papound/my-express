import { readAll, cleanStr, cleanNum, cleanDate } from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bilnum: string }> }
) {
  try {
    const { bilnum } = await params;
    const bilNum = decodeURIComponent(bilnum).trim();

    const [rawBil, rawMas, rawTrn, rawInfo] = await Promise.all([
      readAll<Record<string, unknown>>("ARBIL"),
      readAll<Record<string, unknown>>("ARMAS"),
      readAll<Record<string, unknown>>("ARTRN"),
      readAll<Record<string, unknown>>("ISINFO"),
    ]);

    const header = rawBil.find((r) => cleanStr(r.BILNUM) === bilNum);
    if (!header) {
      return NextResponse.json(
        { error: `ไม่พบใบวางบิลเลขที่ ${bilNum}` },
        { status: 404 }
      );
    }

    const cuscod = cleanStr(header.CUSCOD);
    const customer = rawMas.find((r) => cleanStr(r.CUSCOD) === cuscod);

    // In Express, invoices belonging to a bill have ARTRN.BILNUM === bilNum
    const invoices = rawTrn
      .filter((trn) => cleanStr(trn.BILNUM) === bilNum)
      .map((inv) => ({
        DOCNUM: cleanStr(inv.DOCNUM),
        DOCDAT: cleanDate(inv.DOCDAT),
        RECTYP: cleanStr(inv.RECTYP),
        AMOUNT: cleanNum(inv.AMOUNT),
        VATAMT: cleanNum(inv.VATAMT),
        NETAMT: cleanNum(inv.NETAMT),
        REMAMT: cleanNum(inv.REMAMT),
      }))
      .sort((a, b) => (a.DOCDAT?.getTime() ?? 0) - (b.DOCDAT?.getTime() ?? 0));

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
      DOCSTAT: cleanStr(header.DOCSTAT),
      USERID: cleanStr(header.USERID),
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

    return NextResponse.json({
      billing,
      customer: customerData,
      invoices,
      company,
    });
  } catch (err) {
    console.error("GET /api/billing/[bilnum] error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดรายละเอียดใบวางบิลได้", detail: String(err) },
      { status: 500 }
    );
  }
}
