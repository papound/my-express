import { readAll, cleanStr, cleanNum, cleanDate } from "@/lib/dbf/reader";
import type { ArMas } from "@/lib/dbf/schema";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const status = searchParams.get("status") ?? "A"; // A=active, I=inactive, all=ทั้งหมด
    const sort = searchParams.get("sort") ?? "code"; // code, lastInvoice, balance, name
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "50"));

    const [rawMas, rawTrn] = await Promise.all([
      readAll<Record<string, unknown>>("ARMAS"),
      readAll<Record<string, unknown>>("ARTRN"),
    ]);

    // Build latest invoice map from ARTRN
    const latestInvoiceMap = new Map<
      string,
      { date: Date; docnum: string; netamt: number }
    >();

    for (const t of rawTrn) {
      const cuscod = cleanStr(t.CUSCOD);
      const docdat = cleanDate(t.DOCDAT);
      const docnum = cleanStr(t.DOCNUM);
      const netamt = cleanNum(t.NETAMT);
      if (!cuscod || !docdat) continue;

      const curr = latestInvoiceMap.get(cuscod);
      if (!curr || docdat.getTime() > curr.date.getTime()) {
        latestInvoiceMap.set(cuscod, { date: docdat, docnum, netamt });
      }
    }

    let records = rawMas.map((r) => {
      const cuscod = cleanStr(r.CUSCOD);
      const trnLast = latestInvoiceMap.get(cuscod);
      const masLastDate = cleanDate(r.LASIVC);

      const lastInvoiceDate = trnLast ? trnLast.date : masLastDate;
      const lastInvoiceDocnum = trnLast ? trnLast.docnum : null;
      const lastInvoiceAmount = trnLast ? trnLast.netamt : null;

      // สถานะใน Express:
      // "A" = Active
      // "" (ว่าง) = ไม่ได้ระบุ (Active) (ให้ถือว่า Active)
      // "I" (หรือมี INACTDAT) = Inactive
      const rawStatus = cleanStr(r.STATUS).toUpperCase();
      const inactDat = cleanDate(r.INACTDAT);
      const statusType: "A" | "UNSPECIFIED" | "I" =
        rawStatus === "I" || inactDat
          ? "I"
          : rawStatus === "A"
          ? "A"
          : "UNSPECIFIED";
      const isActive = statusType !== "I";
      const statusLabel =
        statusType === "A"
          ? "Active"
          : statusType === "UNSPECIFIED"
          ? "ไม่ได้ระบุ (Active)"
          : "Inactive";

      return {
        CUSCOD: cuscod,
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
        STATUS: rawStatus,
        statusType,
        isActive,
        statusLabel,
        LASIVC: masLastDate,
        lastInvoiceDate,
        lastInvoiceDocnum,
        lastInvoiceAmount,
        CHGDAT: cleanDate(r.CHGDAT),
      };
    });

    // Filter by status:
    // "A" หรือ "active" = ทั้ง Active ("A") และ ไม่ได้ระบุ (Active)
    // "I" = Inactive
    // "all" = ทั้งหมด
    if (status === "A" || status === "active") {
      records = records.filter((r) => r.isActive);
    } else if (status === "I" || status === "inactive") {
      records = records.filter((r) => !r.isActive);
    }

    // Filter by search
    if (search) {
      records = records.filter(
        (r) =>
          r.CUSNAM.toLowerCase().includes(search) ||
          r.CUSCOD.toLowerCase().includes(search) ||
          r.TAXID.includes(search) ||
          r.TELNUM.includes(search) ||
          (r.lastInvoiceDocnum &&
            r.lastInvoiceDocnum.toLowerCase().includes(search))
      );
    }

    // Sort records
    if (sort === "lastInvoice") {
      records.sort((a, b) => {
        const timeA = a.lastInvoiceDate
          ? new Date(a.lastInvoiceDate).getTime()
          : 0;
        const timeB = b.lastInvoiceDate
          ? new Date(b.lastInvoiceDate).getTime()
          : 0;
        return timeB - timeA;
      });
    } else if (sort === "balance") {
      records.sort((a, b) => b.BALANCE - a.BALANCE);
    } else if (sort === "name") {
      records.sort((a, b) => a.CUSNAM.localeCompare(b.CUSNAM, "th"));
    } else {
      records.sort((a, b) => a.CUSCOD.localeCompare(b.CUSCOD));
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

