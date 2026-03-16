import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ✅ ใช้ชื่อคีย์ให้ตรงกับใน Render Environment / .env.local
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    if (!apiKey) {
      setError("ไม่พบ Google Maps API Key (ตรวจสอบ Environment Variables ใน Render)");
      setLoading(false);
      return;
    }

    const initMap = () => {
      const google = (window as any).google;
      if (!google || !mapRef.current) return;

      // พิกัดศูนย์กลางภาคเหนือ (เชียงใหม่)
      const chiangMai = { lat: 18.7883, lng: 98.9853 };

      const map = new google.maps.Map(mapRef.current, {
        center: chiangMai,
        zoom: 12,
        mapId: "DEMO_MAP_ID", // ใส่เผื่อไว้สำหรับ Advanced Markers ในอนาคต
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      // ปักหมุดตัวอย่าง
      new google.maps.Marker({
        position: chiangMai,
        map,
        title: "ศูนย์กลางการค้นหาผักพื้นเมือง",
        animation: google.maps.Animation.DROP,
      });

      setLoading(false);
    };

    if ((window as any).google) {
      initMap();
      return;
    }

    if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      // ✅ เพิ่ม libraries=places และ callback
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError("ไม่สามารถโหลด Google Maps ได้ (เช็ค API Key หรือการตั้งค่าโดเมน)");
        setLoading(false);
      };

      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="h-screen w-full relative bg-gray-100">
      {/* Navigation Overlay */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Link
          href="/"
          className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg text-green-700 font-bold hover:bg-green-50 transition flex items-center gap-2 border border-green-100"
        >
          ← หน้าแรก
        </Link>
        <Link
          href="/classify"
          className="bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg font-bold hover:bg-green-700 transition border border-green-500"
        >
          🔍 ไปวิเคราะห์ภาพ
        </Link>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-green-800 animate-pulse">
              📍 กำลังดึงข้อมูลพิกัดจากเซิร์ฟเวอร์...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-30 px-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-200 text-center max-w-md">
            <p className="text-red-500 font-bold text-xl mb-3">การเชื่อมต่อผิดพลาด</p>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-6 py-2 rounded-full font-bold">
              ลองโหลดใหม่อีกครั้ง
            </button>
          </div>
        </div>
      )}

      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
