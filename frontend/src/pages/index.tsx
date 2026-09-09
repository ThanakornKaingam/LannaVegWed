import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ 1. ดึง Token จาก LocalStorage
    const token = localStorage.getItem("access_token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // ✅ 2. ดึงข้อมูล User โดยส่ง Token ไปทาง Header
    fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`, // ส่งบัตรพนักงานไปตรวจ
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => {
        // ดักข้อมูลเผื่อมาในรูปแบบ data.user
        setUser(data.user || data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch user failed:", err);
        // ถ้า Token หมดอายุหรือผิด ให้ล้างออก
        localStorage.removeItem("access_token");
        setUser(null);
        setLoading(false);
      });
  }, []);

  // ✅ 3. แก้ไขฟังก์ชัน Logout ให้ลบ Token ในเครื่อง
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    // วาร์ปกลับหน้าหลักเพื่อให้ State รีเฟรช
    window.location.href = "/";
  };

  return (
    <>
      <Head>
        <title>LannaVeg | Home</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white transition-all duration-500">
        
        {/* ================= NAVBAR ================= */}
        <nav className="flex justify-between items-center px-6 md:px-10 py-6 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
          <h1 className="text-2xl font-bold text-green-300">🌿 LannaVeg</h1>

          <div className="space-x-4 md:space-x-6 text-sm flex items-center">
            <Link href="/classify" className="hover:text-green-300 transition">Classify</Link>
            <Link href="/reviews" className="hover:text-green-300 transition">รีวิวทั้งหมด</Link>

            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : user ? (
              <div className="flex items-center space-x-3 md:space-x-4">
                <span className="hidden md:inline text-green-300 font-semibold bg-white/10 px-3 py-1 rounded-full">
                  👤 {user.full_name || user.username || "User"}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition shadow-md text-xs md:text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg text-white font-medium transition shadow-md"
              >
                Login
              </Link>
            )}
          </div>
        </nav>

        {/* ================= HERO ================= */}
        <section className="text-center py-20 md:py-32 px-6">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold mb-6"
          >
            ระบบจำแนกผักช่อดอกพื้นเมืองภาคเหนือ
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-green-200 mb-10 max-w-2xl mx-auto"
          >
            อัปโหลดภาพเพื่อให้ AI วิเคราะห์ชนิดของผักพื้นเมืองแบบแม่นยำ
          </motion.p>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/classify"
              className="bg-green-500 hover:bg-green-600 px-10 py-4 rounded-2xl font-bold shadow-xl text-xl transition inline-block"
            >
              🔍 เริ่มจำแนกผัก
            </Link>
          </motion.div>
        </section>

        {/* ================= GALLERY ================= */}
        <section className="py-20 bg-white dark:bg-gray-900 text-gray-800 dark:text-white rounded-t-[3rem] shadow-2xl">
          <h3 className="text-3xl font-bold text-center mb-12">🖼 ตัวอย่างผักพื้นเมือง</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
            {[
              { name: "มะแข่น", img: "/images/makhwaen2.png" },
              { name: "นางแลว", img: "/images/nanglaew2.png" },
              { name: "ผักเผ็ด", img: "/images/phak_phet3.png" },
            ].map((item, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-transparent hover:border-green-500/50 transition-all text-center">
                <div className="overflow-hidden rounded-2xl mb-4 h-48">
                   <img src={item.img} alt={item.name} className="h-full w-full object-cover hover:scale-110 transition duration-500" />
                </div>
                <h4 className="font-bold text-xl text-green-700 dark:text-green-400">{item.name}</h4>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center py-10 bg-green-950 text-green-300 text-sm">
          <p>© 2026 LannaVeg Project | University of Phayao</p>
        </footer>
      </div>
    </>
  );
}
