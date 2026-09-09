const API_URL = "https://lannavegwed-backend.onrender.com";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export const submitReview = async (data: any) => {
  const res = await fetch(`${API_URL}/reviews`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
};
```

---

## Flow ที่ถูกต้อง:
```
กด Login Google
  → /auth/login/google (backend)
  → Google OAuth
  → /auth/google/callback (backend)
  → redirect ไป /auth?token=xxx (frontend)
  → หน้า /auth เก็บ token ใน localStorage
  → redirect ไป /
  → ทุก API call ส่ง Authorization: Bearer <token>
