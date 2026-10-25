import { NextResponse } from "next/server";
import {
  getAuthorizedSignatureBuffer,
  getSignaturesConfig,
} from "@/lib/logo";

const TRANSPARENT_1PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAEASTN754=",
  "base64"
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "authorized";

    const config = getSignaturesConfig();
    const roleCfg = config[role];

    if (roleCfg) {
      if (roleCfg.type === "blank") {
        return new NextResponse(new Uint8Array(TRANSPARENT_1PX_PNG), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "no-cache",
          },
        });
      }

      if (roleCfg.type === "custom" && roleCfg.dataUrl) {
        // Parse data URL: data:image/png;base64,...
        const match = roleCfg.dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1] === "png" ? "image/png" : `image/${match[1]}`;
          const buffer = Buffer.from(match[2], "base64");
          return new NextResponse(new Uint8Array(buffer), {
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "no-cache",
            },
          });
        }
      }
    }

    // Default fallback
    if (
      role === "authorized" ||
      role === "billing" ||
      (roleCfg && roleCfg.type === "default")
    ) {
      const buffer = getAuthorizedSignatureBuffer();
      if (!buffer) {
        return new NextResponse(new Uint8Array(TRANSPARENT_1PX_PNG), {
          headers: { "Content-Type": "image/png" },
        });
      }

      const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50;
      const contentType = isPng ? "image/png" : "image/bmp";

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
        },
      });
    }

    // For other roles without custom signature and not defaulting to company signature
    return new NextResponse(new Uint8Array(TRANSPARENT_1PX_PNG), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new NextResponse(new Uint8Array(TRANSPARENT_1PX_PNG), {
      headers: { "Content-Type": "image/png" },
    });
  }
}

