import { readAll, cleanStr, cleanNum, cleanDate } from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sonum: string }> }
) {
  try {
    const { sonum } = await params;
    const soNum = decodeURIComponent(sonum).trim();

    const [rawSo, rawMas, rawSoIt, rawInfo, rawRm, rawTab] = await Promise.all([
      readAll<Record<string, unknown>>("OESO"),
      readAll<Record<string, unknown>>("ARMAS"),
      readAll<Record<string, unknown>>("OESOIT"),
      readAll<Record<string, unknown>>("ISINFO"),
      readAll<Record<string, unknown>>("ARTRNRM"),
      readAll<Record<string, unknown>>("ISTAB"),
    ]);

    const header = rawSo.find((r) => cleanStr(r.SONUM) === soNum);
    if (!header) {
      return NextResponse.json(
        { error: `ไม่พบใบเสนอราคาเลขที่ ${soNum}` },
        { status: 404 }
      );
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

    const remarks = rawRm
      .filter((r) => cleanStr(r.DOCNUM) === soNum)
      .map((r) => ({
        SEQNUM: cleanStr(r.SEQNUM),
        REMARK: cleanStr(r.REMARK),
      }))
      .sort((a, b) => a.SEQNUM.localeCompare(b.SEQNUM));

    const items = rawSoIt
      .filter((r) => cleanStr(r.SONUM) === soNum)
      .map((r) => ({
        STKCOD: cleanStr(r.STKCOD),
        STKDES: cleanStr(r.STKDES),
        SEQNUM: cleanStr(r.SEQNUM),
        ORDQTY: cleanNum(r.ORDQTY),
        REMQTY: cleanNum(r.REMQTY),
        TQUCOD: unitMap.get(cleanStr(r.TQUCOD)) || cleanStr(r.TQUCOD),
        UNITPR: cleanNum(r.UNITPR),
        DISC: cleanStr(r.DISC),
        DISCAMT: cleanNum(r.DISCAMT),
        TRNVAL: cleanNum(r.TRNVAL),
      }))
      .sort((a, b) => parseInt(a.SEQNUM || "0", 10) - parseInt(b.SEQNUM || "0", 10));

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

    const quotation = {
      SONUM: cleanStr(header.SONUM),
      SODAT: cleanDate(header.SODAT),
      CUSCOD: cuscod,
      SLMCOD: cleanStr(header.SLMCOD),
      YOUREF: cleanStr(header.YOUREF),
      PAYTRM: cleanNum(header.PAYTRM),
      DLVDAT: cleanDate(header.DLVDAT),
      AMOUNT: cleanNum(header.AMOUNT),
      DISC: cleanStr(header.DISC),
      DISCAMT: cleanNum(header.DISCAMT),
      VATAMT: cleanNum(header.VATAMT),
      NETAMT: cleanNum(header.NETAMT),
      TOTAL: cleanNum(header.TOTAL),
      VATRAT: cleanNum(header.VATRAT),
      DOCSTAT: cleanStr(header.DOCSTAT),
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
      quotation,
      customer: customerData,
      items,
      remarks,
      company,
    });
  } catch (err) {
    console.error("GET /api/quotations/[sonum] error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดรายละเอียดใบเสนอราคาได้", detail: String(err) },
      { status: 500 }
    );
  }
}

