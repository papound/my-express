import { NextResponse } from "next/server";
import { getWatermarkLogoBuffer } from "@/lib/logo";

export async function GET() {
  try {
    const buffer = getWatermarkLogoBuffer();

    if (!buffer) {
      return new NextResponse("Watermark logo not found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/bmp",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new NextResponse("Failed to read watermark logo", { status: 500 });
  }
}
