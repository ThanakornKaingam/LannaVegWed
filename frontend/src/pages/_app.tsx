import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { AuthProvider } from "../context/AuthContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const router = useRouter(); // สร้างตัวแปรจัดการ Route

  // ✅ 1. จัดการเรื่อง Theme และเช็ก Auth เบื้องต้น
  useEffect(() => {
    setMounted(true);
    
    // ดึงค่า Theme
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 🚩 ส่วนที่เพิ่ม: ดักจับเหตุการณ์ Logout/401 ทั่วทั้งแอป
    const handleAuthError = (event: any) => {
      // ถ้ามีการส่ง Signal ว่า Unauthorized (401) ให้เด้งไปหน้า Login
      if (event.detail === 401) {
        localStorage.removeItem("access_token"); // ล้าง token ทิ้ง
        router.push("/login"); 
      }
    };

    window.addEventListener("auth-error", handleAuthError);
    return () => window.removeEventListener("auth-error", handleAuthError);
  }, [router]);

  // ✅ 2. ฟังก์ชันสลับ Theme (คงเดิมเป๊ะ)
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>LannaVeg - ระบบจำแนกผักพื้นเมือง</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <main>
          <AuthProvider>
            <Component
              {...pageProps}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </AuthProvider>
        </main>
      </div>
    </>
  );
}
