import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://lannavegwed-backend.onrender.com";

export default function Profile({ theme, toggleTheme }: any) {
  const { user, loading, refreshUser } = useAuth();

  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [tab, setTab] = useState<"info" | "password">("info");

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  if (loading) return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div style={styles.page}><p style={{ color: "var(--color-text-secondary)" }}>กำลังโหลด...</p></div>
    </>
  );

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  const handleInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr(""); setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ full_name: form.full_name, phone: form.phone }),
      });
      const data = await res.json();
      if (res.ok) { setMsg("บันทึกข้อมูลสำเร็จ"); refreshUser(); }
      else setErr(data.detail || "เกิดข้อผิดพลาด");
    } catch { setErr("ไม่สามารถเชื่อมต่อ server ได้"); }
    finally { setSaving(false); }
  };

  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    if (pwForm.new_password !== pwForm.confirm_password) { setPwErr("รหัสผ่านใหม่ไม่ตรงกัน"); return; }
    if (pwForm.new_password.length < 6) { setPwErr("รหัสผ่านต้องมีอย่างน้อย 6 ตัว"); return; }
    setSavingPw(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      });
      const data = await res.json();
      if (res.ok) { setPwMsg("เปลี่ยนรหัสผ่านสำเร็จ"); setPwForm({ current_password: "", new_password: "", confirm_password: "" }); }
      else setPwErr(data.detail || "เกิดข้อผิดพลาด");
    } catch { setPwErr("ไม่สามารถเชื่อมต่อ server ได้"); }
    finally { setSavingPw(false); }
  };

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div style={styles.page}>
        <div style={styles.card}>
          {/* Avatar + name */}
          <div style={styles.avatarRow}>
            <div style={styles.avatar}>{(user.full_name || user.email || "U")[0].toUpperCase()}</div>
            <div>
              <div style={styles.userName}>{user.full_name || "ผู้ใช้งาน"}</div>
              <div style={styles.userEmail}>{user.email}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.tabRow}>
            <button style={{ ...styles.tab, ...(tab === "info" ? styles.tabActive : {}) }} onClick={() => setTab("info")}>ข้อมูลส่วนตัว</button>
            <button style={{ ...styles.tab, ...(tab === "password" ? styles.tabActive : {}) }} onClick={() => setTab("password")}>เปลี่ยนรหัสผ่าน</button>
          </div>

          {/* Tab: Info */}
          {tab === "info" && (
            <form onSubmit={handleInfoSave} style={styles.form}>
              {msg && <div style={styles.successBox}>{msg}</div>}
              {err && <div style={styles.errorBox}>{err}</div>}
              <label style={styles.label}>ชื่อ-นามสกุล</label>
              <input style={styles.input} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="ชื่อ-นามสกุล" />
              <label style={styles.label}>อีเมล (ไม่สามารถแก้ไขได้)</label>
              <input style={{ ...styles.input, opacity: 0.5 }} value={form.email} disabled />
              <label style={styles.label}>เบอร์โทรศัพท์</label>
              <input style={styles.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="เบอร์โทรศัพท์" />
              <button type="submit" style={{ ...styles.btn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
            </form>
          )}

          {/* Tab: Password */}
          {tab === "password" && (
            <form onSubmit={handlePwSave} style={styles.form}>
              {pwMsg && <div style={styles.successBox}>{pwMsg}</div>}
              {pwErr && <div style={styles.errorBox}>{pwErr}</div>}
              {user.google_id && !user.password ? (
                <div style={styles.infoBox}>บัญชีนี้ใช้ Google Login ไม่สามารถเปลี่ยนรหัสผ่านได้</div>
              ) : (
                <>
                  <label style={styles.label}>รหัสผ่านปัจจุบัน</label>
                  <input style={styles.input} type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} placeholder="รหัสผ่านปัจจุบัน" required />
                  <label style={styles.label}>รหัสผ่านใหม่</label>
                  <input style={styles.input} type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" required />
                  <label style={styles.label}>ยืนยันรหัสผ่านใหม่</label>
                  <input style={styles.input} type="password" value={pwForm.confirm_password} onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} placeholder="ยืนยันรหัสผ่านใหม่" required />
                  <button type="submit" style={{ ...styles.btn, opacity: savingPw ? 0.7 : 1 }} disabled={savingPw}>
                    {savingPw ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0f172a", display: "flex", justifyContent: "center", padding: "40px 16px" },
  card: { background: "#1e293b", borderRadius: 14, padding: "36px 32px", width: "100%", maxWidth: 480, color: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", height: "fit-content" },
  avatarRow: { display: "flex", alignItems: "center", gap: 16, marginBottom: 28 },
  avatar: { width: 56, height: 56, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 18, fontWeight: 600 },
  userEmail: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  tabRow: { display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #334155", paddingBottom: 0 },
  tab: { padding: "8px 16px", borderRadius: "8px 8px 0 0", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: 500 },
  tabActive: { background: "#0f172a", color: "#ffffff", borderBottom: "2px solid #2563eb" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 13, color: "#94a3b8", marginBottom: -4 },
  input: { padding: "11px 13px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "white", fontSize: 15, outline: "none", boxSizing: "border-box" as const, width: "100%" },
  btn: { marginTop: 8, padding: "12px", borderRadius: 8, border: "none", background: "#2563eb", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  successBox: { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#86efac", padding: "10px 14px", borderRadius: 8, fontSize: 13 },
  errorBox: { background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5", padding: "10px 14px", borderRadius: 8, fontSize: 13 },
  infoBox: { background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#93c5fd", padding: "10px 14px", borderRadius: 8, fontSize: 13 },
};
