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
      const match = files.find((f) => {
        const full = path.join(dir, f);
        try {
          if (fs.statSync(full).isDirectory()) return false;
        } catch {
          return false;
        }
        const lower = f.toLowerCase();
        return (
          lower === "my-express-authorized-signature.bmp" ||
          lower.includes("authorized-signature") ||
          (lower.includes("signature") &&
            (lower.endsWith(".bmp") || lower.endsWith(".png") || lower.endsWith(".jpg")))
        );
      });

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
 * ดึง base64 data URL ของ ลายเซ็นผู้รับมอบอำนาจต้นฉบับ
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

export type SignatureType = "default" | "custom" | "blank";

export interface SignatureRoleConfig {
  type: SignatureType;
  dataUrl?: string | null;
  updatedAt?: string;
}

export type SignaturesMap = Record<string, SignatureRoleConfig>;

const SIGNATURES_FILE = path.resolve("./data/signatures/signatures.json");

/**
 * ดึงการตั้งค่าลายเซ็นทั้งหมด
 */
export function getSignaturesConfig(): SignaturesMap {
  try {
    if (fs.existsSync(SIGNATURES_FILE)) {
      const raw = fs.readFileSync(SIGNATURES_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read signatures.json:", err);
  }
  return {};
}

/**
 * บันทึกการตั้งค่าลายเซ็นทั้งหมด
 */
export function saveSignaturesConfig(cfg: SignaturesMap): void {
  try {
    const dir = path.dirname(SIGNATURES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SIGNATURES_FILE, JSON.stringify(cfg, null, 2), "utf-8");
  } catch (err) {
    console.error("Could not write signatures.json:", err);
  }
}

/**
 * ดึง base64 data URL สำหรับบทบาทที่ระบุ
 */
export function getSignatureBase64(role: string = "authorized"): string {
  try {
    const config = getSignaturesConfig();
    const roleCfg = config[role];

    if (roleCfg) {
      if (roleCfg.type === "blank") {
        return "";
      }
      if (roleCfg.type === "custom" && roleCfg.dataUrl) {
        return roleCfg.dataUrl;
      }
      if (roleCfg.type === "default") {
        return getAuthorizedSignatureBase64();
      }
    }

    // Default fallbacks for roles that originally had default signature
    if (role === "authorized" || role === "billing") {
      return getAuthorizedSignatureBase64();
    }

    return "";
  } catch (err) {
    console.warn(`Could not load signature for role ${role}:`, err);
    return "";
  }
}

