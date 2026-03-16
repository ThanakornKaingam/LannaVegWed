import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { VEGETABLE_DATA } from "../data/vegetables";

const MapComponent = dynamic(() => import("../components/MapPopup"), {
  ssr: false,
});

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

type PredictionResult = {
  class_name: string;
  confidence: number;
  message?: string;
};

// ✅ helper ดึง token
const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Classify() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showReview, setShowReview] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rating, setRating] = useState(5);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
    setFile(selectedFile);
    setResult(null);
    setError("");
    setShowReview(false);
  };

  const handleUpload = async () => {
    if (!file) return setError("กรุณาเลือกรูปก่อน");

    // ✅ เช็ก token ก่อน
    const token = localStorage.getItem("access_token");
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

      let res = await fetch(`${API_BASE}/api/v1/predict/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // ✅ ส่ง token
        body: formData,
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_BASE}/predict/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }, // ✅ ส่ง token
          body: formData,
        });
      }

      if (!res.ok) {
        if (res.status === 401) throw new Error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
        throw new Error("เกิดข้อผิดพลาดในการทำนาย");
      }

      const data = await res.json();
      setResult(data);
      if (data.class_name === "Unknown") {
        setError(data.message || "ไม่สามารถจำแนกได้");
      }

    } catch (err: any) {
      setError(err.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!result) return;

    // ✅ เช็ก token ก่อน
    const token = localStorage.getItem("access_token");
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
          Authorization: `Bearer ${token}`, // ✅ ส่ง token
        },
        body: JSON.stringify({
          class_name: result.class_name,
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

      router.push(`/review-map?review_id=${data.review_id}&class=${result.class_name}`);

    } catch (err) {
      alert("ไม่สามารถบันทึกรีวิวได้ โปรดตรวจสอบอินเทอร์เน็ต");
    } finally {
      setReviewLoading(false);
    }
  };

  const vegetable =
    result && result.class_name !== "Unknown" && VEGETABLE_DATA[result.class_name]
      ? VEGETABLE_DATA[result.class_name]
      : null;

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white flex items-center justify-center px-6 py-16">
      <div className="bg-white/10 dark:bg-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 w-full max-w-4xl border border-white/20">

        <div className="mb-6">
          <Link href="/" className="inline-block bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm transition shadow-sm">
            ← กลับหน้าแรก
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold mb-10 text-center text-green-300 tracking-tight">
          🌿 Vegetable Classification
        </h1>

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

        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center font-medium animate-pulse">
            ❌ {error}
          </div>
        )}

        {vegetable && result && (
          <div className="mt-14 rounded-3xl overflow-hidden bg-white/10 dark:bg-slate-900 border border-white/20 shadow-inner">
            <div className="bg-green-600 text-white p-8 text-center">
              <h2 className="text-3xl font-bold">{vegetable.thai_name}</h2>
              <p className="italic mt-2 opacity-90">{vegetable.scientific_name}</p>
              <div className="mt-4 inline-block bg-black/20 px-4 py-1 rounded-full text-sm">
                ความเชื่อมั่น {(result.confidence * 100).toFixed(2)}%
              </div>
            </div>

            <div className="p-8 md:p-10 space-y-8 text-gray-200">
              {vegetable.images && (
                <div className="flex justify-center gap-4 flex-wrap">
                  {vegetable.images.map((img: string, index: number) => (
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

              <div className="grid md:grid-cols-2 gap-6 text-sm md:text-base">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-green-400">📍 ชื่อท้องถิ่น</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{vegetable.local_name}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400">🌱 ลักษณะทางพฤกษศาสตร์</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{vegetable.description}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-green-400">💊 สรรพคุณ</h4>
                    <p className="pl-6 border-l-2 border-green-500/30">{vegetable.benefits}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400">🍽 เมนูแนะนำ</h4>
                    <ul className="list-disc list-inside pl-6 border-l-2 border-green-500/30">
                      {vegetable.recommended_menu?.map((menu: string, i: number) => (
                        <li key={i}>{menu}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

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
                    <h3 className="text-xl font-semibold text-yellow-400">เขียนรีวิวและปักหมุดพิกัด</h3>
                    <div>
                      <label className="block text-sm mb-2">ให้คะแนนความพึงพอใจ</label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full p-3 rounded-xl bg-gray-800 text-white border border-white/20 outline-none"
                      >
                        {[5,4,3,2,1].map(n => (
                          <option key={n} value={n}>{n} ดาว {"⭐".repeat(n)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">รายละเอียดรีวิว</label>
                      <textarea
                        placeholder="บอกเล่าประสบการณ์หรือสถานที่พบเจอ..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full p-4 rounded-xl bg-gray-800 text-white border border-white/20 h-32 outline-none focus:border-green-500 transition"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={handleSubmitReview}
                        disabled={reviewLoading}
                        className="flex-1 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
                      >
                        {reviewLoading ? "⌛ กำลังบันทึก..." : "📍 บันทึกและเปิดแผนที่"}
                      </button>
                      <button onClick={() => setShowReview(false)} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition">
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
