import { readAll, cleanStr, cleanNum, cleanDate } from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    const status = searchParams.get("status") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "20"));

    const [rawBil, rawMas, rawTrn] = await Promise.all([
      readAll<Record<string, unknown>>("ARBIL"),
      readAll<Record<string, unknown>>("ARMAS"),
      readAll<Record<string, unknown>>("ARTRN"),
    ]);

    const cusMap = new Map(
      rawMas.map((r) => [
        cleanStr(r.CUSCOD),
        { CUSNAM: cleanStr(r.CUSNAM), TELNUM: cleanStr(r.TELNUM) },
      ])
    );

    // Build billing items count from ARTRN where ARTRN.BILNUM === ARBIL.BILNUM
    const bilItemCountMap = new Map<string, number>();
    for (const trn of rawTrn) {
      const bnum = cleanStr(trn.BILNUM);
      if (bnum && bnum !== "~") {
        bilItemCountMap.set(bnum, (bilItemCountMap.get(bnum) ?? 0) + 1);
      }
    }

    let records = rawBil.map((r) => {
      const cuscod = cleanStr(r.CUSCOD);
      const bilnum = cleanStr(r.BILNUM);
      return {
        BILNUM: bilnum,
        BILDAT: cleanDate(r.BILDAT),
        CUSCOD: cuscod,
        DEPCOD: cleanStr(r.DEPCOD),
        BILOUT: cleanDate(r.BILOUT),
        APPDAT: cleanDate(r.APPDAT),
        PAYCOND: cleanStr(r.PAYCOND),
        REMARK: cleanStr(r.REMARK),
        NETAMT: cleanNum(r.NETAMT),
        DOCSTAT: cleanStr(r.DOCSTAT),
        USERID: cleanStr(r.USERID),
        PRNCNT: cleanNum(r.PRNCNT),
        customer: cusMap.get(cuscod),
        invoiceCount: bilItemCountMap.get(bilnum) ?? 0,
      };
    });

    if (status !== "all") records = records.filter((r) => r.DOCSTAT === status);
    if (dateFrom) {
      const from = new Date(dateFrom);
      records = records.filter((r) => r.BILDAT && r.BILDAT >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      records = records.filter((r) => r.BILDAT && r.BILDAT <= to);
    }
    if (search) {
      records = records.filter(
        (r) =>
          r.BILNUM.toLowerCase().includes(search) ||
          r.CUSCOD.toLowerCase().includes(search) ||
          r.customer?.CUSNAM.toLowerCase().includes(search)
      );
    }

    records.sort(
      (a, b) => (b.BILDAT?.getTime() ?? 0) - (a.BILDAT?.getTime() ?? 0)
    );

    const total = records.length;
    return NextResponse.json({
      data: records.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "ไม่สามารถโหลดใบวางบิล", detail: String(err) },
      { status: 500 }
    );
  }
}
