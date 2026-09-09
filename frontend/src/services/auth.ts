import { apiFetch } from "./api";

const API_URL = "https://lannavegwed-backend.onrender.com";

export const loginWithGoogle = () => {
  window.location.href = `${API_URL}/auth/google/login`;
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("access_token"); // ✅ key ต้องตรงกับ auth.tsx
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`, // ✅ ส่ง token ใน header
    },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
};

export const logout = async () => {
  localStorage.removeItem("access_token"); // ✅ key ตรงกัน
  window.location.href = "/login";
};
