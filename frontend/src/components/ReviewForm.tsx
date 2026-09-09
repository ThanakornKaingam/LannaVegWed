    import { useState } from "react";

    type Props = {
    className: string;
    onSuccess?: () => void;
    };

    const API = "http://localhost:8000";

    export default function ReviewForm({ className, onSuccess }: Props) {
    const [text, setText] = useState("");
    const [rating, setRating] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submitReview = async () => {
        if (!text) {
        setError("กรุณาเขียนรีวิวก่อน");
        return;
        }

        try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API}/reviews/`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            class_name: className,
            review_text: text,
            rating: rating,
            }),
        });

        if (!res.ok) throw new Error("ส่งรีวิวไม่สำเร็จ");

        setText("");
        setRating(5);

        if (onSuccess) onSuccess();
        } catch (err: any) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="ios-card p-6 fade-in">

        <h3 className="section-title mb-4">
            ✍️ เขียนรีวิว
        </h3>

        {/* ⭐ Rating */}
        <div className="flex gap-2 mb-4">
            {[1,2,3,4,5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-3xl transition ${
                rating >= star ? "star-active" : "star-inactive"
                }`}
            >
                ★
            </button>
            ))}
        </div>

        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="เขียนรีวิวของคุณ..."
            className="w-full border border-gray-200 rounded-2xl p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
        />

        {error && (
            <div className="text-red-500 mb-3">
            {error}
            </div>
        )}

        <button
            onClick={submitReview}
            disabled={loading}
            className="ios-button w-full"
        >
            {loading ? "กำลังส่ง..." : "ส่งรีวิว"}
        </button>

        </div>
    );
    }
