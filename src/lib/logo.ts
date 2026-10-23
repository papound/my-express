import fs from "fs";
import path from "path";

const LOGO_DIRS = [
  process.env.LOGO_PATH || "./data/logo",
  process.env.DBF_DATA_PATH || "./data/ThongTha",
  "./data",
];

function findLogoBuffer(isWatermark: boolean): Buffer | null {
  for (const dirPath of LOGO_DIRS) {
    const dir = path.resolve(dirPath);
    if (!fs.existsSync(dir)) continue;

    try {
      const files = fs.readdirSync(dir);
      let match: string | undefined;

      if (!isWatermark) {
        match = files.find((f) => f.toLowerCase() === "logo.bmp");
      } else {
        match = files.find(
          (f) =>
            f.toUpperCase().includes("LOGO") &&
            f.toLowerCase().endsWith(".bmp") &&
            f.toLowerCase() !== "logo.bmp"
        );
      }

      if (match) {
        return fs.readFileSync(path.join(dir, match));
      }
    } catch {
      // Continue to next directory
    }
  }
  return null;
}

/**
 * ดึง Buffer ของ LOGO.bmp
 */
export function getCompanyLogoBuffer(): Buffer | null {
  try {
    return findLogoBuffer(false);
  } catch (err) {
    console.warn("Could not read company logo buffer:", err);
    return null;
  }
}

/**
 * ดึง Buffer ของ LOGOอ่อน2.bmp
 */
export function getWatermarkLogoBuffer(): Buffer | null {
  try {
    return findLogoBuffer(true);
  } catch (err) {
    console.warn("Could not read watermark logo buffer:", err);
    return null;
  }
}

/**
 * ดึง base64 data URL ของ LOGO.bmp
 */
export function getCompanyLogoBase64(): string {
  try {
    const buffer = getCompanyLogoBuffer();
    if (!buffer) return "";
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
    const buffer = getWatermarkLogoBuffer();
    if (!buffer) return "";
    return `data:image/bmp;base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.warn("Could not load watermark logo:", err);
    return "";
  }
}
