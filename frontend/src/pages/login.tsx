import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/login/google`;
  };

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/";
      } else {
        alert(data.detail || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อ Server ได้ (ตรวจสอบ CORS หรือ URL)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }

        .login-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #0f172a;
          padding: 16px;
        }

        .login-card {
          background: #1e293b;
          padding: 36px 32px;
          border-radius: 12px;
          width: 100%;
          max-width: 380px;
          text-align: center;
          color: white;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .login-title {
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .login-input {
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
          margin-top: 10px;
        }
        .login-input:first-of-type {
          margin-top: 0;
        }
        .login-input:focus {
          border-color: #2563eb;
        }
        .login-input::placeholder {
          color: #64748b;
        }

        .login-btn-primary {
          width: 100%;
          padding: 12px;
          margin-top: 15px;
          border-radius: 8px;
          border: none;
          background: #2563eb;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          -webkit-appearance: none;
        }
        .login-btn-primary:disabled {
          background: #64748b;
          cursor: not-allowed;
        }
        .login-btn-primary:not(:disabled):hover {
          background: #1d4ed8;
        }

        .login-divider {
          margin: 20px 0;
          opacity: 0.5;
          font-size: 13px;
          color: #94a3b8;
        }

        .login-btn-google {
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
        .login-btn-google:hover {
          background: #f1f5f9;
        }

        .login-footer {
          margin-top: 20px;
          font-size: 13px;
          color: #94a3b8;
        }
        .login-footer a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
        .login-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 28px 20px;
          }
          .login-input {
            font-size: 16px;
            padding: 12px;
          }
          .login-btn-primary {
            font-size: 16px;
            padding: 13px;
          }
        }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          <h2 className="login-title">Sign In</h2>

          <form onSubmit={handleNormalLogin}>
            <input
              className="login-input"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="login-input"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="submit"
              className="login-btn-primary"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-divider">───── or ─────</div>

          <button
            type="button"
            className="login-btn-google"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width="20"
              height="20"
            />
            Continue with Google
          </button>

          {/* ✅ ลิงก์ไปหน้าสมัครสมาชิก */}
          <p className="login-footer">
            ยังไม่มีบัญชี?{" "}
            <a href="/register">สมัครใช้งาน</a>
          </p>
        </div>
      </div>
    </>
  );
}
