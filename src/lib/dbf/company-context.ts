import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { DBFFile } from "dbffile";

export const COMPANY_COOKIE_NAME = "express_company";

export interface CompanyOption {
  id: string;
  name: string;
  engName: string;
  taxId: string;
  path: string;
}

const EXCLUDED_DIRS = new Set([
  "backups",
  "logo",
  "signatures",
  "node_modules",
]);

function cleanDbfStr(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Root directory containing Express company folders.
 * Uses DBF_ROOT_PATH if set, otherwise parent of DBF_DATA_PATH (e.g. ./data or /data/express).
 */
export function getDbfRootPath(): string {
  if (process.env.DBF_ROOT_PATH) {
    return path.resolve(process.env.DBF_ROOT_PATH);
  }
  const defaultDataPath = process.env.DBF_DATA_PATH || "./data/ThongTha";
  return path.dirname(path.resolve(defaultDataPath));
}

export function getDefaultCompanyId(): string {
  const defaultDataPath = process.env.DBF_DATA_PATH || "./data/ThongTha";
  return path.basename(path.resolve(defaultDataPath));
}

function findIsInfoPath(dirPath: string): string | null {
  try {
    const entries = fs.readdirSync(dirPath);
    const match = entries.find((f) => f.toUpperCase() === "ISINFO.DBF");
    return match ? path.join(dirPath, match) : null;
  } catch {
    return null;
  }
}

function isSafeFolderName(name: string): boolean {
  return (
    Boolean(name) &&
    !name.includes("..") &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !name.startsWith(".")
  );
}

/**
 * Scan DBF_ROOT_PATH for all subdirectories containing ISINFO.DBF.
 */
export async function listAvailableCompanies(): Promise<CompanyOption[]> {
  const rootPath = getDbfRootPath();
  const defaultId = getDefaultCompanyId();
  const companies: CompanyOption[] = [];

  try {
    if (!fs.existsSync(rootPath)) {
      return [];
    }

    const entries = fs.readdirSync(rootPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".") || EXCLUDED_DIRS.has(entry.name.toLowerCase())) {
        continue;
      }

      const fullDir = path.join(rootPath, entry.name);
      const isInfoPath = findIsInfoPath(fullDir);
      if (!isInfoPath) continue;

      let name = entry.name;
      let engName = "";
      let taxId = "";

      try {
        const dbf = await DBFFile.open(isInfoPath, { encoding: "cp874" });
        const records = await dbf.readRecords(1);
        const info = records[0] as Record<string, unknown> | undefined;
        if (info) {
          name = cleanDbfStr(info.THINAM) || entry.name;
          engName = cleanDbfStr(info.ENGNAM);
          taxId = cleanDbfStr(info.TAXID);
        }
      } catch {
        // Fallback to folder name if ISINFO.DBF cannot be read
      }

      companies.push({
        id: entry.name,
        name,
        engName,
        taxId,
        path: fullDir,
      });
    }
  } catch (err) {
    console.warn("Could not list available companies:", err);
  }

  companies.sort((a, b) => {
    if (a.id === defaultId) return -1;
    if (b.id === defaultId) return 1;
    return a.id.localeCompare(b.id);
  });

  return companies;
}

/**
 * Resolve the currently selected company ID from cookie, validated against DBF_ROOT_PATH.
 */
export async function getActiveCompanyId(): Promise<string> {
  const defaultId = getDefaultCompanyId();
  const rootPath = getDbfRootPath();

  try {
    const cookieStore = await cookies();
    const selected = cookieStore.get(COMPANY_COOKIE_NAME)?.value?.trim() || "";
    if (isSafeFolderName(selected)) {
      const candidateDir = path.join(rootPath, selected);
      if (fs.existsSync(candidateDir) && findIsInfoPath(candidateDir)) {
        return selected;
      }
    }
  } catch {
    // cookies() may be unavailable outside request context (e.g. build time)
  }

  return defaultId;
}

/**
 * Resolve the absolute filesystem path for the active company's DBF directory.
 */
export async function getActiveDataPath(): Promise<string> {
  const activeId = await getActiveCompanyId();
  const rootPath = getDbfRootPath();
  const resolved = path.join(rootPath, activeId);
  if (fs.existsSync(resolved)) {
    return resolved;
  }
  return path.resolve(process.env.DBF_DATA_PATH || "./data/ThongTha");
}
