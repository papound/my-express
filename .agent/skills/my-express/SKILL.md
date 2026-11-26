---
name: my-express
description: >-
  Specialized assistant and domain knowledge base for the My-Express WebApp (Express Accounting ERP Web Viewer).
  Provides complete architecture guidance on Visual FoxPro DBF reading with Thai TIS-620/CP874 encoding,
  Express ERP table schemas (ARTRN, OESO, ARBIL, ARMAS, STCRD), Puppeteer A4 PDF rendering,
  online signature canvas management, three-way theming (Modern/Express Classic/Dark),
  Tailscale CIFS network mounts, and Docker CI/CD deployment on Debian LXC.
---

# My-Express WebApp Knowledge Base & System Architecture (`my-express`)

Dedicated expert assistant and runbook for maintaining, developing, and extending **My-Express** — a modern, responsive web application and reporting engine for the **Express Accounting (โปรแกรมบัญชี Express)** ERP system running on Visual FoxPro / dBASE III/IV `.DBF` databases.

---

## 1. System Overview & Technology Stack

- **Framework**: Next.js 15 (App Router, Turbopack / Webpack standalone output), React 19, TypeScript.
- **Styling**: Tailwind CSS with custom CSS variables for multi-theme switching.
- **Database Engine**: Visual FoxPro / dBASE `.DBF` files read directly in read-only mode via Node.js (`dbffile` + CP874/TIS-620 decoding).
- **PDF Engine**: Server-side Headless Chromium via `puppeteer` with full Thai font support (`Noto Sans Thai`, `Sarabun`).
- **Signature Engine**: HTML5 Canvas with 2.5x Retina rendering, auto-bounding box trimming, and alpha-transparent PNG generation.
- **Authentication**: NextAuth.js (Auth.js) session management with credential verification.
- **Deployment**: Docker container on Debian LXC (`192.168.1.66`), private image registry (`192.168.1.117:5000`), CIFS mount over Tailscale VPN.

---

## 2. Express Database (DBF) Architecture & Schemas

Express Accounting stores financial, inventory, and customer data in `.DBF` tables with `.CDX` compound index files. The web app reads these files in real-time from `DBF_DATA_PATH` (default `./data/ThongTha` or `/data/ThongTha`).

### 2.1 Character Encoding & Thai Text Sanitization

> [!IMPORTANT]
> Express stores Thai text in **TIS-620 / CP874** code page. 
> - Always open tables using `DBFFile.open(filePath, { encoding: "cp874" })`.
> - Express pads fixed-width character fields with spaces or non-breaking spaces (`0xA0`).
> - Thai text entered on legacy keyboards may contain floating tone marks or diacritics before Roman characters (e.g. `็HS68`).

**Required Data Cleaning Utilities (`src/lib/dbf/reader.ts`)**:
```typescript
// 1. Clean non-breaking space & trim
export function cleanStr(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 2. Strip stray Thai tone marks & zero-width characters for search
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

// 3. Flexible matching (ignores hyphens and spaces, e.g. HS-68 matches HS68)
export function matchSearch(target: string | null | undefined, query: string): boolean {
  if (!target || !query) return false;
  const targetLower = target.toLowerCase();
  if (targetLower.includes(query)) return true;
  const normQuery = query.replace(/[-\s]/g, "");
  if (normQuery.length >= 2) {
    const normTarget = targetLower.replace(/[-\s]/g, "");
    if (normTarget.includes(normQuery)) return true;
  }
  return false;
}
```

### 2.2 Complete Express DBF Table Directory (แฟ้มข้อมูลทั้งหมด 57 ตาราง)

