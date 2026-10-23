# ระบบเว็บแอปพลิเคชันบัญชี Express (ธงธัญ)

เว็บแอปพลิเคชันทดแทนโปรแกรม Express พัฒนาด้วย **Next.js 15 (App Router)**, **React 19**, **TailwindCSS**, **dbffile** และ **Puppeteer PDF Rendering**

---

## 🚀 คุณสมบัติเด่น (Features)

1. **อ่านฐานข้อมูล Express (DBF / Visual FoxPro) โดยตรง**
   - รองรับการแปลงภาษาไทย **CP874 / Windows-874** อย่างถูกต้อง 100% รวมถึงการตัด Non-breaking space
   - อ่านข้อมูลลูกค้า (`ARMAS.DBF`), ใบกำกับ/ขายเงินสด-เงินเชื่อ (`ARTRN.DBF`), รายการสินค้า (`STCRD.DBF`), ใบเสนอราคา (`OESO.DBF`, `OESOIT.DBF`), ใบวางบิล (`ARBIL.DBF`, `ARBILIT.DBF`)
2. **ระบบค้นหาและกรองข้อมูลย้อนหลัง**
   - ค้นหาตามชื่อลูกค้า, รหัสลูกค้า, เลขที่เอกสาร, เลขผู้เสียภาษี
   - กรองตามช่วงวันที่ (Date Range) และสถานะเอกสาร
3. **ระบบพิมพ์เอกสาร PDF (Express Report Alternative)**
   - Render PDF เอกสารทางบัญชีด้วย Puppeteer ฟอนต์ภาษาไทยคมชัดสวยงาม (Sarabun / Noto Sans Thai)
   - มีระบบแปลงตัวเลขเป็นตัวอักษรภาษาไทยอัตโนมัติ (BahtText เช่น *หนึ่งพันบาทถ้วน*)
4. **ระบบความปลอดภัยและการเข้าใช้งาน**
   - ระบบ Login ผ่าน NextAuth.js
5. **รองรับ Docker / Proxmox VE (PVE)**
   - Multi-stage build ขนาดกะทัดรัด พร้อมติดตั้ง Chromium และ Thai Fonts ภายใน container

---

## 📁 โครงสร้างโปรเจกต์

```text
my-express/
├── data/
│   ├── ThongTha/         # โฟลเดอร์ข้อมูลจำลอง DBF สำหรับ Development
│   └── backups/          # โฟลเดอร์เก็บ ZIP Shadow Backup
├── src/
│   ├── app/              # Next.js App Router (Pages & APIs)
│   │   ├── (app)/
│   │   │   ├── customers/
│   │   │   ├── invoices/
│   │   │   ├── quotations/
│   │   │   └── billing/
│   │   └── api/
│   │       ├── pdf/      # Endpoints สร้าง PDF (Invoice, Quotation, Billing)
│   │       └── ...
│   ├── lib/
│   │   ├── dbf/          # DBF Reader & Table Schemas (CP874)
│   │   └── pdf/          # Puppeteer & HTML Print Templates
│   └── components/       # UI Components & Navigation Sidebar
├── docker/
│   └── Dockerfile        # Container build พร้อม Chromium & Thai Fonts
└── docker-compose.yml    # Service config & Volume mount
```

---

## 🛠️ การรันในโหมด Development (Local)

1. คัดลอก environment file:
   ```bash
   cp .env.example .env.local
   ```
2. รันแอปพลิเคชัน:
   ```bash
   npm run dev
   ```
3. เข้าใช้งานผ่านเบราว์เซอร์:
   - URL: `http://localhost:3000`
   - บัญชีเริ่มต้น:
     - Username: `admin`
     - Password: `password123` (หรือตามที่ระบุใน `.env.local`)

---

## 🐳 การ Deploy บน Docker / Proxmox VE (PVE)

### 1. รันด้วย Docker Compose

```bash
docker compose up -d --build
```

### 2. การเชื่อมต่อกับไดรฟ์จริง (Tailscale VPN หรือแชร์ SMB)

ในไฟล์ `docker-compose.yml` ให้กำหนด volume mount ชี้ไปยัง path ของ Express บน PVE/Linux Host:

```yaml
volumes:
  # เชื่อมต่อกับโฟลเดอร์ Express จริงผ่าน VPN/Mount
  - /mnt/express/ThongTha:/data/ThongTha:ro
```
*(กำหนด `:ro` เป็น Read-only เพื่อความปลอดภัยสูงสุดต่อฐานข้อมูล Express)*

