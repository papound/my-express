import { NextResponse } from "next/server";
import {
  COMPANY_COOKIE_NAME,
  DATA_MODE_COOKIE_NAME,
  getActiveCompanyId,
  getDataMode,
  getSnapshotStatus,
  listAvailableCompanies,
  type DataMode,
} from "@/lib/dbf/company-context";

export async function GET() {
  try {
    const activeMode = await getDataMode();
    const snapshot = getSnapshotStatus();
    const [companies, activeCompanyId] = await Promise.all([
      listAvailableCompanies(activeMode),
      getActiveCompanyId(activeMode),
    ]);

    return NextResponse.json({
      activeMode,
      snapshotAvailable: snapshot.available,
      snapshotUpdatedAt: snapshot.updatedAt,
      activeCompanyId,
      companies: companies.map(({ id, name, engName, taxId }) => ({
        id,
        name,
        engName,
        taxId,
      })),
    });
  } catch (err) {
    console.error("Companies API error:", err);
    return NextResponse.json(
      {
        activeMode: "realtime",
        snapshotAvailable: false,
        snapshotUpdatedAt: null,
        activeCompanyId: "",
        companies: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestedMode =
      body?.mode === "snapshot" || body?.mode === "realtime"
        ? (body.mode as DataMode)
        : undefined;
    const requestedCompanyId =
      typeof body?.companyId === "string" ? body.companyId.trim() : "";

    if (!requestedMode && !requestedCompanyId) {
      return NextResponse.json(
        { error: "mode or companyId is required" },
        { status: 400 }
      );
    }

    if (requestedMode === "snapshot" && !getSnapshotStatus().available) {
      return NextResponse.json(
        { error: "Snapshot source (/mnt/backup/my-express/current) is not available" },
        { status: 400 }
      );
    }

    const targetMode: DataMode = requestedMode ?? (await getDataMode());
    const companies = await listAvailableCompanies(targetMode);
    if (companies.length === 0) {
      return NextResponse.json(
        { error: `No companies found in ${targetMode} mode` },
        { status: 404 }
      );
    }

    const desiredCompanyId = requestedCompanyId || (await getActiveCompanyId(targetMode));
    let target = companies.find((c) => c.id === desiredCompanyId);

    // When switching modes without explicitly specifying a company, fall back gracefully if not present
    if (!target && !requestedCompanyId) {
      target = companies[0];
    }

    if (!target) {
      return NextResponse.json(
        { error: `Company "${desiredCompanyId}" not found in ${targetMode} mode` },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      activeMode: targetMode,
      activeCompanyId: target.id,
      company: {
        id: target.id,
        name: target.name,
        engName: target.engName,
        taxId: target.taxId,
      },
    });

    if (requestedMode) {
      response.cookies.set(DATA_MODE_COOKIE_NAME, targetMode, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    response.cookies.set(COMPANY_COOKIE_NAME, target.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err) {
    console.error("Switch company error:", err);
    return NextResponse.json(
      { error: "Failed to switch company" },
      { status: 500 }
    );
  }
}
