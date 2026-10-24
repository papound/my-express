import { readAll, cleanStr, cleanNum, cleanDate } from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rawTrn, rawMas, rawSo, rawBil, rawInfo] = await Promise.all([
      readAll<Record<string, unknown>>("ARTRN"),
      readAll<Record<string, unknown>>("ARMAS"),
      readAll<Record<string, unknown>>("OESO"),
      readAll<Record<string, unknown>>("ARBIL"),
      readAll<Record<string, unknown>>("ISINFO"),
    ]);

    const companyRaw = rawInfo[0];
    const company = {
      name: cleanStr(companyRaw?.THINAM) || "บริษัท ธงธัญ99 จำกัด",
      engName: cleanStr(companyRaw?.ENGNAM) || "THONGTHAN99 Co.,LTD.",
      taxId: cleanStr(companyRaw?.TAXID) || "",
      address: [cleanStr(companyRaw?.ADDR01), cleanStr(companyRaw?.ADDR02)]
        .filter(Boolean)
        .join(" "),
      tel: cleanStr(companyRaw?.TELNUM) || "",
    };

    // วันที่ทำการ (Default: วันปัจจุบัน)
    const workingDate = new Date().toISOString();

    const cusMap = new Map(
      rawMas.map((r) => [
        cleanStr(r.CUSCOD),
        {
          CUSNAM: cleanStr(r.CUSNAM),
          PRENAM: cleanStr(r.PRENAM),
          BALANCE: cleanNum(r.BALANCE),
          CRLINE: cleanNum(r.CRLINE),
        },
      ])
    );

    let totalSales = 0;
    let cashSales = 0;
    let creditSales = 0;
    let totalOutstanding = 0;

    // Build deposit usage map: ADVNUM -> list of sales invoices that deducted this deposit
    const depositUsageMap = new Map<
      string,
      Array<{
        DOCNUM: string;
        RECTYP: string;
        ADVAMT: number;
        DOCDAT: Date | null;
      }>
    >();

    for (const r of rawTrn) {
      const advnum = cleanStr(r.ADVNUM);
      const advamt = cleanNum(r.ADVAMT);
      if (advnum && advnum.length > 2) {
        if (!depositUsageMap.has(advnum)) {
          depositUsageMap.set(advnum, []);
        }
        depositUsageMap.get(advnum)!.push({
          DOCNUM: cleanStr(r.DOCNUM),
          RECTYP: cleanStr(r.RECTYP),
          ADVAMT: advamt,
          DOCDAT: cleanDate(r.DOCDAT),
        });
      }
    }

    const parsedTrn = rawTrn.map((r) => {
      const net = cleanNum(r.NETAMT);
      const rem = cleanNum(r.REMAMT);
      const rectyp = cleanStr(r.RECTYP);
      const cuscod = cleanStr(r.CUSCOD);
      const docdat = cleanDate(r.DOCDAT);
      const docnum = cleanStr(r.DOCNUM);
      const advnum = cleanStr(r.ADVNUM);
      const advamt = cleanNum(r.ADVAMT);
      const validAdvnum = advnum && advnum.length > 2 ? advnum : null;
      const appliedInvoices = depositUsageMap.get(docnum) ?? [];

      totalSales += net;
      if (rectyp === "1") cashSales += net;
      if (rectyp === "3" || rectyp === "2") creditSales += net;
      totalOutstanding += rem;

      return {
        DOCNUM: docnum,
        DOCDAT: docdat,
        RECTYP: rectyp,
        CUSCOD: cuscod,
        NETAMT: net,
        REMAMT: rem,
        ADVNUM: validAdvnum,
        ADVAMT: advamt,
        appliedInvoices,
        DOCSTAT: cleanStr(r.DOCSTAT),
        customer: cusMap.get(cuscod),
      };
    });

    // Recent 6 transactions
    const recentInvoices = [...parsedTrn]
      .sort((a, b) => (b.DOCDAT?.getTime() ?? 0) - (a.DOCDAT?.getTime() ?? 0))
      .slice(0, 6);

    // Top 5 Debtors with highest balance
    const topDebtors = rawMas
      .map((r) => ({
        CUSCOD: cleanStr(r.CUSCOD),
        PRENAM: cleanStr(r.PRENAM),
        CUSNAM: cleanStr(r.CUSNAM),
        BALANCE: cleanNum(r.BALANCE),
        TELNUM: cleanStr(r.TELNUM),
      }))
      .filter((c) => c.BALANCE > 0)
      .sort((a, b) => b.BALANCE - a.BALANCE)
      .slice(0, 5);

    return NextResponse.json({
      company,
      workingDate,
      stats: {
        totalSales,
        cashSales,
        creditSales,
        totalOutstanding,
        invoiceCount: rawTrn.length,
        customerCount: rawMas.length,
        quotationCount: rawSo.length,
        billingCount: rawBil.length,
      },
      recentInvoices,
      topDebtors,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดสถิติแดชบอร์ดได้", detail: String(err) },
      { status: 500 }
    );
  }
}

