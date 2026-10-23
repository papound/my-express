import { readAll, cleanStr, cleanNum, cleanDate } from "@/lib/dbf/reader";
import type { ArMas } from "@/lib/dbf/schema";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const status = searchParams.get("status") ?? "A"; // A=active, I=inactive, all=ทั้งหมด
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "50"));

    const raw = await readAll<Record<string, unknown>>("ARMAS");

    let records = raw.map((r) => ({
      CUSCOD: cleanStr(r.CUSCOD),
      CUSTYP: cleanStr(r.CUSTYP),
      PRENAM: cleanStr(r.PRENAM),
      CUSNAM: cleanStr(r.CUSNAM),
      ADDR01: cleanStr(r.ADDR01),
      ADDR02: cleanStr(r.ADDR02),
      ADDR03: cleanStr(r.ADDR03),
      ZIPCOD: cleanStr(r.ZIPCOD),
      TELNUM: cleanStr(r.TELNUM),
      CONTACT: cleanStr(r.CONTACT),
      CUSNAM2: cleanStr(r.CUSNAM2),
      TAXID: cleanStr(r.TAXID),
      ORGNUM: cleanNum(r.ORGNUM),
      SLMCOD: cleanStr(r.SLMCOD),
      AREACOD: cleanStr(r.AREACOD),
      PAYTRM: cleanNum(r.PAYTRM),
      PAYCOND: cleanStr(r.PAYCOND),
      BALANCE: cleanNum(r.BALANCE),
      CRLINE: cleanNum(r.CRLINE),
      REMARK: cleanStr(r.REMARK),
      STATUS: cleanStr(r.STATUS),
      LASIVC: cleanDate(r.LASIVC),
      CHGDAT: cleanDate(r.CHGDAT),
    })) as ArMas[];

    // Filter by status
    if (status !== "all") {
      records = records.filter((r) => r.STATUS === status);
    }

    // Filter by search
    if (search) {
      records = records.filter(
        (r) =>
          r.CUSNAM.toLowerCase().includes(search) ||
          r.CUSCOD.toLowerCase().includes(search) ||
          r.TAXID.includes(search) ||
          r.TELNUM.includes(search)
      );
    }

    const total = records.length;
    const paginated = records.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ data: paginated, total, page, limit });
  } catch (err) {
    console.error("GET /api/customers error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลลูกค้าได้", detail: String(err) },
      { status: 500 }
    );
  }
}

