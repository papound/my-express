import { NextResponse } from "next/server";
import { getAuthorizedSignatureBuffer } from "@/lib/logo";

export async function GET() {
  try {
    const buffer = getAuthorizedSignatureBuffer();

    if (!buffer) {
      return new NextResponse("Signature not found", { status: 404 });
    }

    const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50;
    const contentType = isPng ? "image/png" : "image/bmp";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Failed to read signature", { status: 500 });
  }
}

