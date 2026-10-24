import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบบัญชี - ธงธัญ",
  description: "ระบบบัญชีออนไลน์สำหรับบริษัทธงธัญ",
};

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

