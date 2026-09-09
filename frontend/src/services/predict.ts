/**
 * services/predict.ts
 *
 * Service สำหรับเรียก Prediction API
 * ใช้ร่วมกับ api.ts
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// =============================================================
// Top 3 Classification
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
  best_match: TopCandidate | null;
};

export const predictTop3 = async (file: File): Promise<Top3Response> => {
  const formData = new FormData();
  formData.append("file", file);

  let res = await fetch(`${API_URL}/api/v1/predict/top3`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok && res.status === 404) {
    res = await fetch(`${API_URL}/predict/top3`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
    throw new Error("จำแนกภาพไม่สำเร็จ");
  }

  return res.json();
};

// =============================================================
// Top 1 Classification (เดิม — เผื่อยังใช้อยู่)
// =============================================================

export const predictSingle = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  let res = await fetch(`${API_URL}/api/v1/predict/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok && res.status === 404) {
    res = await fetch(`${API_URL}/predict/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
  }

  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
};
