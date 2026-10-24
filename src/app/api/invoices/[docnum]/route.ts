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
    const [rawTrn, rawMas, rawCrd, rawRm, rawShip, rawInfo, rawTab, rawRcpIt] =
      await Promise.all([
        readAll<Record<string, unknown>>("ARTRN"),
        readAll<Record<string, unknown>>("ARMAS"),
        readAll<Record<string, unknown>>("STCRD"),
        readAll<Record<string, unknown>>("ARTRNRM"),
        readAll<Record<string, unknown>>("ARSHIP"),
        readAll<Record<string, unknown>>("ISINFO"),
        readAll<Record<string, unknown>>("ISTAB"),
        readAll<Record<string, unknown>>("ARRCPIT"),
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
        RETSTK: cleanStr(r.RETSTK),
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
      DEPCOD: cleanStr(header.DEPCOD),
      FLGVAT: cleanStr(header.FLGVAT),
      SLMCOD: cleanStr(header.SLMCOD),
      AREACOD: cleanStr(header.AREACOD),
      YOUREF: cleanStr(header.YOUREF),
      PAYTRM: cleanNum(header.PAYTRM),
      DUEDAT: cleanDate(header.DUEDAT),
      BILNUM: cleanStr(header.BILNUM),
      AMOUNT: cleanNum(header.AMOUNT),
      DISCAMT: cleanNum(header.DISCAMT),
      AFTDISC: cleanNum(header.AFTDISC),
      ADVNUM: cleanStr(header.ADVNUM).length > 2 ? cleanStr(header.ADVNUM) : null,
      ADVAMT: cleanNum(header.ADVAMT),
      VATAMT: cleanNum(header.VATAMT),
      NETAMT: cleanNum(header.NETAMT),
      IVCAMT: cleanNum(header.IVCAMT),
      TOTAL: cleanNum(header.TOTAL),
      RCVAMT: cleanNum(header.RCVAMT),
      REMAMT: cleanNum(header.REMAMT),
      CSHRCV: cleanNum(header.CSHRCV),
      CHQRCV: cleanNum(header.CHQRCV),
      TAX: cleanNum(header.TAX),
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

    // For Receipt (RE / RECTYP === "9"), load applied invoices from ARRCPIT
    const receiptItems = rawRcpIt
      .filter((r) => cleanStr(r.RCPNUM) === docNum)
      .map((r, idx) => {
        const invNum = cleanStr(r.DOCNUM);
        const refInv = rawTrn.find((t) => cleanStr(t.DOCNUM) === invNum);
        return {
          SEQNUM: String(idx + 1),
          DOCNUM: invNum,
          DOCDAT: refInv ? cleanDate(refInv.DOCDAT) : null,
          DUEDAT: refInv ? cleanDate(refInv.DUEDAT) : null,
          AMOUNT: refInv
            ? cleanNum(refInv.NETAMT) || cleanNum(refInv.AMOUNT)
            : cleanNum(r.RCVAMT),
          REMAMT: refInv ? cleanNum(refInv.REMAMT) : 0,
          RCVAMT: cleanNum(r.RCVAMT),
          VATAMT: cleanNum(r.VATAMT),
        };
      });

    // For Deposit (RECTYP === "0" or starts with AI), find which sales invoices deducted it
    const appliedInvoices = rawTrn
      .filter((r) => cleanStr(r.ADVNUM) === docNum)
      .map((r) => {
        const cus = rawMas.find((m) => cleanStr(m.CUSCOD) === cleanStr(r.CUSCOD));
        return {
          DOCNUM: cleanStr(r.DOCNUM),
          RECTYP: cleanStr(r.RECTYP),
          DOCDAT: cleanDate(r.DOCDAT),
          DUEDAT: cleanDate(r.DUEDAT),
          AMOUNT: cleanNum(r.AMOUNT),
          ADVAMT: cleanNum(r.ADVAMT),
          NETAMT: cleanNum(r.NETAMT),
          CUSCOD: cleanStr(r.CUSCOD),
          CUSNAM: cus ? `${cleanStr(cus.PRENAM)} ${cleanStr(cus.CUSNAM)}`.trim() : "",
        };
      });

    // For Sales invoice with ADVNUM, lookup deposit summary
    const advDocnum = cleanStr(header.ADVNUM).length > 2 ? cleanStr(header.ADVNUM) : null;
    const depositTrn = advDocnum
      ? rawTrn.find((r) => cleanStr(r.DOCNUM) === advDocnum)
      : null;
    const depositInfo = depositTrn
      ? {
          DOCNUM: cleanStr(depositTrn.DOCNUM),
          DOCDAT: cleanDate(depositTrn.DOCDAT),
          AMOUNT: cleanNum(depositTrn.AMOUNT),
          NETAMT: cleanNum(depositTrn.NETAMT),
          REMAMT: cleanNum(depositTrn.REMAMT),
        }
      : null;

    return NextResponse.json({
      invoice,
      customer: customerData,
      items: receiptItems.length > 0 ? receiptItems : items,
      receiptItems,
      appliedInvoices,
      depositInfo,
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

