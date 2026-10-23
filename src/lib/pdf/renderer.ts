import puppeteer, { Browser } from "puppeteer";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

  return await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });
}

/**
 * Render HTML เป็น PDF Buffer
 */
export async function renderHtmlToPdf(
  html: string,
  options?: { landscape?: boolean }
): Promise<Uint8Array> {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"],
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: options?.landscape ?? false,
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

