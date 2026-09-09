import { useState, useEffect } from "react";
import axios from "axios";

// ✅ ดึงค่า URL จาก ENV และตัด / ท้ายประโยคออก
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://lanna-backend.onrender.com").replace(/\/$/, "");

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // ✅ ส่ง withCredentials: true เพื่อให้ Browser ยอมส่ง Cookie access_token ไปด้วย
        const res = await axios.get(`${API_BASE}/auth/me`, {
          withCredentials: true,
        });
        
        // 🔍 แก้ตรงนี้: Backend ของอ้ายส่งมาเป็น { "user": { "email": ..., "full_name": ... } }
        // เราจึงต้องเช็ค res.data.user ครับ
        if (res.data && res.data.user) {
          setUser(res.data.user); 
        } else {
          setUser(res.data); // กันเหนียวเผื่อโครงสร้างเปลี่ยน
        }
      } catch (err: any) {
        // ถ้า 401 (Unauthorized) หมายถึงยังไม่ได้ Login ให้ User เป็น null
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { user, loading };
}
