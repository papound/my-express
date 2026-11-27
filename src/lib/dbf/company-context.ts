import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { DBFFile } from "dbffile";

export const COMPANY_COOKIE_NAME = "express_company";
export const DATA_MODE_COOKIE_NAME = "express_data_mode";

export type DataMode = "realtime" | "snapshot";

export interface SnapshotStatus {
  available: boolean;
  updatedAt: string | null;
}

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
 * Root directory containing Express company folders for Realtime mode.
 * Uses DBF_ROOT_PATH if set, otherwise parent of DBF_DATA_PATH (e.g. ./data or /data/express).
 */
export function getDbfRootPath(mode: DataMode = "realtime"): string {
  if (mode === "snapshot") {
    return getSnapshotRootPath() || getRealtimeRootPath();
  }
  return getRealtimeRootPath();
}

function getRealtimeRootPath(): string {
  if (process.env.DBF_ROOT_PATH) {
    return path.resolve(process.env.DBF_ROOT_PATH);
  }
  const defaultDataPath = process.env.DBF_DATA_PATH || "./data/ThongTha";
  return path.dirname(path.resolve(defaultDataPath));
}

export function getSnapshotRootPath(): string | null {
  const raw = process.env.DBF_SNAPSHOT_ROOT_PATH?.trim();
  if (!raw) return null;
  return path.resolve(raw);
}

/**
 * Inspect whether snapshot root exists and return its latest modification timestamp.
 */
export function getSnapshotStatus(): SnapshotStatus {
  const snapRoot = getSnapshotRootPath();
  if (!snapRoot || !fs.existsSync(snapRoot)) {
    return { available: false, updatedAt: null };
  }

  try {
    const defaultId = getDefaultCompanyId();
    const defaultIsInfo = findIsInfoPath(path.join(snapRoot, defaultId));
    const statTarget = defaultIsInfo || snapRoot;
    const stat = fs.statSync(statTarget);
    return {
      available: true,
      updatedAt: stat.mtime.toISOString(),
    };
  } catch {
    return { available: false, updatedAt: null };
  }
}

/**
 * Resolve current data mode ("realtime" | "snapshot") from cookie.
 * Falls back to "realtime" if snapshot root is unavailable.
 */
export async function getDataMode(): Promise<DataMode> {
  try {
    const cookieStore = await cookies();
    const selected = cookieStore.get(DATA_MODE_COOKIE_NAME)?.value?.trim();
    if (selected === "snapshot" && getSnapshotStatus().available) {
      return "snapshot";
    }
  } catch {
    // cookies() may be unavailable outside request context
  }
  return "realtime";
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
 * Scan the active mode's DBF root for all subdirectories containing ISINFO.DBF.
 */
export async function listAvailableCompanies(mode?: DataMode): Promise<CompanyOption[]> {
  const activeMode = mode ?? (await getDataMode());
  const rootPath = getDbfRootPath(activeMode);
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
 * Resolve the currently selected company ID from cookie, validated against active mode's root.
 */
export async function getActiveCompanyId(mode?: DataMode): Promise<string> {
  const activeMode = mode ?? (await getDataMode());
  const defaultId = getDefaultCompanyId();
  const rootPath = getDbfRootPath(activeMode);

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
  const activeMode = await getDataMode();
  const activeId = await getActiveCompanyId(activeMode);
  const rootPath = getDbfRootPath(activeMode);
  const resolved = path.join(rootPath, activeId);
  if (fs.existsSync(resolved)) {
    return resolved;
  }
  return path.resolve(process.env.DBF_DATA_PATH || "./data/ThongTha");
}
