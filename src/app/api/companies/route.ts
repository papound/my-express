import { NextResponse } from "next/server";
import {
  COMPANY_COOKIE_NAME,
  getActiveCompanyId,
  listAvailableCompanies,
} from "@/lib/dbf/company-context";

export async function GET() {
  try {
    const [companies, activeCompanyId] = await Promise.all([
      listAvailableCompanies(),
      getActiveCompanyId(),
    ]);

    return NextResponse.json({
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
      { activeCompanyId: "", companies: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = typeof body?.companyId === "string" ? body.companyId.trim() : "";

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const companies = await listAvailableCompanies();
    const target = companies.find((c) => c.id === companyId);

    if (!target) {
      return NextResponse.json(
        { error: `Company "${companyId}" not found` },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      activeCompanyId: target.id,
      company: {
        id: target.id,
        name: target.name,
        engName: target.engName,
        taxId: target.taxId,
      },
    });

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
