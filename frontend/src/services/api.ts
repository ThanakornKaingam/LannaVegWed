const API_URL = "https://lannavegwed-backend.onrender.com";

export const apiFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include", // ถูกต้องแล้ว (สำคัญมากสำหรับ iOS)
  });
};

export const classifyImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  // 🛠️ แก้ไขตรงนี้: เพิ่ม /api/v1 เข้าไปข้างหน้า
  const res = await apiFetch(`${API_URL}/api/v1/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Prediction failed");
  }

  return res.json();
};
