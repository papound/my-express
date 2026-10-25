import type { Metadata } from "next";
// @ts-ignore -- Next.js handles this global CSS import at build time.
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
    <html lang="th" suppressHydrationWarning>
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
                if (t === 'express' || t === 'dark') {
                  document.documentElement.setAttribute('data-theme', t);
                } else {
                  document.documentElement.setAttribute('data-theme', 'modern');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

