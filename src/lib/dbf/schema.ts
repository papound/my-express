// DBF Database schema types — mapped from Express DBF table structures
// Encoding: TIS-620 (CP874) — Thai

// ─── ARMAS.DBF — ข้อมูลลูกค้า ────────────────────────────────────────────────
export interface ArMas {
  CUSCOD: string;   // รหัสลูกค้า
  CUSTYP: string;   // ประเภทลูกค้า
  PRENAM: string;   // คำนำหน้า
  CUSNAM: string;   // ชื่อลูกค้า
  ADDR01: string;   // ที่อยู่ 1
  ADDR02: string;   // ที่อยู่ 2
  ADDR03: string;   // ที่อยู่ 3
  ZIPCOD: string;   // รหัสไปรษณีย์
  TELNUM: string;   // เบอร์โทร
  CONTACT: string;  // ผู้ติดต่อ
  CUSNAM2: string;  // ชื่อสาขา
  TAXID: string;    // เลขประจำตัวผู้เสียภาษี
  ORGNUM: number;   // เลขสาขา
  TAXTYP: string;
  TAXRAT: number;
  SLMCOD: string;   // รหัสพนักงานขาย
  AREACOD: string;  // รหัสพื้นที่
  PAYTRM: number;   // เครดิตเทอม (วัน)
  PAYCOND: string;  // เงื่อนไขการชำระ
  BALANCE: number;  // ยอดค้างชำระ
  CRLINE: number;   // วงเงินเครดิต
  LASIVC: Date | null; // วันที่ออกใบแจ้งหนี้ล่าสุด
  ACCNUM: string;   // เลขที่บัญชี
  REMARK: string;
  DLVBY: string;    // จัดส่งโดย
  STATUS: string;   // A=active, I=inactive
  INACTDAT: Date | null;
  CREDAT: Date | null;
  CHGDAT: Date | null;
}

// ─── ARTRN.DBF — Header ใบขาย (เงินสด + เครดิต) ─────────────────────────────
export interface ArTrn {
  RECTYP: string;   // '1'=ใบกำกับภาษี/เงินสด, '2'=ใบกำกับภาษี/เครดิต
  DOCNUM: string;   // เลขที่เอกสาร
  DOCDAT: Date | null; // วันที่เอกสาร
  POSTGL: string;   // โอนไป GL แล้วหรือยัง
  SONUM: string;    // อ้างอิงใบเสนอราคา
  CNTYP: string;
  DEPCOD: string;   // รหัสแผนก
  FLGVAT: string;   // ประเภทภาษี '0'=ไม่มี, '1'=รวมใน, '2'=แยก
  SLMCOD: string;   // รหัสพนักงานขาย
  CUSCOD: string;   // รหัสลูกค้า
  SHIPTO: string;   // รหัสที่จัดส่ง
  YOUREF: string;   // เลขที่อ้างอิงลูกค้า
  AREACOD: string;
  PAYTRM: number;   // เครดิตเทอม
  DUEDAT: Date | null; // วันครบกำหนดชำระ
  BILNUM: string;   // เลขที่ใบวางบิล
  AMOUNT: number;   // ยอดก่อนส่วนลด
  DISCAMT: number;  // ส่วนลด
  AFTDISC: number;  // ยอดหลังส่วนลด
  VATAMT: number;   // ภาษีมูลค่าเพิ่ม
  NETAMT: number;   // ยอดสุทธิ
  TOTAL: number;    // รวมทั้งสิ้น
  RCVAMT: number;   // รับชำระแล้ว
  REMAMT: number;   // คงเหลือ
  VATRAT: number;   // อัตราภาษี
  DOCSTAT: string;  // '0'=ปกติ, 'C'=ยกเลิก, 'P'=ชำระแล้ว
  VATDAT: Date | null;
  VATPRD: Date | null;
  USERID: string;
  CHGDAT: Date | null;
  PRNDAT: Date | null;
  PRNCNT: number;
  BILLTO: string;   // รหัสผู้รับบิล
  ORGNUM: number;
}

