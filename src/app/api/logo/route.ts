import { NextResponse } from "next/server";
import { getCompanyLogoBuffer } from "@/lib/logo";

export async function GET() {
  try {
    const buffer = getCompanyLogoBuffer();

    if (!buffer) {
      return new NextResponse("Logo not found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/bmp",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new NextResponse("Failed to read logo", { status: 500 });
  }
}
