/**
 * services/api.ts
 *
 * ✅ ของเดิม: apiFetch(), classifyImage() — ไม่แตะ
 * 🆕 เพิ่มใหม่: classifyImageTop3() — เรียก /predict/top3
 */

const API_URL = "https://lannavegwed-backend.onrender.com";

export const apiFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
};

// ✅ ของเดิม — ไม่แก้ไข
export const classifyImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch(`${API_URL}/api/v1/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Prediction failed");
  }

  return res.json();
};


// =============================================================
// 🆕 ฟังก์ชันใหม่ — เรียก /predict/top3
// =============================================================

export type TopCandidate = {
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

export type Top3Response = {
  top_candidates: TopCandidate[];
  best_match: TopCandidate | { class_name: "Unknown"; confidence: number; message: string } | null;
};

export const classifyImageTop3 = async (file: File, token: string): Promise<Top3Response> => {
  const formData = new FormData();
  formData.append("file", file);

  // ลองเรียก /api/v1/predict/top3 ก่อน ถ้า 404 ก็ fallback ไป /predict/top3
  let res = await fetch(`${API_URL}/api/v1/predict/top3`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok && res.status === 404) {
    res = await fetch(`${API_URL}/predict/top3`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
    throw new Error("จำแนกภาพไม่สำเร็จ");
  }

  return res.json();
};
