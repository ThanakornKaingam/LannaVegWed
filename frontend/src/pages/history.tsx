import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://lannavegwed-backend.onrender.com";

interface ClassifyRecord {
  id: number;
  vegetable_name: string;
  confidence: number;
  image_url?: string;
  created_at: string;
}

export default function History({ theme, toggleTheme }: any) {
  const { user, loading } = useAuth();
  const [records, setRecords] = useState<ClassifyRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setFetching(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/my-classifications`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setRecords(Array.isArray(data) ? data : data.results || []);
        } else {
          setError("ไม่สามารถโหลดประวัติได้");
        }
      } catch {
        setError("ไม่สามารถเชื่อมต่อ server ได้");
      } finally {
        setFetching(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (loading) return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div style={styles.page}><p style={{ color: "#94a3b8" }}>กำลังโหลด...</p></div>
    </>
  );

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>ประวัติการจำแนกของฉัน</h1>
          <p style={styles.subtitle}>แสดงเฉพาะการจำแนกของ {user.full_name || user.email}</p>

          {fetching && <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 40 }}>กำลังโหลด...</p>}
          {error && <div style={styles.errorBox}>{error}</div>}

          {!fetching && !error && records.length === 0 && (
            <div style={styles.emptyBox}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
              <div>ยังไม่มีประวัติการจำแนก</div>
              <a href="/classify" style={styles.classifyLink}>เริ่มจำแนกผักได้เลย</a>
            </div>
          )}

          {!fetching && records.length > 0 && (
            <div style={styles.grid}>
              {records.map((r) => (
                <div key={r.id} style={styles.card}>
                  {r.image_url && (
                    <img src={r.image_url} alt={r.vegetable_name} style={styles.cardImg} />
                  )}
                  {!r.image_url && (
                    <div style={styles.cardImgPlaceholder}>🌱</div>
                  )}
                  <div style={styles.cardBody}>
                    <div style={styles.cardName}>{r.vegetable_name}</div>
                    <div style={styles.cardConf}>
                      ความมั่นใจ:{" "}
                      <span style={{ color: r.confidence >= 0.7 ? "#4ade80" : r.confidence >= 0.4 ? "#fbbf24" : "#f87171", fontWeight: 600 }}>
                        {(r.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={styles.cardDate}>
                      {new Date(r.created_at).toLocaleDateString("th-TH", {
                        year: "numeric", month: "long", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0f172a", padding: "40px 16px" },
  container: { maxWidth: 900, margin: "0 auto", color: "white" },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#94a3b8", marginBottom: 28 },
  errorBox: { background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5", padding: "12px 16px", borderRadius: 8, fontSize: 14 },
  emptyBox: { textAlign: "center", color: "#94a3b8", marginTop: 60, fontSize: 16 },
  classifyLink: { display: "inline-block", marginTop: 16, padding: "10px 24px", borderRadius: 8, background: "#16a34a", color: "white", textDecoration: "none", fontSize: 14, fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 },
  card: { background: "#1e293b", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" },
  cardImg: { width: "100%", height: 160, objectFit: "cover" },
  cardImgPlaceholder: { width: "100%", height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", fontSize: 40 },
  cardBody: { padding: "14px 16px" },
  cardName: { fontSize: 16, fontWeight: 600, marginBottom: 6 },
  cardConf: { fontSize: 13, color: "#94a3b8", marginBottom: 6 },
  cardDate: { fontSize: 12, color: "#64748b" },
};
