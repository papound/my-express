/**
 * DBF Reader — อ่านไฟล์ DBF format (Visual FoxPro) ด้วย TIS-620 encoding
 * ใช้ library: dbffile
 */
import path from "path";
import { DBFFile } from "dbffile";

const DATA_PATH = process.env.DBF_DATA_PATH || "./data/ThongTha";

function getDbfPath(tableName: string): string {
  return path.resolve(DATA_PATH, `${tableName.toUpperCase()}.DBF`);
}

/**
 * เปิดไฟล์ DBF และคืน DBFFile instance
 */
export async function openTable(tableName: string): Promise<DBFFile> {
  const filePath = getDbfPath(tableName);
  return await DBFFile.open(filePath, { encoding: "cp874" });
}

/**
 * อ่านทุก record จากตาราง (กรอง deleted records ออก)
 */
export async function readAll<T extends Record<string, unknown>>(
  tableName: string
): Promise<T[]> {
  const dbf = await openTable(tableName);
  const records = await dbf.readRecords(dbf.recordCount);
  return records.filter((r) => !r["@deleted"]) as T[];
}

/**
 * อ่านและ filter records
 */
export async function queryRecords<T extends Record<string, unknown>>(
  tableName: string,
  predicate: (record: T) => boolean
): Promise<T[]> {
  const all = await readAll<T>(tableName);
  return all.filter(predicate);
}

/**
 * อ่าน record แรกที่ตรงกับเงื่อนไข
 */
export async function findOne<T extends Record<string, unknown>>(
  tableName: string,
  predicate: (record: T) => boolean
): Promise<T | undefined> {
  const all = await readAll<T>(tableName);
  return all.find(predicate);
}

/**
 * อ่าน record จากหลายตารางพร้อมกัน (parallel)
 */
export async function readMultiple<
  T extends Record<string, Record<string, unknown>>
>(tables: { [K in keyof T]: string }): Promise<T> {
  const entries = Object.entries(tables) as [string, string][];
  const results = await Promise.all(
    entries.map(async ([key, tableName]) => [key, await readAll(tableName)])
  );
  return Object.fromEntries(results) as T;
}

/**
 * แปลง string จาก DBF ให้ trim whitespace และ normalize non-breaking space (0xA0 ใน CP874)
 */
export function cleanStr(value: unknown): string {
  if (typeof value === "string") {
    return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * แปลง DBF date field (Date object หรือ null)
 */
export function cleanDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  return null;
}

/**
 * แปลง number field
 */
export function cleanNum(value: unknown): number {
  if (typeof value === "number") return value;
  const n = parseFloat(String(value ?? 0));
  return isNaN(n) ? 0 : n;
}

/**
 * Format วันที่ไทย: DD/MM/YYYY (ค.ศ.)
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format วันที่ไทย: DD/MM/YYYY (พ.ศ.)
 */
export function formatDateThai(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    calendar: "buddhist",
  } as Intl.DateTimeFormatOptions);
}

/**
 * Format ตัวเลขเป็น Thai accounting format
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * แปลง RECTYP เป็นชื่อประเภทเอกสาร
 */
export function getDocTypeName(rectyp: string): string {
  const types: Record<string, string> = {
    "0": "เงินมัดจำรับ",
    "1": "ขายเงินสด",
    "3": "ขายเงินเชื่อ",
    "4": "ใบเพิ่มหนี้",
    "5": "รับคืนสินค้า/ใบลดหนี้",
    "9": "รับชำระหนี้",
  };
  return types[rectyp] ?? `ประเภท ${rectyp}`;
}

/**
 * แปลง DOCSTAT เป็นชื่อสถานะ
 */
export function getDocStatusName(status: string): {
  label: string;
  color: string;
} {
  const statuses: Record<string, { label: string; color: string }> = {
    "0": { label: "ปกติ", color: "green" },
    C: { label: "ยกเลิก", color: "red" },
    P: { label: "ชำระแล้ว", color: "blue" },
    F: { label: "เสร็จสิ้น", color: "blue" },
    V: { label: "โอน GL แล้ว", color: "gray" },
  };
  return statuses[status] ?? { label: status, color: "gray" };
}

/**
 * ทำความสะอาด search query สำหรับภาษาไทยและภาษาอังกฤษ
 * - ลบ zero-width characters (BOM, zero-width space)
 * - ลบ Thai combining diacritics / tone marks ที่พิมพ์ลอยๆ หน้าคำ หรือติดกับตัวอักษรภาษาอังกฤษ
 *   (เช่น เผลอกด Shift+H ในโหมดภาษาไทย กลายเป็น ็ (ไม้ไต่คู้) นำหน้า HS68)
 * - คืนค่า query ที่ trim และ lowercase
 */
export function cleanSearchQuery(query: string | null | undefined): string {
  if (!query) return "";
  return query
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]+/g, "")
    .replace(/(?<=[A-Za-z0-9])[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]+/g, "")
    .replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]+(?=[A-Za-z0-9])/g, "")
    .trim()
    .toLowerCase();
}

/**
 * ตรวจสอบว่า target string ตรงกับ search query หรือไม่
 * รองรับการค้นหาแบบยืดหยุ่น เช่น ตัดเว้นวรรค/ขีดกลาง (HS-6807002, HS 6807002 ตรงกับ HS6807002)
 */
export function matchSearch(
  target: string | null | undefined,
  query: string
): boolean {
  if (!target || !query) return false;
  const targetLower = target.toLowerCase();
  if (targetLower.includes(query)) return true;

  // เปรียบเทียบแบบตัดเว้นวรรคและขีดกลาง (เช่น HS-68 -> HS68)
  const normQuery = query.replace(/[-\s]/g, "");
  if (normQuery.length >= 2) {
    const normTarget = targetLower.replace(/[-\s]/g, "");
    if (normTarget.includes(normQuery)) return true;
  }
  return false;
}