// ─── STCRD.DBF — รายการสินค้าในใบขาย ────────────────────────────────────────
export interface StCrd {
  STKCOD: string;   // รหัสสินค้า
  LOCCOD: string;   // รหัสที่เก็บ
  DOCNUM: string;   // เลขที่เอกสาร
  SEQNUM: string;   // ลำดับรายการ
  DOCDAT: Date | null;
  RDOCNUM: string;  // อ้างอิงเอกสาร (SO number)
  DEPCOD: string;
  POSOPR: string;   // '+' เพิ่ม, '-' ลด
  FREE: string;      // สินค้าแถม
  VATCOD: string;   // รหัสภาษี
  SLMCOD: string;
  TRNQTY: number;   // จำนวน
  TQUCOD: string;   // หน่วยนับ
  TFACTOR: number;  // ตัวคูณ
  UNITPR: number;   // ราคาต่อหน่วย
  DISC: string;     // ส่วนลด
  DISCAMT: number;  // มูลค่าส่วนลด
  TRNVAL: number;   // มูลค่า
  STKDES: string;   // ชื่อสินค้า
  PACKING: string;  // บรรจุภัณฑ์
}

// ─── ARTRNRM.DBF — หมายเหตุในใบขาย ──────────────────────────────────────────
export interface ArTrnRm {
  DOCNUM: string;
  SEQNUM: string;
  REMARK: string;
}

// ─── OESO.DBF — ใบเสนอราคา Header ───────────────────────────────────────────
export interface OeSo {
  SORECTYP: string; // ประเภทใบเสนอราคา
  SONUM: string;    // เลขที่ใบเสนอราคา
  SODAT: Date | null; // วันที่
  FLGVAT: string;
  DEPCOD: string;
  SLMCOD: string;
  CUSCOD: string;
  SHIPTO: string;
  YOUREF: string;
  AREACOD: string;
  PAYTRM: number;
  DLVDAT: Date | null; // วันส่งของ
  AMOUNT: number;
  DISCAMT: number;
  VATAMT: number;
  NETAMT: number;
  TOTAL: number;
  VATRAT: number;
  CMPLDAT: Date | null;
  DOCSTAT: string;  // '0'=เปิด, 'C'=ยกเลิก, 'F'=เสร็จสิ้น
  DLVBY: string;
  USERID: string;
  CHGDAT: Date | null;
  PRNDAT: Date | null;
  PRNCNT: number;
  BILLTO: string;
  ORGNUM: number;
}

// ─── OESOIT.DBF — รายการสินค้าใบเสนอราคา ────────────────────────────────────
export interface OeSoIt {
  SORECTYP: string;
  SONUM: string;
  SEQNUM: string;
  SODAT: Date | null;
  DLVDAT: Date | null;
  CUSCOD: string;
  STKCOD: string;   // รหัสสินค้า
  LOCCOD: string;
  STKDES: string;   // ชื่อสินค้า
  DEPCOD: string;
  VATCOD: string;
  FREE: string;
  ORDQTY: number;   // จำนวนสั่ง
  REMQTY: number;   // คงเหลือ
  TFACTOR: number;
  UNITPR: number;
  TQUCOD: string;
  DISC: string;
  DISCAMT: number;
  TRNVAL: number;   // มูลค่า
  PACKING: string;
}

// ─── ARBIL.DBF — ใบวางบิล ────────────────────────────────────────────────────
export interface ArBil {
  BILNUM: string;   // เลขที่ใบวางบิล
  BILDAT: Date | null; // วันที่วางบิล
  CUSCOD: string;
  DEPCOD: string;
  BILOUT: Date | null; // วันที่ส่งบิล
  APPDAT: Date | null; // วันที่นัดรับเงิน
  PAYCOND: string;  // เงื่อนไขการชำระ
  REMARK: string;
  NETAMT: number;   // ยอดรวม
  DOCSTAT: string;  // สถานะ
  USERID: string;
  CHGDAT: Date | null;
  PRNDAT: Date | null;
  PRNCNT: number;
}

