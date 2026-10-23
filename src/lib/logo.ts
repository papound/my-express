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

function findSignatureBuffer(): Buffer | null {
  for (const dirPath of LOGO_DIRS) {
    const dir = path.resolve(dirPath);
    if (!fs.existsSync(dir)) continue;

    try {
      const files = fs.readdirSync(dir);
      const match = files.find(
        (f) =>
          f.toLowerCase() === "my-express-authorized-signature.bmp" ||
          f.toLowerCase().includes("authorized-signature") ||
          f.toLowerCase().includes("signature")
      );

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
 * ดึง Buffer ของ ลายเซ็นผู้รับมอบอำนาจ (my-express-authorized-signature.bmp)
 */
export function getAuthorizedSignatureBuffer(): Buffer | null {
  try {
    return findSignatureBuffer();
  } catch (err) {
    console.warn("Could not read authorized signature buffer:", err);
    return null;
  }
}

/**
 * ดึง base64 data URL ของ ลายเซ็นผู้รับมอบอำนาจ
 */
export function getAuthorizedSignatureBase64(): string {
  try {
    const buffer = getAuthorizedSignatureBuffer();
    if (!buffer) return "";
    const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50;
    const mime = isPng ? "image/png" : "image/bmp";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.warn("Could not load authorized signature:", err);
    return "";
  }
}