| Module | Table | Description (TH) | Key Fields & Relationships |
| :--- | :--- | :--- | :--- |
| **AP (เจ้าหนี้/ซื้อ)** | `APBAL.DBF` | แฟ้มสะสมยอดเจ้าหนี้ | `SUPCOD` |
| | `APBIL.DBF` | แฟ้มใบรับวางบิล | `BILNUM`, `SUPCOD` |
| | `APMAS.DBF` | แฟ้มข้อมูลผู้จำหน่าย | `SUPCOD` (PK), `SUPNAM` |
| | `APRCPCQ.DBF` | แฟ้มรายการใบจ่ายเงิน(เช็คจ่าย) | `CHQNUM`, `RCPNUM` |
| | `APRCPIT.DBF` | แฟ้มรายการใบจ่ายเงิน(ใบรับส/ค) | `RCPNUM`, `DOCNUM` |
| | `APTRN.DBF` | แฟ้มซื้อสด/ใบรับส.ค./ใบลดหนี้ | `DOCNUM` (PK), `RECTYP`, `SUPCOD` |
| **AR (ลูกหนี้/ขาย)** | `ARBAL.DBF` | แฟ้มสะสมยอดลูกหนี้ | `CUSCOD` |
| | `ARBIL.DBF` | แฟ้มใบวางบิล | `BILNUM` (PK), `BILDAT`, `CUSCOD` (-> `ARMAS`), `BILOUT`, `APPDAT`, `PAYCOND`, `NETAMT`, `DOCSTAT` |
| | `ARBILIT.DBF` | แฟ้มรายการบิลที่วาง | `BILNUM` (-> `ARBIL`), `DOCNUM` (-> `ARTRN`), `RCVAMT`, `VATAMT` |
| | `ARMAS.DBF` | แฟ้มข้อมูลลูกค้า | `CUSCOD` (PK), `CUSNAM`, `PRENAM`, `ADDR01..03`, `ZIPCOD`, `TELNUM`, `TAXID`, `ORGNUM` (0=HQ), `PAYTRM`, `CRLINE`, `STATUS` |
| | `ARRCPCQ.DBF` | แฟ้มรายการใบเสร็จ(เช็ครับ) | `CHQNUM`, `RCPNUM` |
| | `ARRCPIT.DBF` | แฟ้มรายการใบเสร็จ(ใบกำกับ) | `RCPNUM`, `DOCNUM` |
| | `ARSHIP.DBF` | แฟ้มสถานที่ส่งของ | `CUSCOD`, `SHIPTO` |
| | `ARTRN.DBF` | แฟ้มบิลขายสด/ใบกำกับ/ใบลดหนี้ | `DOCNUM` (PK), `RECTYP`, `DOCDAT`, `CUSCOD` (-> `ARMAS`), `SONUM` (-> `OESO`), `BILNUM` (-> `ARBIL`), `AMOUNT`, `DISCAMT`, `AFTDISC`, `ADVAMT`, `VATAMT`, `NETAMT`, `TOTAL`, `RCVAMT`, `REMAMT`, `DOCSTAT` |
| | `ARTRNRM.DBF` | แฟ้มรายการคำอธิบายเพิ่มเติม | `DOCNUM` (-> `ARTRN`), `SEQNUM`, `REMARK` |
| **BK / FA (ธนาคาร/สินทรัพย์)** | `BKMAS.DBF` | แฟ้มบัญชีเงินฝากธนาคาร | `BNKCOD` (PK), `BNKNAM` |
| | `BKTRN.DBF` | แฟ้มรายการเคลื่อนไหวธนาคาร | `CHQNUM`, `CHQDAT`, `BNKCOD`, `AMOUNT`, `CHQSTAT` |
| | `BKTRNIT.DBF` | แฟ้มรายการเคลื่อนไหวธนาคาร (ย่อย) | `CHQNUM`, `DOCNUM` |
| | `FAMAS.DBF` | แฟ้มข้อมูลสินทรัพย์ถาวร | `FACOD` (PK) |
| **GL (บัญชีแยกประเภท)** | `GLACC.DBF` | แฟ้มผังบัญชี | `ACCNUM` (PK) |
| | `GLBAL.DBF` | แฟ้มยอดบัญชี | `ACCNUM` |
| | `GLBUD.DBF` | แฟ้มงบประมาณ | `ACCNUM` |
| | `GLINV.DBF` | แฟ้มบัญชีสินค้าคงเหลือปลายงวด | — |
| | `GLJNL.DBF` | แฟ้มรายวัน | `JNLNUM` (PK) |
| | `GLJNLIT.DBF` | แฟ้มข้อมูลรายวัน | `JNLNUM`, `ACCNUM` |
| | `GLPTT.DBF` | แฟ้มเงินสดย่อย | — |
| | `GLPTTIT.DBF` | แฟ้มรายการเงินสดย่อย | — |
| | `GLREP.DBF` | แฟ้มงบการเงินบัญชี | — |
| | `GLREPIT.DBF` | แฟ้มข้อมูลบรรทัดในงบการเงิน | — |
| | `GLTPL.DBF` | แฟ้มต้นแบบรายวัน | — |
| | `GLTPLIT.DBF` | แฟ้มรายการต้นแบบรายวัน | — |
| **IS (ระบบ/ภาษี/เอกสาร)** | `ISACC.DBF` | แฟ้มชุดบัญชี | — |
| | `ISFIXCOD.DBF` | ตารางการเปลี่ยนรหัส | — |
| | `ISINFO.DBF` | แฟ้มข้อมูลบริษัท | `THINAM`, `ENGNAM`, `ADDR01..02`, `TELNUM`, `TAXID`, `ORGNUM`, `VATRAT` |
| | `ISREP.DBF` | แฟ้มรายงานที่สร้างด้วยตนเอง | — |
| | `ISRUN.DBF` | แฟ้มเลขที่เอกสาร | `PREFIX`, `DOCNUM` |
| | `ISSN.DBF` | ทะเบียนหมายเลขสินค้า | `SERLNUM`, `STKCOD` |
| | `ISSNIT.DBF` | ประวัติการบริการ | `SERLNUM` |
| | `ISTAB.DBF` | ตารางข้อมูล (รหัสอ้างอิงต่างๆ) | `TABTYP`, `TYPCOD`, `THAIDESC` |
| | `ISTAX.DBF` | แฟ้มภาษีหัก ณ ที่จ่าย | `DOCNUM`, `TAXID` |
| | `ISVAT.DBF` | แฟ้มภาษีซื้อ/ภาษีขาย | `DOCNUM`, `VATPRD` |
| **JB (งาน/โครงการ)** | `JBLIST.DBF` | แฟ้มขั้นตอนงาน | — |
| | `JBMAS.DBF` | แฟ้มรหัสงาน | `JOBCOD` (PK) |
| **OE / PO (สั่งขาย/สั่งซื้อ)** | `OESLM.DBF` | แฟ้มข้อมูลพนักงานขาย | `SLMCOD` (PK), `SLMNAM` |
| | `OESO.DBF` | แฟ้มใบสั่งขาย / ใบเสนอราคา | `SONUM` (PK), `SORECTYP`, `SODAT`, `CUSCOD` (-> `ARMAS`), `PAYTRM`, `DLVDAT`, `AMOUNT`, `DISCAMT`, `VATAMT`, `NETAMT`, `TOTAL`, `DOCSTAT` |
| | `OESOIT.DBF` | แฟ้มรายการใบสั่งขาย / เสนอราคา | `SONUM` (-> `OESO`), `SORECTYP`, `SEQNUM`, `STKCOD`, `STKDES`, `ORDQTY`, `UNITPR`, `DISCAMT`, `TRNVAL` |
| | `POPR.DBF` | แฟ้มใบสั่งซื้อ | `PONUM` (PK), `SUPCOD` |
| | `POPRIT.DBF` | แฟ้มรายการใบสั่งซื้อ | `PONUM` (-> `POPR`), `STKCOD` |
| **ST (สินค้าคงคลัง)** | `STBOM.DBF` | แฟ้มส่วนประกอบสินค้า | `STKCOD` |
| | `STCOD.DBF` | แฟ้มรหัสสินค้าของผู้ขาย/ลูกค้า | `STKCOD`, `CUSCOD` |
| | `STCRD.DBF` | สต๊อคการ์ด / รายการใบขาย | `DOCNUM` (-> `ARTRN`), `SEQNUM`, `STKCOD` (-> `STMAS`), `STKDES`, `TRNQTY`, `TQUCOD` (Unit), `UNITPR`, `DISCAMT`, `TRNVAL`, `PACKING` |
| | `STLOC.DBF` | แฟ้มคลังสินค้า | `STKCOD`, `LOCCOD`, `BALQTY` |
| | `STMAS.DBF` | แฟ้มข้อมูลสินค้า | `STKCOD` (PK), `STKDES`, `STKTYP`, `STKGRP`, `QUCOD`, `TOTBAL`, `TOTVAL`, `SELLPR1`, `STATUS` |
| | `STMIN.DBF` | แฟ้มจุดสั่งซื้อสินค้า | `STKCOD`, `LOCCOD` |
| | `STPRI.DBF` | แฟ้มราคาขายสินค้า | `STKCOD` |
| | `STTAK.DBF` | แฟ้มสินค้าเพื่อการตรวจนับ | `STKCOD`, `LOCCOD` |
| | `STTRN.DBF` | แฟ้มรายการรับ/จ่ายสินค้า | `DOCNUM` |

