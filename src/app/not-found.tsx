import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">404 - ไม่พบหน้าที่ต้องการ</h2>
        <p className="text-sm text-slate-600">
          ขออภัย ไม่พบหน้าที่คุณค้นหา หรือเอกสารอาจถูกย้าย/ลบไปแล้ว
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}

