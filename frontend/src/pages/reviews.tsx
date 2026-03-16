import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export default function Reviews() {
  const router = useRouter();
  const { class: className } = router.query;

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const normalizedClass =
    typeof className === "string"
      ? className
      : Array.isArray(className)
      ? className[0]
      : undefined;

  useEffect(() => {
    if (!router.isReady) return;

    const fetchReviews = async () => {
      setLoading(true);
      const endpoints = normalizedClass
        ? [
            `${API_BASE}/api/v1/reviews/class/${encodeURIComponent(normalizedClass)}`,
            `${API_BASE}/reviews/class/${encodeURIComponent(normalizedClass)}`
          ]
        : [
            `${API_BASE}/api/v1/reviews/all/list`,
            `${API_BASE}/reviews/all/list`,
            `${API_BASE}/api/v1/reviews/`,
            `${API_BASE}/reviews/`
          ];

      let success = false;
      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setReviews(Array.isArray(data) ? data : []);
            success = true;
            break;
          }
        } catch (err) {
          console.error(`Error:`, err);
        }
      }
      setLoading(false);
    };

    fetchReviews();
  }, [router.isReady, normalizedClass]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">

        <Link 
          href="/" 
          className="inline-block mb-8 bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition border border-white/5 shadow-sm"
        >
          ← กลับหน้าแรก
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-green-200 tracking-tight">
          {normalizedClass ? `รีวิวของ "${normalizedClass}"` : "รีวิวผักพื้นเมืองทั้งหมด"}
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-green-300 mb-4"></div>
            <p className="text-green-200">กำลังดึงพิกัดและรีวิวจากระบบ...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-24 bg-black/10 rounded-3xl border border-dashed border-white/20">
            <p className="text-green-200 italic">ยังไม่มีรีวิวในขณะนี้</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {reviews.map((r) => {
              const lat = r.latitude != null ? Number(r.latitude) : null;
              const lng = r.longitude != null ? Number(r.longitude) : null;

              return (
                <div 
                  key={r.id} 
                  className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-3xl shadow-2xl transition-all hover:bg-white/15"
                >
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
                    <h2 className="text-2xl font-bold text-green-300">{r.class_name}</h2>
                    <div className="text-yellow-400 text-xl tracking-widest bg-black/30 px-5 py-1.5 rounded-full shadow-inner">
                      {"★".repeat(r.rating)}
                      <span className="opacity-20">{"★".repeat(5 - r.rating)}</span>
                    </div>
                  </div>

                  <div className="bg-black/20 p-5 rounded-2xl mb-5 border border-white/5">
                    <p className="text-green-50 text-lg leading-relaxed italic font-light">
                      "{r.review_text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-green-300/70 mb-8 font-light italic">
                    <span>👤 {r.username || r.full_name || "ผู้ใช้ทั่วไป"}</span>
                    <span>•</span>
                    <span>📅 {new Date(r.created_at).toLocaleDateString("th-TH")}</span>
                  </div>

                  {lat !== null && lng !== null && (
                    <div className="mt-4 pt-6 border-t border-white/10">
                      <button
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${
                          expanded === r.id ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                      >
                        {expanded === r.id ? "🔼 ปิดแผนที่" : "📍 ดูพิกัดที่พบเจอ"}
                      </button>

                      {expanded === r.id && (
                        <div className="mt-6 space-y-4 animate-slideDown">
                          {r.place_name && (
                            <div className="text-green-100 font-medium flex items-center gap-2 bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm">
                              📍 {r.place_name}
                            </div>
                          )}

                          <div className="overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl bg-slate-800 h-[280px]">
                            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
                              <img
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=800x400&markers=color:red|label:V|${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                                className="w-full h-full object-cover"
                                alt="Location Map"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-red-300 p-10 text-center">
                                ⚠️ ไม่สามารถโหลดแผนที่ได้ (ขาด API Key)
                              </div>
                            )}
                          </div>

                          {/* 🧭 ปุ่มนำทางที่แก้ให้แล้ว (กดแล้วเด้งไป Google Maps ทันที) */}
                          <div className="flex flex-wrap items-center gap-4">
                            <button
                              onClick={() => 
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank")
                              }
                              className="bg-white text-emerald-900 hover:bg-green-100 px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-sm shadow-xl active:scale-95"
                            >
                              🧭 นำทางด้วย Google Maps
                            </button>
                            <span className="text-[10px] text-green-400/40 font-mono bg-black/20 px-3 py-1 rounded-md">
                              {lat.toFixed(5)}, {lng.toFixed(5)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