### 2.3 Express Document Codes (`RECTYP`, `SORECTYP` & `DOCSTAT`)

- **`RECTYP` (`ARTRN.DBF`)**: `0` เงินมัดจำรับ | `1` ขายเงินสด (`HS`) | `3` ขายเงินเชื่อ/ใบกำกับภาษี (`IV`) | `4` ใบเพิ่มหนี้ | `5` รับคืน/ใบลดหนี้ (`SR`) | `9` ใบเสร็จรับเงิน (`RE`)
- **`SORECTYP` (`OESO.DBF` / `OESOIT.DBF`)**: `0` ใบสั่งขาย (`SO`) | `5` ใบเสนอราคา (`QT`)
- **`DOCSTAT`**: `0` / `N` ปกติ (Active/Open) | `C` ยกเลิก | `P` ชำระแล้ว | `F` เสร็จสิ้น | `V` โอน GL แล้ว

### 2.4 Writing to Express DBF & Updating `.CDX` (VFPOLEDB Pattern)
- Express `.DBF` tables use `BYTE28_TABLEFLAGS = 0x00` (non-structural `.CDX`). Standard SQL `INSERT INTO` via `VFPOLEDB` writes `.DBF` only and **does not** update `.CDX`.
- To update both `.DBF` and `.CDX` live in `SHARED` mode without manual Reindex in Express Desktop, execute `EXECSCRIPT(...)` via 32-bit PowerShell (`SysWOW64`) + `VFPOLEDB.1` on the Windows host:
  ```foxpro
  SET EXCLUSIVE OFF
  USE OESO IN 0 SHARED
  SELECT OESO
  SET INDEX TO OESO
  APPEND BLANK
  REPLACE ...
  FLUSH
  USE IN OESO
  ```

