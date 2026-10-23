import { readAll, cleanStr, cleanNum, cleanDate } from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ docnum: string }> }
) {
  try {
    const { docnum } = await params;
    const docNum = decodeURIComponent(docnum).trim();

    // Load all required tables in parallel
    const [rawTrn, rawMas, rawCrd, rawRm, rawShip, rawInfo, rawTab] =
      await Promise.all([
        readAll<Record<string, unknown>>("ARTRN"),
        readAll<Record<string, unknown>>("ARMAS"),
        readAll<Record<string, unknown>>("STCRD"),
        readAll<Record<string, unknown>>("ARTRNRM"),
        readAll<Record<string, unknown>>("ARSHIP"),
        readAll<Record<string, unknown>>("ISINFO"),
        readAll<Record<string, unknown>>("ISTAB"),
      ]);

    // Find invoice header
    const header = rawTrn.find((r) => cleanStr(r.DOCNUM) === docNum);
    if (!header) {
      return NextResponse.json(
        { error: `ไม่พบเอกสารเลขที่ ${docNum}` },
        { status: 404 }
      );
    }

    const cuscod = cleanStr(header.CUSCOD);
    const customer = rawMas.find((r) => cleanStr(r.CUSCOD) === cuscod);
    const shiptoCode = cleanStr(header.SHIPTO);
    const shipTo = rawShip.find(
      (r) =>
        cleanStr(r.CUSCOD) === cuscod && cleanStr(r.SHIPTO) === shiptoCode
    );

    // Build unit map from ISTAB (TABTYP = "20")
    const unitMap = new Map<string, string>();
    rawTab
      .filter((r) => cleanStr(r.TABTYP) === "20")
      .forEach((r) => {
        const code = cleanStr(r.TYPCOD);
        const name = cleanStr(r.SHORTNAM) || cleanStr(r.TYPDES);
        if (code && name) unitMap.set(code, name);
      });

    // Line items
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
        VATCOD: cleanStr(r.VATCOD),
        FREE: cleanStr(r.FREE),
        LOCCOD: cleanStr(r.LOCCOD),
        PACKING: cleanStr(r.PACKING),
      }))
      .sort((a, b) => parseInt(a.SEQNUM || "0", 10) - parseInt(b.SEQNUM || "0", 10));

    // Remarks
    const remarks = rawRm
      .filter((r) => cleanStr(r.DOCNUM) === docNum)
      .map((r) => ({
        SEQNUM: cleanStr(r.SEQNUM),
        REMARK: cleanStr(r.REMARK),
      }));

    // Company info
    const companyRaw = rawInfo[0];
    const company = companyRaw
      ? {
          THINAM: cleanStr(companyRaw.THINAM),
          ADDR01: cleanStr(companyRaw.ADDR01),
          ADDR02: cleanStr(companyRaw.ADDR02),
          TELNUM: cleanStr(companyRaw.TELNUM),
          TAXID: cleanStr(companyRaw.TAXID),
          VATRAT: cleanNum(companyRaw.VATRAT),
          ORGNUM: cleanNum(companyRaw.ORGNUM),
          ORGSTR: cleanStr(companyRaw.ORGSTR),
        }
      : null;

    const invoice = {
      RECTYP: cleanStr(header.RECTYP),
      DOCNUM: cleanStr(header.DOCNUM),
      DOCDAT: cleanDate(header.DOCDAT),
      CUSCOD: cuscod,
      SONUM: cleanStr(header.SONUM),
      DEPCOD: cleanStr(header.DEPCOD),
      FLGVAT: cleanStr(header.FLGVAT),
      SLMCOD: cleanStr(header.SLMCOD),
      YOUREF: cleanStr(header.YOUREF),
      PAYTRM: cleanNum(header.PAYTRM),
      DUEDAT: cleanDate(header.DUEDAT),
      BILNUM: cleanStr(header.BILNUM),
      AMOUNT: cleanNum(header.AMOUNT),
      DISCAMT: cleanNum(header.DISCAMT),
      AFTDISC: cleanNum(header.AFTDISC),
      VATAMT: cleanNum(header.VATAMT),
      NETAMT: cleanNum(header.NETAMT),
      TOTAL: cleanNum(header.TOTAL),
      RCVAMT: cleanNum(header.RCVAMT),
      REMAMT: cleanNum(header.REMAMT),
      VATRAT: cleanNum(header.VATRAT),
      DOCSTAT: cleanStr(header.DOCSTAT),
      BILLTO: cleanStr(header.BILLTO),
      ORGNUM: cleanNum(header.ORGNUM),
    };

    const customerData = customer
      ? {
          CUSNAM: cleanStr(customer.CUSNAM),
          PRENAM: cleanStr(customer.PRENAM),
          CUSNAM2: cleanStr(customer.CUSNAM2),
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
      invoice,
      customer: customerData,
      items,
      remarks,
      shipTo: shipTo
        ? {
            ADDR01: cleanStr(shipTo.ADDR01),
            ADDR02: cleanStr(shipTo.ADDR02),
            ADDR03: cleanStr(shipTo.ADDR03),
            TELNUM: cleanStr(shipTo.TELNUM),
            CONTACT: cleanStr(shipTo.CONTACT),
          }
        : null,
      company,
    });
  } catch (err) {
    console.error("GET /api/invoices/[docnum] error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดรายละเอียดเอกสาร", detail: String(err) },
      { status: 500 }
    );
  }
}

