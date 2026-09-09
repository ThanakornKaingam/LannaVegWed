/**
 * components/ConfidenceBar.tsx
 * แถบแสดงค่าความมั่นใจ พร้อมสีตามระดับ
 */
import React from "react";

interface ConfidenceBarProps {
  confidence: number; // 0.0 - 1.0
  showLabel?: boolean;
}

export default function ConfidenceBar({ confidence, showLabel = true }: ConfidenceBarProps) {
  const percent = Math.round(confidence * 100 * 100) / 100; // เช่น 98.12

  // สีตามระดับความมั่นใจ
  const getColor = () => {
    if (percent >= 80) return { bg: "bg-green-500", text: "text-green-700", light: "bg-green-100" };
    if (percent >= 40) return { bg: "bg-yellow-500", text: "text-yellow-700", light: "bg-yellow-100" };
    return { bg: "bg-red-500", text: "text-red-700", light: "bg-red-100" };
  };

  const color = getColor();

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">ความมั่นใจ</span>
          <span className={`text-sm font-bold ${color.text}`}>{percent.toFixed(2)}%</span>
        </div>
      )}
      <div className={`w-full h-2.5 rounded-full ${color.light} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${color.bg} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