// ─── ARBILIT.DBF — รายการเอกสารในใบวางบิล ───────────────────────────────────
export interface ArBilIt {
  BILNUM: string;
  DOCNUM: string;
  RCVAMT: number;
  VATAMT: number;
}

// ─── ARSHIP.DBF — ที่อยู่จัดส่ง ──────────────────────────────────────────────
export interface ArShip {
  CUSCOD: string;
  SHIPTO: string;
  ADDR01: string;
  ADDR02: string;
  ADDR03: string;
  ZIPCOD: string;
  TELNUM: string;
  CONTACT: string;
  STATUS: string;
}

// ─── STMAS.DBF — Master สินค้า ───────────────────────────────────────────────
export interface StMas {
  STKCOD: string;   // รหัสสินค้า
  STKDES: string;   // ชื่อสินค้า
  STKDES2: string;  // ชื่อสินค้า (ภาษาอังกฤษ)
  STKTYP: string;
  STKGRP: string;   // กลุ่มสินค้า
  QUCOD: string;    // หน่วยนับ
  TOTBAL: number;   // คงเหลือ
  TOTVAL: number;   // มูลค่าคงเหลือ
  SELLPR1: number;  // ราคาขาย 1
  SELLPR2: number;  // ราคาขาย 2
  VATCOD: string;
  STATUS: string;
  REMARK: string;
}

// ─── ISINFO.DBF — ข้อมูลบริษัท ───────────────────────────────────────────────
export interface IsInfo {
  THINAM: string;   // ชื่อบริษัทภาษาไทย
  ADDR01: string;
  ADDR02: string;
  TELNUM: string;
  ENGNAM: string;   // ชื่อบริษัทภาษาอังกฤษ
  ADDR01ENG: string;
  ADDR02ENG: string;
  TRDREG: string;   // เลขทะเบียนการค้า
  TAXID: string;    // เลขประจำตัวผู้เสียภาษี
  VATRAT: number;   // อัตราภาษี
  FLGVAT: string;
  ORGNUM: number;   // จำนวนสาขา
  ORGSTR: string;   // ชื่อสาขา
}

// ─── BKTRN.DBF — รายการธนาคาร/เช็ค ─────────────────────────────────────────
export interface BkTrn {
  BKTRNTYP: string;
  TRNDAT: Date | null;
  CHQNUM: string;
  CHQDAT: Date | null;
  BNKCOD: string;
  BRANCH: string;
  CUSCOD: string;
  NAME: string;
  AMOUNT: number;
  REMAMT: number;
  CHQSTAT: string;
  REMARK: string;
}

// ─── Composite types for API responses ───────────────────────────────────────
export interface CustomerListItem extends ArMas {
  // computed
  fullAddress?: string;
}

export interface InvoiceWithCustomer extends ArTrn {
  customer?: Pick<ArMas, 'CUSNAM' | 'ADDR01' | 'ADDR02' | 'ADDR03' | 'TELNUM' | 'TAXID' | 'PRENAM'>;
}

export interface InvoiceDetail extends InvoiceWithCustomer {
  items: StCrdWithProduct[];
  remarks: ArTrnRm[];
  shipTo?: ArShip;
}

export interface StCrdWithProduct extends StCrd {
  product?: Pick<StMas, 'STKDES' | 'QUCOD'>;
}

export interface QuotationWithCustomer extends OeSo {
  customer?: Pick<ArMas, 'CUSNAM' | 'ADDR01' | 'TELNUM'>;
  items?: OeSoIt[];
}

export interface BillingWithCustomer extends ArBil {
  customer?: Pick<ArMas, 'CUSNAM' | 'ADDR01' | 'TELNUM'>;
  invoices?: InvoiceWithCustomer[];
}