---

## 3. Thai Currency & BahtText Formatting

Express reports require Thai Baht text conversion on invoices, billing notes, and receipts. The implementation in `src/lib/baht-text.ts` follows Royal Institute of Thailand rules:
- Groups digits into 6-digit chunks for recursive millions (`ล้าน`).
- Handles `เอ็ด` correctly (units digit = 1 when tens digit > 0).
- Handles `ยี่สิบ` (tens digit = 2).
- Zero fractional amount outputs `ถ้วน` (e.g. `1,250.00` -> `หนึ่งพันสองร้อยห้าสิบบาทถ้วน`).
- Fractional amounts append satang text (e.g. `1,250.50` -> `หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์`).

---

## 4. PDF Generation Architecture (Puppeteer)

PDF generation is handled server-side in `src/lib/pdf/renderer.ts` using headless Chromium:

```
[Next.js API Route] ──> [HTML Template Generator] ──> [Puppeteer Chromium] ──> [Buffer] ──> [Stream to Client]
```

### 4.1 Chromium Execution in Alpine Docker
- System package: `chromium`, `font-noto-thai`, `font-noto`.
- Environment flags:
  - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
  - `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
- Launch flags: `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`, `--font-render-hinting=none`.

### 4.2 Wait Condition & Image Guarantee
In `renderHtmlToPdf(html)`:
1. `waitUntil: "domcontentloaded"`.
2. Wait for fonts: `await page.evaluateHandle("document.fonts.ready")`.
3. Wait for all base64 signatures and logos to decode:
   ```javascript
   await page.evaluate(async () => {
     const images = Array.from(document.images);
     await Promise.all(images.map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })));
   });
   ```

### 4.3 Multi-Copy Document Badge Schemes
Documents generate distinct colored badge headers for physical distribution:
- **Tax Invoice / Delivery Order (4 Copies)**:
  - Copy 1: `ต้นฉบับ (สำหรับลูกค้า)` — Blue (`#2563eb`)
  - Copy 2: `สำเนา (สำหรับฝ่ายบัญชี/การเงิน)` — Purple (`#9333ea`)
  - Copy 3: `สำเนา (สำหรับฝ่ายคลังสินค้า/จัดส่ง)` — Orange (`#ea580c`)
  - Copy 4: `สำเนา (สำหรับพนักงานขาย)` — Yellow (`#ca8a04`)
