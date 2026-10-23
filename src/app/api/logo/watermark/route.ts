import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const DATA_PATH = process.env.DBF_DATA_PATH || "./data/ThongTha";

export async function GET() {
  try {
    const dir = path.resolve(DATA_PATH);
    const files = fs.readdirSync(dir);
    const wmFile = files.find(
      (f) =>
        f.toUpperCase().includes("LOGO") &&
        f.toLowerCase().endsWith(".bmp") &&
        f.toLowerCase() !== "logo.bmp"
    );

    if (!wmFile) {
      return new NextResponse("Watermark logo not found", { status: 404 });
    }

    const buffer = fs.readFileSync(path.join(dir, wmFile));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/bmp",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new NextResponse("Failed to read watermark logo", { status: 500 });
  }
}

