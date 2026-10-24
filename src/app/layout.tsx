import type { Metadata } from "next";
import "./globals.css";
import { readAll, cleanStr } from "@/lib/dbf/reader";

export async function generateMetadata(): Promise<Metadata> {
  let companyName = "";
  try {
    const raw = await readAll<Record<string, unknown>>("ISINFO");
    if (raw && raw[0]?.THINAM) {
      companyName = cleanStr(raw[0].THINAM);
    }
  } catch {
    // fallback
  }

  const title = companyName ? `ระบบบัญชี - ${companyName}` : "ระบบบัญชี Express";
  const description = companyName
    ? `ระบบบัญชีออนไลน์สำหรับ ${companyName}`
    : "ระบบบัญชีออนไลน์ Express Web Platform";

  return {
    title,
    description,
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('app_theme');
                if (t === 'express') {
                  document.documentElement.setAttribute('data-theme', 'express');
                } else {
                  document.documentElement.setAttribute('data-theme', 'modern');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

