import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const DATA_PATH = process.env.DBF_DATA_PATH || "./data/ThongTha";

export async function GET() {
  try {
    const dir = path.resolve(DATA_PATH);
    const files = fs.readdirSync(dir);
    const logoFile = files.find((f) => f.toLowerCase() === "logo.bmp");

    if (!logoFile) {
      return new NextResponse("Logo not found", { status: 404 });
    }

    const buffer = fs.readFileSync(path.join(dir, logoFile));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/bmp",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new NextResponse("Failed to read logo", { status: 500 });
  }
}

