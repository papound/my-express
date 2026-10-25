import {
  readAll,
  cleanStr,
  cleanNum,
  cleanSearchQuery,
  matchSearch,
} from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = cleanSearchQuery(searchParams.get("search"));
    const warehouse = searchParams.get("warehouse") ?? "all"; // "all" or "01", "02", "03"...
    const stockStatus = searchParams.get("status") ?? "all"; // "all", "inStock", "negative", "zero"
    const group = searchParams.get("group") ?? "all"; // "all" or specific STKGRP
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    // Load STMAS, STLOC, and istab in parallel
    const [rawMas, rawLoc, rawTab] = await Promise.all([
      readAll<Record<string, unknown>>("STMAS"),
      readAll<Record<string, unknown>>("STLOC"),
      readAll<Record<string, unknown>>("ISTAB"),
    ]);

    // Build Warehouse/Location Map (TABTYP = "21")
    const warehouseMap = new Map<string, string>();
    const warehousesList: Array<{ code: string; name: string }> = [];
    rawTab
      .filter((r) => cleanStr(r.TABTYP) === "21")
      .forEach((r) => {
        const code = cleanStr(r.TYPCOD);
        const name = cleanStr(r.TYPDES) || cleanStr(r.SHORTNAM) || `คลัง ${code}`;
        if (code) {
          warehouseMap.set(code, name);
          warehousesList.push({ code, name });
        }
      });

    // Fallback standard warehouses if none defined
    if (warehouseMap.size === 0) {
      warehouseMap.set("01", "คลังสำนักงานใหญ่");
      warehousesList.push({ code: "01", name: "คลังสำนักงานใหญ่" });
    }

    // Build Unit Map (TABTYP = "20")
    const unitMap = new Map<string, string>();
    rawTab
      .filter((r) => cleanStr(r.TABTYP) === "20")
      .forEach((r) => {
        const code = cleanStr(r.TYPCOD);
        const name = cleanStr(r.SHORTNAM) || cleanStr(r.TYPDES);
        if (code && name) unitMap.set(code, name);
      });

    // Build Stock Group Map (TABTYP = "22")
    const groupMap = new Map<string, string>();
    rawTab
      .filter((r) => cleanStr(r.TABTYP) === "22")
      .forEach((r) => {
        const code = cleanStr(r.TYPCOD);
        const name = cleanStr(r.TYPDES) || cleanStr(r.SHORTNAM);
        if (code && name) groupMap.set(code, name);
      });

    // Build location balance map per item: STKCOD -> Array<{ LOCCOD, LOCBAL, LOCVAL }>
    const locBalanceMap = new Map<
      string,
      Array<{
        LOCCOD: string;
        warehouseName: string;
        LOCBAL: number;
        LOCVAL: number;
      }>
    >();

    // Warehouse aggregations for summary
    const warehouseTotals = new Map<
      string,
      { totalQty: number; totalVal: number; itemCount: number }
    >();
    warehousesList.forEach((w) => {
      warehouseTotals.set(w.code, { totalQty: 0, totalVal: 0, itemCount: 0 });
    });

    for (const l of rawLoc) {
      const stkcod = cleanStr(l.STKCOD);
      const loccod = cleanStr(l.LOCCOD);
      const locbal = cleanNum(l.LOCBAL);
      const locval = cleanNum(l.LOCVAL);
      const whName = warehouseMap.get(loccod) || `คลัง ${loccod}`;

      if (!locBalanceMap.has(stkcod)) {
        locBalanceMap.set(stkcod, []);
      }
      locBalanceMap.get(stkcod)!.push({
        LOCCOD: loccod,
        warehouseName: whName,
        LOCBAL: locbal,
        LOCVAL: locval,
      });

      if (locbal !== 0 || locval !== 0) {
        if (!warehouseTotals.has(loccod)) {
          warehouseTotals.set(loccod, { totalQty: 0, totalVal: 0, itemCount: 0 });
        }
        const wt = warehouseTotals.get(loccod)!;
        wt.totalQty += locbal;
        wt.totalVal += locval;
        wt.itemCount += 1;
      }
    }

    // KPI Summary
    let inStockCount = 0;
    let negativeCount = 0;
    let zeroCount = 0;
    let totalBalanceQty = 0;
    let totalBalanceValue = 0;

    // Distinct groups seen in products
    const groupCountMap = new Map<string, number>();

    const allProducts = rawMas.map((r) => {
      const stkcod = cleanStr(r.STKCOD);
      const stkdes = cleanStr(r.STKDES);
      const stkdes2 = cleanStr(r.STKDES2);
      const barcod = cleanStr(r.BARCOD);
      const stkgrp = cleanStr(r.STKGRP);
      const qucod = cleanStr(r.QUCOD);
      const totbal = cleanNum(r.TOTBAL);
      const totval = cleanNum(r.TOTVAL);
      const unitpr = cleanNum(r.UNITPR);
      const sellpr1 = cleanNum(r.SELLPR1);
      const status = cleanStr(r.STATUS) || "A";

      // Count stats
      if (totbal > 0) {
        inStockCount++;
      } else if (totbal < 0) {
        negativeCount++;
      } else {
        zeroCount++;
      }

      totalBalanceQty += totbal;
      totalBalanceValue += totval;

      // Group counts
      if (stkgrp) {
        groupCountMap.set(stkgrp, (groupCountMap.get(stkgrp) || 0) + 1);
      }

      const locations = locBalanceMap.get(stkcod) ?? [];

      return {
        STKCOD: stkcod,
        STKDES: stkdes,
        STKDES2: stkdes2,
        BARCOD: barcod,
        STKGRP: stkgrp,
        groupName: groupMap.get(stkgrp) || stkgrp || "-",
        QUCOD: qucod,
        unitName: unitMap.get(qucod) || qucod || "-",
        TOTBAL: totbal,
        TOTVAL: totval,
        UNITPR: unitpr,
        SELLPR1: sellpr1,
        STATUS: status,
        locations,
      };
    });

    // Filter products
    let filtered = allProducts;

    // 1. Search filter
    if (search) {
      filtered = filtered.filter(
        (p) =>
          matchSearch(p.STKCOD, search) ||
          matchSearch(p.STKDES, search) ||
          matchSearch(p.STKDES2, search) ||
          matchSearch(p.BARCOD, search)
      );
    }

    // 2. Warehouse filter
    if (warehouse !== "all") {
      filtered = filtered.filter((p) =>
        p.locations.some((l) => l.LOCCOD === warehouse && l.LOCBAL !== 0)
      );
    }

    // 3. Stock Status filter
    if (stockStatus === "inStock") {
      filtered = filtered.filter((p) => p.TOTBAL > 0);
    } else if (stockStatus === "negative") {
      filtered = filtered.filter((p) => p.TOTBAL < 0);
    } else if (stockStatus === "zero") {
      filtered = filtered.filter((p) => p.TOTBAL === 0);
    }

    // 4. Group filter
    if (group !== "all") {
      filtered = filtered.filter((p) => p.STKGRP === group);
    }

    // Sort: items with stock first, then by STKCOD
    filtered.sort((a, b) => {
      if (a.TOTBAL > 0 && b.TOTBAL <= 0) return -1;
      if (a.TOTBAL <= 0 && b.TOTBAL > 0) return 1;
      return a.STKCOD.localeCompare(b.STKCOD);
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    // Build groups list for dropdown filter
    const groupsList = Array.from(groupCountMap.entries())
      .map(([code, count]) => ({
        code,
        name: groupMap.get(code) || code,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Build warehouse summary breakdown
    const warehouseBreakdown = warehousesList.map((w) => {
      const stats = warehouseTotals.get(w.code) || { totalQty: 0, totalVal: 0, itemCount: 0 };
      return {
        code: w.code,
        name: w.name,
        totalQty: stats.totalQty,
        totalVal: stats.totalVal,
        itemCount: stats.itemCount,
      };
    });

    return NextResponse.json({
      summary: {
        totalSkus: allProducts.length,
        inStockCount,
        negativeCount,
        zeroCount,
        totalBalanceQty,
        totalBalanceValue,
        warehouseBreakdown,
      },
      warehouses: warehousesList,
      groups: groupsList,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err) {
    console.error("GET /api/inventory error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลคลังสินค้าได้", detail: String(err) },
      { status: 500 }
    );
  }
}

