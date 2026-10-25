import {
  readAll,
  cleanStr,
  cleanNum,
  cleanDate,
} from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stkcod: string }> }
) {
  try {
    const { stkcod } = await params;
    const targetCode = decodeURIComponent(stkcod).trim();

    const [rawMas, rawLoc, rawCrd, rawTab] = await Promise.all([
      readAll<Record<string, unknown>>("STMAS"),
      readAll<Record<string, unknown>>("STLOC"),
      readAll<Record<string, unknown>>("STCRD"),
      readAll<Record<string, unknown>>("ISTAB"),
    ]);

    // Find product master
    const master = rawMas.find((r) => cleanStr(r.STKCOD) === targetCode);
    if (!master) {
      return NextResponse.json(
        { error: `ไม่พบสินค้ารหัส ${targetCode}` },
        { status: 404 }
      );
    }

    // Build Warehouse/Location Map (TABTYP = "21")
    const warehouseMap = new Map<string, string>();
    rawTab
      .filter((r) => cleanStr(r.TABTYP) === "21")
      .forEach((r) => {
        const code = cleanStr(r.TYPCOD);
        const name = cleanStr(r.TYPDES) || cleanStr(r.SHORTNAM) || `คลัง ${code}`;
        if (code) warehouseMap.set(code, name);
      });

    // Build Unit Map (TABTYP = "20")
    const unitMap = new Map<string, string>();
    rawTab
      .filter((r) => cleanStr(r.TABTYP) === "20")
      .forEach((r) => {
        const code = cleanStr(r.TYPCOD);
        const name = cleanStr(r.SHORTNAM) || cleanStr(r.TYPDES);
        if (code && name) unitMap.set(code, name);
      });

    // Build Group Map (TABTYP = "22")
    const groupMap = new Map<string, string>();
    rawTab
      .filter((r) => cleanStr(r.TABTYP) === "22")
      .forEach((r) => {
        const code = cleanStr(r.TYPCOD);
        const name = cleanStr(r.TYPDES) || cleanStr(r.SHORTNAM);
        if (code && name) groupMap.set(code, name);
      });

    // Location balances
    const locations = rawLoc
      .filter((l) => cleanStr(l.STKCOD) === targetCode)
      .map((l) => {
        const loccod = cleanStr(l.LOCCOD);
        return {
          LOCCOD: loccod,
          warehouseName: warehouseMap.get(loccod) || `คลัง ${loccod}`,
          LOCBAL: cleanNum(l.LOCBAL),
          LOCVAL: cleanNum(l.LOCVAL),
          AREA: cleanStr(l.AREA),
        };
      });

    // Stock Card movements
    const stockCard = rawCrd
      .filter((c) => cleanStr(c.STKCOD) === targetCode)
      .map((c) => {
        const docnum = cleanStr(c.DOCNUM);
        const loccod = cleanStr(c.LOCCOD);
        const posopr = cleanStr(c.POSOPR);
        const trnqty = cleanNum(c.TRNQTY);
        const unitpr = cleanNum(c.UNITPR);
        const trnval = cleanNum(c.TRNVAL);

        return {
          DOCNUM: docnum,
          DOCDAT: cleanDate(c.DOCDAT),
          LOCCOD: loccod,
          warehouseName: warehouseMap.get(loccod) || loccod,
          POSOPR: posopr,
          TRNQTY: trnqty,
          UNITPR: unitpr,
          TRNVAL: trnval,
          PEOPLE: cleanStr(c.PEOPLE),
          REFNUM: cleanStr(c.REFNUM),
          STKDES: cleanStr(c.STKDES),
          TQUCOD: unitMap.get(cleanStr(c.TQUCOD)) || cleanStr(c.TQUCOD),
        };
      })
      .sort((a, b) => (b.DOCDAT?.getTime() ?? 0) - (a.DOCDAT?.getTime() ?? 0));

    const qucod = cleanStr(master.QUCOD);
    const stkgrp = cleanStr(master.STKGRP);

    const product = {
      STKCOD: cleanStr(master.STKCOD),
      STKDES: cleanStr(master.STKDES),
      STKDES2: cleanStr(master.STKDES2),
      BARCOD: cleanStr(master.BARCOD),
      STKTYP: cleanStr(master.STKTYP),
      STKGRP: stkgrp,
      groupName: groupMap.get(stkgrp) || stkgrp || "-",
      QUCOD: qucod,
      unitName: unitMap.get(qucod) || qucod || "-",
      TOTBAL: cleanNum(master.TOTBAL),
      TOTVAL: cleanNum(master.TOTVAL),
      UNITPR: cleanNum(master.UNITPR),
      SELLPR1: cleanNum(master.SELLPR1),
      SELLPR2: cleanNum(master.SELLPR2),
      SELLPR3: cleanNum(master.SELLPR3),
      SELLPR4: cleanNum(master.SELLPR4),
      SELLPR5: cleanNum(master.SELLPR5),
      STATUS: cleanStr(master.STATUS) || "A",
      REMARK: cleanStr(master.REMARK),
      CREDAT: cleanDate(master.CREDAT),
    };

    return NextResponse.json({
      product,
      locations,
      stockCard,
    });
  } catch (err) {
    console.error("GET /api/inventory/[stkcod] error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดรายละเอียดสินค้าได้", detail: String(err) },
      { status: 500 }
    );
  }
}