- **Billing Note (2 Copies)**:
  - Copy 1: `ต้นฉบับ (สำหรับลูกค้า)` — Blue (`#2563eb`)
  - Copy 2: `สำเนา (สำหรับฝ่ายการเงิน)` — Purple (`#9333ea`)

### 4.4 Client-Side Print & Download (`src/lib/pdf/client.ts`)
- **Direct Download**: Triggers a fetch to the PDF API, receives blob, and creates a simulated anchor click download.
- **Direct Print**: Sandboxed `<iframe>` printing fails or renders blank in modern Chrome. The client uses `window.open(printUrl, "_blank")` accompanied by a custom backdrop modal (`showPdfBackdrop`) that provides visual loading feedback while the browser initializes its native PDF print preview.

---

## 5. Multi-Role Online Signature System

Users can sign directly on touchscreen/mouse devices, upload PNGs, or select from an organized personal signature library.

### 5.1 Architecture & Storage
- Configuration file: `data/signatures/signatures.json`.
- Default authorized signature: `data/logo/my-express-authorized-signature.bmp`.
- Supported Roles:
  1. `authorized`: ผู้รับมอบอำนาจ (Invoices, Receipts, Advances, Credit Notes)
  2. `approved`: ผู้ตรวจเช็ค / ผู้อนุมัติ (Invoices, Quotations)
  3. `collector`: ผู้รับเงิน (Cash Sales, Receipts)
  4. `billing`: ผู้วางบิล (Billing Notes)
  5. `prepared`: ผู้เตรียมเอกสาร (Receipts)
  6. `checked`: ผู้ตรวจสอบ (Quotations)
  7. `acknowledged`: ผู้รับทราบ (Quotations)

### 5.2 Canvas Scaling & Transparent PNG Bounding Box
- Canvas is rendered at **2.5x Retina resolution** ($380 \times 310$ on screen, aspect ratio $152/124$).
- Function `getTrimmedCanvas(canvas)`:
  - Inspects `ctx.getImageData()` for pixels where `alpha > 10`.
  - Calculates `minX, maxX, minY, maxY`.
  - Clips out all surrounding blank canvas with an 8px safe padding.
  - Returns a compact, transparent PNG data URL to ensure signatures sit cleanly on dotted signature lines without white box occlusion.
- Signature Library (`__library`): Stores timestamped custom signatures for reuse across documents, preventing accidental loss when a role is switched back to the default Express signature.

---

## 6. Theming System & Dark Mode Design Rules

The app provides three user-selectable themes managed via `ThemeContext.tsx` and `data-theme` on `<html>`:

1. **`modern`**: Clean Tailwind indigo, slate, and pure white backgrounds.
2. **`express`**: Authentic Express ERP aesthetic:
   - Primary Walnut: `#241a12` (Sidebar & text headers)
   - Warm Peach: `#fee2bc` / `#fff7ed` (Accents, active items, badges)
   - Tan Accent: `#e7ceb5` (Borders and table headers)
   - Font: `Sarabun`, sans-serif.
3. **`dark`**: Deep midnight slate `#090d16`, container background `#0f172a`, card borders `#1e293b`.

