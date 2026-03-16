import React, { useState } from "react";

export default function Register() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (form.password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("สมัครใช้งานสำเร็จ! กำลังเข้าสู่ระบบ...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        setError(data.detail || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถติดต่อ Server ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${API_BASE}/auth/login/google`;
  };

  return (
    <>
      {/* Responsive styles via <style> tag — no external CSS needed */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }

        .reg-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #0f172a;
          padding: 16px;
        }

        .reg-card {
          background: #1e293b;
          border-radius: 14px;
          padding: 36px 32px;
          width: 100%;
          max-width: 420px;
          color: white;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .reg-title {
          text-align: center;
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .reg-alert {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 14px;
          text-align: center;
        }
        .reg-alert.error {
          background: rgba(220,38,38,0.15);
          border: 1px solid rgba(220,38,38,0.4);
          color: #fca5a5;
        }
        .reg-alert.success {
          background: rgba(34,197,94,0.15);
          border: 1px solid rgba(34,197,94,0.4);
          color: #86efac;
        }

        .reg-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .reg-row {
          display: flex;
          gap: 10px;
        }

        .reg-input {
          width: 100%;
          padding: 11px 13px;
          border-radius: 8px;
          border: 1px solid #334155;
          background: #0f172a;
          color: white;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
        }
        .reg-input:focus {
          border-color: #2563eb;
        }
        .reg-input::placeholder {
          color: #64748b;
        }

        .reg-btn-primary {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: none;
          background: #2563eb;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 4px;
          transition: background 0.2s;
          -webkit-appearance: none;
        }
        .reg-btn-primary:disabled {
          background: #64748b;
          cursor: not-allowed;
        }
        .reg-btn-primary:not(:disabled):hover {
          background: #1d4ed8;
        }

        .reg-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 18px 0 14px;
          color: #64748b;
          font-size: 13px;
        }
        .reg-divider-line {
          flex: 1;
          height: 1px;
          background: #334155;
        }

        .reg-btn-google {
          width: 100%;
          padding: 11px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: white;
          color: #1e293b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s;
          -webkit-appearance: none;
        }
        .reg-btn-google:hover {
          background: #f1f5f9;
        }

        .reg-footer {
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
          margin-top: 18px;
        }
        .reg-footer a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }

        /* Mobile adjustments */
        @media (max-width: 480px) {
          .reg-card {
            padding: 28px 20px;
            border-radius: 12px;
          }
          .reg-title {
            font-size: 20px;
          }
          .reg-input {
            font-size: 16px; /* prevents iOS zoom on focus */
            padding: 12px;
          }
          .reg-btn-primary {
            font-size: 16px;
            padding: 13px;
          }
        }
      `}</style>

      <div className="reg-page">
        <div className="reg-card">
          <h2 className="reg-title">สมัครใช้งาน</h2>

          {error && <div className="reg-alert error">{error}</div>}
          {success && <div className="reg-alert success">{success}</div>}

          <form className="reg-form" onSubmit={handleSubmit}>
            <div className="reg-row">
              <input
                className="reg-input"
                type="text"
                name="first_name"
                placeholder="ชื่อ"
                value={form.first_name}
                onChange={handleChange}
                required
              />
              <input
                className="reg-input"
                type="text"
                name="last_name"
                placeholder="นามสกุล"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <input
              className="reg-input"
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />

            <input
              className="reg-input"
              type="tel"
              name="phone"
              placeholder="เบอร์โทรศัพท์ (ไม่บังคับ)"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />

            <input
              className="reg-input"
              type="password"
              name="password"
              placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <input
              className="reg-input"
              type="password"
              name="confirm_password"
              placeholder="ยืนยันรหัสผ่าน"
              value={form.confirm_password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <button
              type="submit"
              className="reg-btn-primary"
              disabled={loading}
            >
              {loading ? "กำลังสมัคร..." : "สมัครใช้งาน"}
            </button>
          </form>

          <div className="reg-divider">
            <span className="reg-divider-line" />
            or
            <span className="reg-divider-line" />
          </div>

          <button
            type="button"
            className="reg-btn-google"
            onClick={handleGoogleRegister}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width="20"
              height="20"
            />
            Continue with Google
          </button>

          <p className="reg-footer">
            มีบัญชีอยู่แล้ว?{" "}
            <a href="/login">เข้าสู่ระบบ</a>
          </p>
        </div>
      </div>
    </>
  );
}
