import { readAll, cleanStr } from "@/lib/dbf/reader";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rawInfo = await readAll<Record<string, unknown>>("ISINFO");
    const info = rawInfo[0];

    const company = {
      name: cleanStr(info?.THINAM) || "",
      engName: cleanStr(info?.ENGNAM) || "",
      taxId: cleanStr(info?.TAXID) || "",
      address: [cleanStr(info?.ADDR01), cleanStr(info?.ADDR02)]
        .filter(Boolean)
        .join(" "),
      tel: cleanStr(info?.TELNUM) || "",
      workingDate: new Date().toISOString(),
    };

    return NextResponse.json(company);
  } catch (err) {
    console.error("Company API error:", err);
    return NextResponse.json(
      {
        name: "",
        engName: "",
        taxId: "",
        address: "",
        tel: "",
        workingDate: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}

