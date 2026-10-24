import {
  readAll,
  cleanStr,
  cleanNum,
  cleanDate,
  cleanSearchQuery,
  matchSearch,
} from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = cleanSearchQuery(searchParams.get("search"));
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    const status = searchParams.get("status") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "20"));

    const [rawSo, rawMas] = await Promise.all([
      readAll<Record<string, unknown>>("OESO"),
      readAll<Record<string, unknown>>("ARMAS"),
    ]);

    const cusMap = new Map(
      rawMas.map((r) => [
        cleanStr(r.CUSCOD),
        { CUSNAM: cleanStr(r.CUSNAM), TELNUM: cleanStr(r.TELNUM) },
      ])
    );

    let records = rawSo.map((r) => {
      const cuscod = cleanStr(r.CUSCOD);
      return {
        SORECTYP: cleanStr(r.SORECTYP),
        SONUM: cleanStr(r.SONUM),
        SODAT: cleanDate(r.SODAT),
        CUSCOD: cuscod,
        DEPCOD: cleanStr(r.DEPCOD),
        SLMCOD: cleanStr(r.SLMCOD),
        YOUREF: cleanStr(r.YOUREF),
        DLVDAT: cleanDate(r.DLVDAT),
        AMOUNT: cleanNum(r.AMOUNT),
        DISCAMT: cleanNum(r.DISCAMT),
        VATAMT: cleanNum(r.VATAMT),
        NETAMT: cleanNum(r.NETAMT),
        TOTAL: cleanNum(r.TOTAL),
        VATRAT: cleanNum(r.VATRAT),
        DOCSTAT: cleanStr(r.DOCSTAT),
        USERID: cleanStr(r.USERID),
        PRNCNT: cleanNum(r.PRNCNT),
        customer: cusMap.get(cuscod),
      };
    });

    if (status !== "all") records = records.filter((r) => r.DOCSTAT === status);
    if (dateFrom) {
      const from = new Date(dateFrom);
      records = records.filter((r) => r.SODAT && r.SODAT >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      records = records.filter((r) => r.SODAT && r.SODAT <= to);
    }
    if (search) {
      records = records.filter(
        (r) =>
          matchSearch(r.SONUM, search) ||
          matchSearch(r.CUSCOD, search) ||
          matchSearch(r.customer?.CUSNAM, search) ||
          matchSearch(r.YOUREF, search)
      );
    }

    records.sort(
      (a, b) => (b.SODAT?.getTime() ?? 0) - (a.SODAT?.getTime() ?? 0)
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
      { error: "ไม่สามารถโหลดใบเสนอราคา", detail: String(err) },
      { status: 500 }
    );
  }
}

