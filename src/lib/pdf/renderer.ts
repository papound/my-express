import puppeteer, { Browser } from "puppeteer";

let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  if (browserPromise) {
    return browserPromise;
  }

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

  browserPromise = puppeteer
    .launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--no-first-run",
        "--no-default-browser-check",
        "--font-render-hinting=none",
      ],
    })
    .then((b) => {
      browserInstance = b;
      browserPromise = null;
      b.on("disconnected", () => {
        browserInstance = null;
        browserPromise = null;
      });
      return b;
    })
    .catch((err) => {
      browserPromise = null;
      throw err;
    });

  return browserPromise;
}

/**
 * Render HTML เป็น PDF Buffer
 */
export async function renderHtmlToPdf(
  html: string,
  options?: { landscape?: boolean }
): Promise<Uint8Array> {
  const browser = await getBrowser();
  let page;
  try {
    page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    // รอให้ fonts โหลดเสร็จโดยไม่บล็อกค้างกับการเชื่อมต่อ network idle
    await page.evaluateHandle("document.fonts.ready").catch(() => {});

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: options?.landscape ?? false,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "6mm",
        right: "8mm",
        bottom: "6mm",
        left: "8mm",
      },
    });

    return pdfBuffer;
  } catch (err) {
    // หากเกิดข้อผิดพลาดในการเรนเดอร์ ให้เคลียร์ browser instance เพื่อเปิดใหม่ในรอบถัดไป
    try {
      await browserInstance?.close();
    } catch {}
    browserInstance = null;
    browserPromise = null;
    throw err;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