### 6.1 Critical Rule: Paper Sheet Isolation (`.document-sheet`)
> [!CAUTION]
> Invoices, billing sheets, and quotation previews (`.document-sheet`) represent physical paper.
> **THEY MUST ALWAYS REMAIN CRISP WHITE BACKGROUND WITH DARK TEXT IN ALL THEMES.**
> 
> Never let dark mode styles invert or darken the inside of `.document-sheet`.
> In `globals.css`:
> - Always use `:not(.document-sheet):not(.document-sheet *)` when overriding global text colors for dark mode.
> - Force `color-scheme: light !important;` on `.document-sheet`.
> - Force `background: #ffffff !important; color: #0f172a !important;` on paper elements.

### 6.2 Next.js SSR Hydration Safety
To avoid React hydration mismatches when reading the active theme from `localStorage`:
- Apply `suppressHydrationWarning` on `<html>` and `<body>` in `src/app/layout.tsx`.
- Use an inline pre-hydration script in `<head>` that applies `document.documentElement.setAttribute('data-theme', savedTheme)` before React hydrates.

---

## 7. Infrastructure, Networking & Production CI/CD

### 7.1 Server Environment
- **Host**: Debian 12 LXC on Proxmox VE (`192.168.1.66`).
- **Private Docker Registry**: `192.168.1.117:5000`.
  - Docker daemon configuration (`/etc/docker/daemon.json`):
    ```json
    { "insecure-registries": ["192.168.1.117:5000"] }
    ```
- **Network Mounting**:
  - Live Express DBF folder is shared from Windows Server over SMB/CIFS.
  - Tailscale VPN allows the LXC container to reach the Express host.
  - Mount location: `/mnt/express/ThongTha` -> mapped to container `/data/ThongTha:ro`.

### 7.2 Docker Compose (`docker-compose.yml`)
```yaml
services:
  app:
    image: 192.168.1.117:5000/my-express/app:latest
    container_name: my-express-app
    restart: unless-stopped
    shm_size: "512m" # Required for Puppeteer Chromium rendering
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DBF_DATA_PATH=/data/ThongTha
      - AUTH_TRUST_HOST=true
      - PORT=3000
    volumes:
      - ${HOST_DBF_PATH:-/mnt/express/ThongTha}:/data/ThongTha:ro
      - ./data/signatures:/app/data/signatures
```

### 7.3 GitHub Actions Workflow (`.github/workflows/deploy.yml`)
- Triggered on push to `main`.
- Self-hosted runner builds multi-stage image (`docker/Dockerfile`), tags `:sha` and `:latest`, and pushes to `192.168.1.117:5000`.
- Deploys via SSH to `root@192.168.1.66`:
  1. `cd /opt/my-express && git pull origin main`
  2. `docker compose pull app`
  3. `docker compose up -d --no-build app`
  4. `docker image prune -f`

---

## 8. Common Troubleshooting & Runbook

1. **Thai characters display as alien symbols (`ภาษาต่างดาว` / `` / `à¹€`):**
   - Ensure the DBF file is read using `encoding: "cp874"` in `DBFFile.open()`.
   - Ensure `cleanStr()` normalizes `\u00a0`.
2. **Search returns 0 records for known document numbers:**
   - Use `cleanSearchQuery()` to remove stray Thai tone marks that may have preceded the text during typing.
   - Use `matchSearch()` to match across spaces and hyphens.
3. **Puppeteer fails with "Target closed" or "Failed to launch Chrome":**
   - Verify `--no-sandbox` and `--disable-dev-shm-usage` are passed in `puppeteer.launch()`.
   - Verify `shm_size: "512m"` is specified in `docker-compose.yml`.
   - In Alpine containers, ensure `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`.
4. **Modal content clipped at top of screen:**
   - Avoid `flex items-center` with `overflow-y-auto` on the modal outer wrapper. Use `items-start justify-center` with `my-auto` inside the modal body, and mount to `document.body` via `createPortal()`.
5. **Theme flash or React Hydration Error on reload:**
   - Confirm `suppressHydrationWarning` is present on both `<html>` and `<body>` in `src/app/layout.tsx`.

