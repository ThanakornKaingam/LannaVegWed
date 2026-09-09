/**
 * pages/classify.tsx
 *
 * 🆕 แก้ไขจากเดิม:
 *   - เรียก /predict/top3 แทน /predict/
 *   - แสดง Top 3 การ์ดให้ผู้ใช้เลือก
 *   - เลือกแล้วแสดงรายละเอียด + ฟอร์มรีวิว
 *   - บันทึกรีวิว → redirect ไปหน้า review-map ปักหมุด (flow เดิม)
 *
 * ✅ สิ่งที่ยังใช้เหมือนเดิม:
 *   - VEGETABLE_DATA จาก data/vegetables
 *   - POST /reviews/ → ได้ review_id
 *   - redirect ไป /review-map?review_id=xxx&class=xxx
 *   - auth token จาก localStorage
 */
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { VEGETABLE_DATA } from "../data/vegetables";
import ConfidenceBar from "../components/ConfidenceBar";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

// Type สำหรับ Top 3 candidate (ตรงกับ backend response)
type TopCandidate = {
  rank: number;
  class_name: string;
  confidence: number;
  thai_name: string;
  local_name: string;
  scientific_name: string;
  properties: string;
  recommended_menu: string;
  botanical_description: string;
  images: string[];
};

type Top3Response = {
  top_candidates: TopCandidate[];
  best_match: any;
};

