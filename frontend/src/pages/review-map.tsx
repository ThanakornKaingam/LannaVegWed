import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

// ✅ บังคับ HTTPS ป้องกันการโดนบล็อกเนื้อหา
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  .replace("http://", "https://")
  .replace(/\/$/, "");

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

// ✅ กำหนดสไตล์ความสูงที่แน่นอนให้ Maps (ป้องกันจอขาว)
const containerStyle = {
  width: '100%',
  height: '350px' // เปลี่ยนจาก h-48 เป็นความสูงที่แน่นอน
};

export default function ReviewMap() {
  const router = useRouter();
  const { review_id, class: className } = router.query;

  // พิกัดเริ่มต้น (เชียงใหม่/พะเยา เผื่อดึง GPS ไม่ได้)
  const [lat, setLat] = useState<number>(18.7883); 
  const [lng, setLng] = useState<number>(98.9853);
  const [hasLocation, setHasLocation] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  });

  // 📍 ดึงตำแหน่งปัจจุบัน
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setHasLocation(true);
        },
        () => {
          console.log("GPS ดึงไม่ได้ ใช้ค่าเริ่มต้น");
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setLat(e.latLng.lat());
      setLng(e.latLng.lng());
      setHasLocation(true);
    }
  }, []);

  const handleSaveLocation = async () => {
    if (!review_id || !hasLocation) {
      alert("กรุณาเลือกตำแหน่งบนแผนที่ก่อนครับ");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("กรุณาเข้าสู่ระบบใหม่");
      router.push("/auth");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/reviews/${review_id}/location`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          place_name: placeName,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่");
          router.push("/auth");
        } else {
          const err = await res.json();
          alert(err.detail || "บันทึกไม่สำเร็จ");
        }
        return;
      }

      router.push(className ? `/reviews?class=${className}` : "/reviews");
    } catch {
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white flex items-center justify-center px-4 py-10">
      <div className="bg-white/10 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 w-full max-w-lg border border-white/20">
        
        <div className="flex justify-between items-center">
          <Link href="/" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm transition">
            ← กลับหน้าแรก
          </Link>
          <span className="text-xs text-white/50">ID: {review_id}</span>
        </div>

        <h1 className="text-2xl font-bold text-center text-green-300">
          📍 ระบุพิกัดที่พบเจอ
        </h1>

        {/* 🗺️ ส่วนแผนที่ - แก้ไขเพื่อลดโอกาสจอขาว */}
        <div className="rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-900 shadow-inner relative" style={{ minHeight: '350px' }}>
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4 text-center">
              เกิดข้อผิดพลาดในการโหลด Google Maps <br/> กรุณาเช็ค API Key หรือการเชื่อมต่อ
            </div>
          )}
          
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={{ lat, lng }}
              zoom={15}
              onClick={onMapClick}
              options={{
                disableDefaultUI: false,
                mapTypeControl: false,
                streetViewControl: false,
              }}
            >
              <Marker 
                position={{ lat, lng }} 
                animation={google.maps.Animation.DROP}
              />
            </GoogleMap>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
              <p className="text-white/40 italic text-sm">กำลังโหลดข้อมูลแผนที่...</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-xs text-white/40 uppercase tracking-widest">พิกัดปัจจุบัน</p>
            <p className="font-mono text-green-400">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
          </div>

          <input
            placeholder="📍 ชื่อสถานที่ (เช่น สวนหลังบ้าน, ตลาด)"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            className="w-full p-4 rounded-2xl bg-gray-800 border border-white/10 text-white focus:border-green-500 outline-none transition"
          />

          <button
            onClick={handleSaveLocation}
            disabled={loading || !isLoaded}
            className="w-full bg-green-500 hover:bg-green-600 h-14 rounded-2xl font-bold text-lg shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "⌛ กำลังบันทึก..." : "✅ ยืนยันตำแหน่งนี้"}
          </button>
        </div>
      </div>
    </div>
  );
}
