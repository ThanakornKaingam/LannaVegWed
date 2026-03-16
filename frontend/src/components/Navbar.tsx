import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

type Props = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

export default function Navbar({ theme, toggleTheme }: Props) {
  const router = useRouter();
  const { user, logout } = useAuth();                    // ✅ เพิ่มแค่บรรทัดนี้

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav
      className="
        flex items-center justify-between
        px-8 py-4
        bg-slate-800
        text-white
        shadow-lg
        sticky top-0 z-50
      "
    >
      {/* 🔹 LEFT SIDE — ไม่เปลี่ยนแปลงเลย */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-green-400 font-semibold text-lg">
          🌿 LannaVeg
        </Link>
        <Link
          href="/"
          className={`px-4 py-2 rounded-full transition ${
            isActive("/") ? "bg-green-600" : "hover:bg-slate-700"
          }`}
        >
          หน้าแรก
        </Link>
        <Link
          href="/reviews"
          className={`px-4 py-2 rounded-full transition ${
            isActive("/reviews") ? "bg-green-600" : "hover:bg-slate-700"
          }`}
        >
          รีวิวทั้งหมด
        </Link>
        <Link
          href="/my-reviews"
          className={`px-4 py-2 rounded-full transition ${
            isActive("/my-reviews") ? "bg-green-600" : "hover:bg-slate-700"
          }`}
        >
          ประวัติการรีวิวของฉัน
        </Link>
        <Link
          href="/classify"
          className={`px-4 py-2 rounded-full transition ${
            isActive("/classify") ? "bg-green-600" : "hover:bg-slate-700"
          }`}
        >
          Classify
        </Link>
      </div>

      {/* 🔹 RIGHT SIDE */}
      <div className="flex items-center gap-4">
        {/* Theme Button — ไม่เปลี่ยนแปลง */}
        <button
          onClick={toggleTheme}
          className="
            px-4 py-2 rounded-full
            bg-gray-200 dark:bg-gray-700
            text-black dark:text-white
            transition
          "
        >
          {theme === "dark" ? "☀ Light" : "🌙 Dark"}
        </button>

        {/* ✅ เพิ่มเฉพาะส่วนนี้: แสดงชื่อ user กดแล้วไป /profile */}
        {user ? (
          <>
            <Link
              href="/profile"
              className={`px-4 py-2 rounded-full font-medium transition ${
                isActive("/profile") ? "bg-green-600" : "hover:bg-slate-700"
              }`}
              title="แก้ไขข้อมูลส่วนตัว"
            >
              👤 {user.full_name?.split(" ")[0] || user.email?.split("@")[0] || "โปรไฟล์"}
            </Link>
            <Link
              href="/history"
              className={`px-4 py-2 rounded-full transition ${
                isActive("/history") ? "bg-green-600" : "hover:bg-slate-700"
              }`}
            >
              ประวัติจำแนก
            </Link>
            <button
              onClick={() => logout()}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 transition text-white"
            >
              ออกจากระบบ
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 rounded-full bg-green-600 hover:bg-green-700 transition"
          >
            เข้าสู่ระบบ
          </Link>
        )}
        {/* ✅ จบส่วนที่เพิ่ม */}
      </div>
    </nav>
  );
}
