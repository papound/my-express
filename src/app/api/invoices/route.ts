import {
  readAll,
  cleanStr,
  cleanNum,
  cleanDate,
  findOne,
} from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rectyp = searchParams.get("rectyp") ?? "all"; // "1"=เงินสด, "2"=เครดิต, "all"
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const dateFrom = searchParams.get("from"); // YYYY-MM-DD
    const dateTo = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "20"));

    // Load ARTRN + ARMAS in parallel
    const [rawTrn, rawMas] = await Promise.all([
      readAll<Record<string, unknown>>("ARTRN"),
      readAll<Record<string, unknown>>("ARMAS"),
    ]);

    // Build customer lookup map
    const cusMap = new Map(
      rawMas.map((r) => [
        cleanStr(r.CUSCOD),
        {
          CUSNAM: cleanStr(r.CUSNAM),
          PRENAM: cleanStr(r.PRENAM),
          TAXID: cleanStr(r.TAXID),
          ADDR01: cleanStr(r.ADDR01),
        },
      ])
    );

    let records = rawTrn.map((r) => {
      const cuscod = cleanStr(r.CUSCOD);
      return {
        RECTYP: cleanStr(r.RECTYP),
        DOCNUM: cleanStr(r.DOCNUM),
        DOCDAT: cleanDate(r.DOCDAT),
        CUSCOD: cuscod,
        SONUM: cleanStr(r.SONUM),
        DEPCOD: cleanStr(r.DEPCOD),
        FLGVAT: cleanStr(r.FLGVAT),
        SLMCOD: cleanStr(r.SLMCOD),
        YOUREF: cleanStr(r.YOUREF),
        DUEDAT: cleanDate(r.DUEDAT),
        BILNUM: cleanStr(r.BILNUM),
        AMOUNT: cleanNum(r.AMOUNT),
        DISCAMT: cleanNum(r.DISCAMT),
        AFTDISC: cleanNum(r.AFTDISC),
        VATAMT: cleanNum(r.VATAMT),
        NETAMT: cleanNum(r.NETAMT),
        TOTAL: cleanNum(r.TOTAL),
        RCVAMT: cleanNum(r.RCVAMT),
        REMAMT: cleanNum(r.REMAMT),
        VATRAT: cleanNum(r.VATRAT),
        DOCSTAT: cleanStr(r.DOCSTAT),
        USERID: cleanStr(r.USERID),
        PRNDAT: cleanDate(r.PRNDAT),
        PRNCNT: cleanNum(r.PRNCNT),
        BILLTO: cleanStr(r.BILLTO),
        ORGNUM: cleanNum(r.ORGNUM),
        // joined
        customer: cusMap.get(cuscod),
      };
    });

    // Filter by rectyp
    if (rectyp !== "all") {
      if (rectyp === "3" || rectyp === "2") {
        records = records.filter((r) => r.RECTYP === "3" || r.RECTYP === "2");
      } else {
        records = records.filter((r) => r.RECTYP === rectyp);
      }
    }

    // Filter by date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      records = records.filter((r) => r.DOCDAT && r.DOCDAT >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      records = records.filter((r) => r.DOCDAT && r.DOCDAT <= to);
    }

    // Filter by search (customer name / doc number)
    if (search) {
      records = records.filter(
        (r) =>
          r.DOCNUM.toLowerCase().includes(search) ||
          r.CUSCOD.toLowerCase().includes(search) ||
          r.customer?.CUSNAM.toLowerCase().includes(search)
      );
    }

    // Sort by date descending
    records.sort(
      (a, b) => (b.DOCDAT?.getTime() ?? 0) - (a.DOCDAT?.getTime() ?? 0)
    );

    const total = records.length;
    const paginated = records.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ data: paginated, total, page, limit });
  } catch (err) {
    console.error("GET /api/invoices error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลใบขายได้", detail: String(err) },
      { status: 500 }
    );
  }
}

