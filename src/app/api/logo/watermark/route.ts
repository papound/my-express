import { NextResponse } from "next/server";
import { getWatermarkLogoBuffer } from "@/lib/logo";
import { getActiveDataPath } from "@/lib/dbf/company-context";

export async function GET() {
  try {
    const dataPath = await getActiveDataPath();
    const buffer = getWatermarkLogoBuffer(dataPath);

    if (!buffer) {
      return new NextResponse("Watermark logo not found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/bmp",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new NextResponse("Failed to read watermark logo", { status: 500 });
  }
}
