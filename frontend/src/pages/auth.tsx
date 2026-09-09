import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!router.isReady) return;

    const handleAuth = async () => {
      // 1. ดึง Token จาก URL
      const urlToken = router.query.token;
      
      if (urlToken && typeof urlToken === "string") {
        localStorage.setItem("access_token", urlToken);
        // ล้าง URL ให้สวยๆ
        router.replace("/auth", undefined, { shallow: true });
      }

      // 2. เช็ก Token ล่าสุดจากกระเป๋า (LocalStorage)
      const currentToken = localStorage.getItem("access_token");

      if (!currentToken) {
        setLoading(false);
        return;
      }

      try {
        // 3. ยื่นบัตรให้ Backend ตรวจชื่อ
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
          // ปิด withCredentials เพราะเราใช้ Token แล้ว
        });
        
        const userData = res.data.user || res.data;
        setUser(userData);

        // 4. ถ้าผ่าน... วาร์ปกลับหน้าหลักทันที
        setTimeout(() => {
          router.push("/");
        }, 500);

      } catch (err) {
        console.error("Auth failed:", err);
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    handleAuth();
  }, [router.isReady, router.query.token]);

  // ฟังก์ชัน Logout (ล้างทุกอย่าง)
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    window.location.href = "/";
  };

  // --- UI เดิมของอ้าย เป๊ะๆ ---
  if (loading) {
    return <div style={{ color: "white", textAlign: "center", marginTop: "100px" }}>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0f172a", color: "white" }}>
      <div style={{ background: "#1e293b", padding: "40px", borderRadius: "12px", width: "350px", textAlign: "center" }}>
        {user ? (
          <>
            <h2>Welcome {user.full_name || user.username}</h2>
            <p>{user.email}</p>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Redirecting to home...</p>
            <button onClick={handleLogout} style={{ marginTop: "20px", width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "#c73c3c", color: "white", cursor: "pointer" }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <h2>Welcome</h2>
            <p style={{ fontSize: "14px", opacity: 0.7 }}>Please login to continue</p>
            <button onClick={() => (window.location.href = `${API_URL}/auth/google/login`)} style={{ marginTop: "20px", width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "#2563eb", color: "white", cursor: "pointer" }}>
              Login with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
