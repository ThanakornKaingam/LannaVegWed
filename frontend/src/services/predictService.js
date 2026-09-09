import { apiFetch } from "./api";

export async function predictImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch(
    "https://lannavegwed-backend.onrender.com/predict",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Prediction failed");
  }

  return await response.json();
}