export default function Classify() {
  const router = useRouter();

  // === Upload State ===
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // === Top 3 State ===
  const [top3, setTop3] = useState<TopCandidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // === Review State ===
  const [showReview, setShowReview] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);

  // === Helpers ===
  const selectedCandidate = selectedIndex !== null ? top3[selectedIndex] : null;

  const getToken = () => localStorage.getItem("access_token");

  // === File Change ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
    setFile(selectedFile);
    setTop3([]);
    setSelectedIndex(null);
    setShowReview(false);
    setError("");
  };

  // =============================================================
  // 🆕 เรียก /predict/top3 แทน /predict/
  // =============================================================
  const handleUpload = async () => {
    if (!file) return setError("กรุณาเลือกรูปก่อน");

    const token = getToken();
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      router.push("/login");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      setTop3([]);
      setSelectedIndex(null);
      setShowReview(false);

      // ลอง /api/v1/predict/top3 ก่อน ถ้า 404 ก็ fallback
      let res: Response;
      try {
        res = await fetch(`${API_BASE}/api/v1/predict/top3`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok && res.status === 404) {
          res = await fetch(`${API_BASE}/predict/top3`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
        }
      } catch (fetchErr) {
        // Network error / CORS / server ไม่ตอบ
        throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือรอสักครู่แล้วลองใหม่");
      }

      if (!res.ok) {
        if (res.status === 401) throw new Error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "เกิดข้อผิดพลาดในการวิเคราะห์ภาพ");
      }

      const data: Top3Response = await res.json();

      // 🔥 ถ้า top_candidates ว่าง = ภาพไม่ใช่ผัก
      if (!data.top_candidates || data.top_candidates.length === 0) {
        const msg = data.best_match?.message || "ไม่สามารถจำแนกได้ ภาพนี้อาจไม่ใช่ผักพื้นบ้าน กรุณาถ่ายภาพผักแล้วลองใหม่อีกครั้ง";
        setError(msg);
        return;
      }

      setTop3(data.top_candidates);

    } catch (err: any) {
      setError(err.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // เลือก candidate จาก Top 3
  // =============================================================
  const handleSelectCandidate = (index: number) => {
    setSelectedIndex(index);
    setShowReview(false);
    setReviewText("");
    setRating(5);
  };

  // =============================================================
  // ส่งรีวิว → redirect ไปปักหมุด (flow เดิม)
  // =============================================================
  const handleSubmitReview = async () => {
    if (!selectedCandidate) return;

    const token = getToken();
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อนบันทึกรีวิว");
      router.push("/login");
      return;
    }

    try {
      setReviewLoading(true);

      const res = await fetch(`${API_BASE}/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          class_name: selectedCandidate.class_name,
          review_text: reviewText,
          rating: rating,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          alert("กรุณาเข้าสู่ระบบก่อนบันทึกรีวิว");
          router.push("/login");
        } else {
          alert(data.detail || "เกิดข้อผิดพลาดในการบันทึก");
        }
        return;
      }

      // ✅ redirect ไปหน้า review-map เหมือนเดิม
      router.push(`/review-map?review_id=${data.review_id}&class=${selectedCandidate.class_name}`);

    } catch (err) {
      alert("ไม่สามารถบันทึกรีวิวได้ โปรดตรวจสอบอินเทอร์เน็ต");
    } finally {
      setReviewLoading(false);
    }
  };

  // =============================================================
  // สีตามระดับความมั่นใจ
  // =============================================================
  const getConfBadgeClass = (conf: number) => {
    const pct = conf * 100;
    if (pct >= 80) return "bg-green-500/20 text-green-300 border-green-500/30";
    if (pct >= 40) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    return "bg-red-500/20 text-red-300 border-red-500/30";
  };

  // =============================================================
  // Render
  // =============================================================
  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white flex items-center justify-center px-6 py-16">
      <div className="bg-white/10 dark:bg-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 w-full max-w-4xl border border-white/20">

        {/* ========== ปุ่มกลับ ========== */}
        <div className="mb-6">
          <Link href="/" className="inline-block bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition shadow-sm">
            ← กลับหน้าแรก
          </Link>
        </div>

        {/* ========== หัวข้อ ========== */}
        <h1 className="text-3xl md:text-4xl font-semibold mb-10 text-center text-green-300 tracking-tight">
          🌿 Vegetable Classification
        </h1>

        {/* ========== อัปโหลดภาพ ========== */}
        <div className="space-y-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border border-gray-400 dark:border-slate-600 rounded-2xl p-3 bg-white dark:bg-slate-700 text-black dark:text-white"
          />

          <div className="flex justify-center bg-black/20 rounded-3xl min-h-[250px] items-center overflow-hidden border border-white/5">
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="w-64 h-64 md:w-72 md:h-72 object-cover rounded-3xl shadow-lg border-2 border-green-500/50"
                onError={() => setError("ไม่สามารถแสดงรูปพรีวิวได้")}
              />
            ) : (
              <div className="text-white/20 italic">ยังไม่มีรูปภาพ</div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 transition px-6 py-4 rounded-2xl font-bold shadow-lg text-lg disabled:opacity-50 active:scale-95"
          >
            {loading ? "⌛ กำลังวิเคราะห์..." : "🔍 เริ่มวิเคราะห์ภาพ"}
          </button>
        </div>

        {/* ========== Error / ไม่ใช่ผัก ========== */}
        {error && (
          <div className="mt-10 rounded-3xl overflow-hidden bg-white/10 border border-red-500/30 shadow-inner">
            <div className="bg-red-500/20 p-8 md:p-10 text-center space-y-4">
              <div className="text-6xl">🚫</div>
              <h2 className="text-2xl font-bold text-red-300">ไม่พบผักพื้นบ้านในภาพ</h2>
              <p className="text-white/70 max-w-md mx-auto">
                {error}
              </p>
              <button
                onClick={() => { setError(""); setFile(null); setPreview(null); }}
                className="mt-4 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition"
              >
                🔄 ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🆕 Top 3 ผลจำแนก                                           */}
        {/* ========================================================= */}
        {top3.length > 0 && (
          <div className="mt-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-green-300">ผลการจำแนก Top 3</h2>
              <p className="text-sm text-white/60 mt-1">เลือกผลที่คุณคิดว่าถูกต้องมากที่สุด</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top3.map((candidate, index) => {
                const isSelected = selectedIndex === index;
                const pct = (candidate.confidence * 100).toFixed(1);

                return (
                  <div
                    key={candidate.rank}
                    onClick={() => handleSelectCandidate(index)}
                    className={`
                      relative cursor-pointer rounded-2xl p-5 transition-all duration-200
                      border-2 hover:scale-[1.02]
                      ${isSelected
                        ? "border-green-400 bg-green-500/20 shadow-lg shadow-green-500/20 ring-2 ring-green-400/50"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                      }
                    `}
                  >
                    {/* เครื่องหมายถูก */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* อันดับ */}
                    <div className="text-xs font-semibold text-white/40 mb-2">
                      อันดับ {candidate.rank}
                    </div>

                    {/* ชื่อผัก */}
                    <h3 className="text-lg font-bold text-white mb-0.5">
                      {candidate.thai_name}
                    </h3>
                    <p className="text-xs text-white/50 italic mb-3">
                      {candidate.scientific_name}
                    </p>

                    {/* ค่าความมั่นใจ */}
                    <span className={`
                      inline-block px-3 py-1 rounded-full text-sm font-semibold border
                      ${getConfBadgeClass(candidate.confidence)}
                    `}>
                      {pct}%
                    </span>

                    {/* ConfidenceBar */}
                    <div className="mt-3">
                      <ConfidenceBar confidence={candidate.confidence} showLabel={false} />
                    </div>

                    {/* คำอธิบายสั้น */}
                    <p className="mt-3 text-xs text-white/50 leading-relaxed line-clamp-2">
                      {candidate.botanical_description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🆕 รายละเอียดผักที่เลือก + รีวิว                              */}
        {/* ========================================================= */}
        {selectedCandidate && (
          <div className="mt-10 rounded-3xl overflow-hidden bg-white/10 dark:bg-slate-900 border border-white/20 shadow-inner animate-fadeIn">

            {/* Header */}
            <div className="bg-green-600 text-white p-8 text-center">
              <h2 className="text-3xl font-bold">{selectedCandidate.thai_name}</h2>
              <p className="italic mt-2 opacity-90">{selectedCandidate.scientific_name}</p>
              <div className="mt-4 inline-block bg-black/20 px-4 py-1 rounded-full text-sm">
                ความเชื่อมั่น {(selectedCandidate.confidence * 100).toFixed(2)}%
              </div>
            </div>

            <div className="p-8 md:p-10 space-y-8 text-gray-200">
              {/* รูปภาพอ้างอิง */}
              {selectedCandidate.images && selectedCandidate.images.length > 0 && (
                <div className="flex justify-center gap-4 flex-wrap">
                  {selectedCandidate.images.map((img, index) => (
                    <img
                      key={index}
                      src={img.replace("http://", "https://")}
                      alt="vegetable example"
                      className="w-32 h-32 md:w-44 md:h-44 object-cover rounded-2xl shadow-lg border border-white/10 hover:scale-110 transition duration-300"
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image")}
                    />
                  ))}
                </div>
              )}

              {/* รายละเอียด */}
              <div className="grid md:grid-cols-2 gap-6 text-sm md:text-base">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-green-400">📍 ชื่อท้องถิ่น</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{selectedCandidate.local_name}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400">🌱 ลักษณะทางพฤกษศาสตร์</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{selectedCandidate.botanical_description}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-green-400">💊 สรรพคุณ</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{selectedCandidate.properties}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400">🍽 เมนูแนะนำ</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{selectedCandidate.recommended_menu}</p>
                  </div>
                </div>
              </div>

              {/* ========== รีวิว + ปักหมุด ========== */}
              <div className="mt-10 pt-8 border-t border-white/10 text-center">
                {!showReview ? (
                  <button
                    onClick={() => setShowReview(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 rounded-xl font-bold transition transform hover:scale-105 shadow-xl"
                  >
                    ⭐ คุณเจอผักชนิดนี้ที่ไหน? เขียนรีวิวเลย
                  </button>
                ) : (
                  <div className="mt-6 bg-white/5 p-6 rounded-3xl border border-white/10 text-left space-y-4">
                    <h3 className="text-xl font-semibold text-yellow-400">
                      เขียนรีวิว: {selectedCandidate.thai_name}
                    </h3>

                    {/* ให้คะแนนดาว */}
                    <div>
                      <label className="block text-sm mb-2 text-white/70">ให้คะแนนความพึงพอใจ</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-3xl transition-transform hover:scale-125 ${
                              rating >= star ? "text-yellow-400" : "text-white/20"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ข้อความรีวิว */}
                    <div>
                      <label className="block text-sm mb-2 text-white/70">รายละเอียดรีวิว</label>
                      <textarea
                        placeholder="บอกเล่าประสบการณ์หรือสถานที่พบเจอ..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full p-4 rounded-xl bg-gray-800 text-white border border-white/20 h-32 outline-none focus:border-green-500 transition"
                      />
                    </div>

                    {/* ปุ่ม */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleSubmitReview}
                        disabled={reviewLoading}
                        className="flex-1 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
                      >
                        {reviewLoading ? "⌛ กำลังบันทึก..." : "📍 บันทึกและเปิดแผนที่ปักหมุด"}
                      </button>
                      <button
                        onClick={() => setShowReview(false)}
                        className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
