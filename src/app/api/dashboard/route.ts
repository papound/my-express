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

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sales by period
    const salesPeriods = {
      all: { total: 0, cash: 0, credit: 0, count: 0 },
      month: { total: 0, cash: 0, credit: 0, count: 0 },
      week: { total: 0, cash: 0, credit: 0, count: 0 },
      today: { total: 0, cash: 0, credit: 0, count: 0 },
    };

    // AR Aging Schedule
    const aging = {
      notDue: { amount: 0, count: 0 },
      days1_30: { amount: 0, count: 0 },
      days31_60: { amount: 0, count: 0 },
      days61_90: { amount: 0, count: 0 },
      daysOver90: { amount: 0, count: 0 },
      totalAmount: 0,
      totalCount: 0,
    };

    const overdueList: Array<{
      DOCNUM: string;
      DOCDAT: Date | null;
      DUEDAT: Date | null;
      daysOverdue: number;
      REMAMT: number;
      NETAMT: number;
      RECTYP: string;
      CUSCOD: string;
      customer?: { CUSNAM: string; PRENAM: string };
    }> = [];

    const dueSoonList: Array<{
      DOCNUM: string;
      DOCDAT: Date | null;
      DUEDAT: Date | null;
      daysRemaining: number;
      REMAMT: number;
      NETAMT: number;
      RECTYP: string;
      CUSCOD: string;
      customer?: { CUSNAM: string; PRENAM: string };
    }> = [];

    const unappliedDeposits: Array<{
      DOCNUM: string;
      DOCDAT: Date | null;
      NETAMT: number;
      REMAMT: number;
      CUSCOD: string;
      customer?: { CUSNAM: string; PRENAM: string };
    }> = [];

    let totalUnappliedDepositAmount = 0;

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
      const duedat = cleanDate(r.DUEDAT) || docdat;
      const docstat = cleanStr(r.DOCSTAT);
      const customer = cusMap.get(cuscod);

      if (docstat !== "C") {
        totalSales += net;
        if (rectyp === "1") cashSales += net;
        if (rectyp === "3" || rectyp === "2") creditSales += net;
        totalOutstanding += rem;

        // 1. Sales periods calculation (HS=1, IV=3 or 2)
        const isCash = rectyp === "1";
        const isCredit = rectyp === "3" || rectyp === "2";
        if (isCash || isCredit) {
          salesPeriods.all.total += net;
          if (isCash) salesPeriods.all.cash += net;
          if (isCredit) salesPeriods.all.credit += net;
          salesPeriods.all.count += 1;

          if (docdat) {
            if (docdat >= startOfMonth) {
              salesPeriods.month.total += net;
              if (isCash) salesPeriods.month.cash += net;
              if (isCredit) salesPeriods.month.credit += net;
              salesPeriods.month.count += 1;
            }
            if (docdat >= sevenDaysAgo) {
              salesPeriods.week.total += net;
              if (isCash) salesPeriods.week.cash += net;
              if (isCredit) salesPeriods.week.credit += net;
              salesPeriods.week.count += 1;
            }
            if (docdat >= startOfToday) {
              salesPeriods.today.total += net;
              if (isCash) salesPeriods.today.cash += net;
              if (isCredit) salesPeriods.today.credit += net;
              salesPeriods.today.count += 1;
            }
          }
        }

        // 2. Unapplied advance deposits (RECTYP === "0" or starts with AI)
        if (rectyp === "0" || docnum.startsWith("AI")) {
          if (appliedInvoices.length === 0 || rem > 0.01) {
            const depositBal = rem > 0.01 ? rem : net;
            totalUnappliedDepositAmount += depositBal;
            unappliedDeposits.push({
              DOCNUM: docnum,
              DOCDAT: docdat,
              NETAMT: net,
              REMAMT: depositBal,
              CUSCOD: cuscod,
              customer,
            });
          }
        }

        // 3. AR Aging and Overdue / Due Soon alerts (only unpaid credit/sales invoices)
        if (rectyp !== "9" && rectyp !== "0" && rem > 0.01) {
          const dueTime = duedat ? duedat.getTime() : startOfToday.getTime();
          const diffDays = Math.floor((startOfToday.getTime() - dueTime) / (1000 * 60 * 60 * 24));

          aging.totalAmount += rem;
          aging.totalCount += 1;

          if (diffDays <= 0) {
            aging.notDue.amount += rem;
            aging.notDue.count += 1;
          } else if (diffDays <= 30) {
            aging.days1_30.amount += rem;
            aging.days1_30.count += 1;
          } else if (diffDays <= 60) {
            aging.days31_60.amount += rem;
            aging.days31_60.count += 1;
          } else if (diffDays <= 90) {
            aging.days61_90.amount += rem;
            aging.days61_90.count += 1;
          } else {
            aging.daysOver90.amount += rem;
            aging.daysOver90.count += 1;
          }

          if (diffDays > 0) {
            overdueList.push({
              DOCNUM: docnum,
              DOCDAT: docdat,
              DUEDAT: duedat,
              daysOverdue: diffDays,
              REMAMT: rem,
              NETAMT: net,
              RECTYP: rectyp,
              CUSCOD: cuscod,
              customer,
            });
          }

          if (diffDays <= 0 && diffDays >= -7) {
            dueSoonList.push({
              DOCNUM: docnum,
              DOCDAT: docdat,
              DUEDAT: duedat,
              daysRemaining: Math.abs(diffDays),
              REMAMT: rem,
              NETAMT: net,
              RECTYP: rectyp,
              CUSCOD: cuscod,
              customer,
            });
          }
        }
      }

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
        DOCSTAT: docstat,
        customer,
      };
    });

    // Sort alerts
    overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);
    dueSoonList.sort((a, b) => a.daysRemaining - b.daysRemaining);
    unappliedDeposits.sort((a, b) => (b.DOCDAT?.getTime() ?? 0) - (a.DOCDAT?.getTime() ?? 0));

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
        totalUnappliedDepositAmount,
        unappliedDepositCount: unappliedDeposits.length,
      },
      salesPeriods,
      aging,
      alerts: {
        overdueCount: overdueList.length,
        overdueTotal: overdueList.reduce((sum, i) => sum + i.REMAMT, 0),
        overdueList: overdueList.slice(0, 6),
        dueSoonCount: dueSoonList.length,
        dueSoonTotal: dueSoonList.reduce((sum, i) => sum + i.REMAMT, 0),
        dueSoonList: dueSoonList.slice(0, 6),
        unappliedDeposits: unappliedDeposits.slice(0, 6),
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

