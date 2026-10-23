import fs from "fs";
import path from "path";

const DATA_PATH = process.env.DBF_DATA_PATH || "./data/ThongTha";

/**
 * ดึง base64 data URL ของ LOGO.bmp
 */
export function getCompanyLogoBase64(): string {
  try {
    const dir = path.resolve(DATA_PATH);
    const files = fs.readdirSync(dir);
    const logoFile = files.find((f) => f.toLowerCase() === "logo.bmp");
    if (!logoFile) return "";

    const buffer = fs.readFileSync(path.join(dir, logoFile));
    return `data:image/bmp;base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.warn("Could not load LOGO.bmp:", err);
    return "";
  }
}

/**
 * ดึง base64 data URL ของ LOGOอ่อน2.bmp สำหรับลายน้ำ
 */
export function getWatermarkLogoBase64(): string {
  try {
    const dir = path.resolve(DATA_PATH);
    const files = fs.readdirSync(dir);
    // Find file containing 'LOGO' and '2.bmp' or 'อ่อน'
    const wmFile = files.find(
      (f) =>
        f.toUpperCase().includes("LOGO") &&
        f.toLowerCase().endsWith(".bmp") &&
        f.toLowerCase() !== "logo.bmp"
    );
    if (!wmFile) return "";

    const buffer = fs.readFileSync(path.join(dir, wmFile));
    return `data:image/bmp;base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.warn("Could not load watermark logo:", err);
    return "";
  }
}

