/**
 * components/ResultCard.tsx
 *
 * 🆕 แก้ไข: รองรับทั้ง 2 mode:
 *   1. mode เดิม — รับ PredictionResult (class_name + confidence) → ดึงจาก VEGETABLE_DATA
 *   2. mode ใหม่ — รับ TopCandidate ตรงจาก /predict/top3 → แสดงข้อมูลจาก API เลย
 */
import React from "react";
import { VEGETABLE_DATA } from "../data/vegetables";
import ConfidenceBar from "./ConfidenceBar";

type PredictionResult = {
  class_name: string;
  confidence: number;
};

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

interface ResultCardProps {
  result?: PredictionResult;
  candidate?: TopCandidate;  // 🆕 รับ candidate จาก Top 3
}

export default function ResultCard({ result, candidate }: ResultCardProps) {
  // 🆕 ถ้ามี candidate ให้ใช้ข้อมูลจาก API โดยตรง
  if (candidate) {
    return (
      <div className="ios-card p-8 mt-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            {candidate.thai_name}
          </h2>
          <p className="text-gray-500 italic mt-1">{candidate.scientific_name}</p>
          <div className="mt-3 max-w-xs mx-auto">
            <ConfidenceBar confidence={candidate.confidence} />
          </div>
        </div>

        <div className="h-px bg-gray-200 my-6" />

        {/* รูปภาพอ้างอิง */}
        {candidate.images && candidate.images.length > 0 && (
          <div className="flex justify-center gap-3 flex-wrap mb-6">
            {candidate.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt="vegetable"
                className="w-28 h-28 object-cover rounded-xl shadow border border-gray-100"
                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image")}
              />
            ))}
          </div>
        )}

        <div className="space-y-6 text-gray-800">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">📍 ชื่อท้องถิ่น</h4>
            <p className="text-gray-600">{candidate.local_name}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">🌱 ลักษณะทางพฤกษศาสตร์</h4>
            <p className="text-gray-600">{candidate.botanical_description}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">💊 สรรพคุณ</h4>
            <p className="text-gray-600">{candidate.properties}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">🍽 เมนูแนะนำ</h4>
            <p className="text-gray-600">{candidate.recommended_menu}</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Mode เดิม — ใช้ VEGETABLE_DATA
  if (!result) return null;

  const vegetable =
    result && VEGETABLE_DATA[result.class_name]
      ? VEGETABLE_DATA[result.class_name]
      : null;

  if (!vegetable) return null;

  return (
    <div className="ios-card p-8 mt-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          {vegetable.thai_name}
        </h2>
        <p className="text-gray-500 italic mt-1">{vegetable.scientific_name}</p>
        <div className="mt-2 text-sm text-gray-600">
          Confidence {(result.confidence * 100).toFixed(2)}%
        </div>
      </div>

      <div className="h-px bg-gray-200 my-6" />

      <div className="space-y-6 text-gray-800">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">📍 ชื่อท้องถิ่น</h4>
          <p className="text-gray-600">{vegetable.local_name}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">🌱 ลักษณะทางพฤกษศาสตร์</h4>
          <p className="text-gray-600">{vegetable.description}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">💊 สรรพคุณ</h4>
          <p className="text-gray-600">{vegetable.benefits}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">🍽 เมนูแนะนำ</h4>
          <ul className="list-disc list-inside text-gray-600">
            {vegetable.recommended_menu.map((menu: string, i: number) => (
              <li key={i}>{menu}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
