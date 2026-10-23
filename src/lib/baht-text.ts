/**
 * แปลงจำนวนเงินเป็นตัวอักษรภาษาไทย (BahtText)
 * เช่น 1250.50 -> "หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์"
 */
export function bahtText(num: number | string): string {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n) || n === 0) return "ศูนย์บาทถ้วน";

  const isNegative = n < 0;
  const absNum = Math.abs(n);

  const [intPartStr, decPartStr = ""] = absNum.toFixed(2).split(".");
  const intPart = parseInt(intPartStr, 10);
  const decPart = parseInt(decPartStr.padEnd(2, "0").slice(0, 2), 10);

  const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  const digits = [
    "",
    "หนึ่ง",
    "สอง",
    "สาม",
    "สี่",
    "ห้า",
    "หก",
    "เจ็ด",
    "แปด",
    "เก้า",
  ];

  function convertGroup(val: number): string {
    let result = "";
    const s = val.toString();
    const len = s.length;

    for (let i = 0; i < len; i++) {
      const d = parseInt(s[i], 10);
      const pos = len - i - 1;

      if (d !== 0) {
        if (pos === 0 && d === 1 && len > 1 && parseInt(s[len - 2], 10) !== 0) {
          result += "เอ็ด";
        } else if (pos === 1 && d === 1) {
          result += "สิบ";
        } else if (pos === 1 && d === 2) {
          result += "ยี่สิบ";
        } else {
          result += digits[d] + (pos === 1 ? "สิบ" : units[pos]);
        }
      }
    }
    return result;
  }

  function convertInteger(val: number): string {
    if (val === 0) return "";
    let res = "";
    let remaining = val;
    let millionCount = 0;

    while (remaining > 0) {
      const group = remaining % 1000000;
      if (group > 0) {
        let groupText = convertGroup(group);
        for (let i = 0; i < millionCount; i++) {
          groupText += "ล้าน";
        }
        res = groupText + res;
      }
      remaining = Math.floor(remaining / 1000000);
      millionCount++;
    }
    return res;
  }

  let text = isNegative ? "ลบ" : "";

  if (intPart === 0 && decPart > 0) {
    text += convertGroup(decPart) + "สตางค์";
  } else {
    text += convertInteger(intPart) + "บาท";
    if (decPart === 0) {
      text += "ถ้วน";
    } else {
      text += convertGroup(decPart) + "สตางค์";
    }
  }

  return text;
}

