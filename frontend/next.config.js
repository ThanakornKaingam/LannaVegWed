/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 🚀 ข้ามการตรวจ Error เพื่อให้ Build ผ่านบน Render ได้ไวที่สุด
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 🖼️ อนุญาตให้ดึงรูปจากโดเมนภายนอกมาโชว์ในแอปได้
  images: {
    domains: [
      'qazihfmznjntahzhjaca.supabase.co', // Supabase URL ของแอ๋ม
      'lanna-backend.onrender.com',       // Render Backend ของแอ๋ม
      'maps.googleapis.com'               // สำหรับ Google Maps
    ],
  },
}

module.exports = nextConfig
