import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/api";
import "../styles/auth.css";

// Password rules
const rules = [
  { id: "len",     label: "At least 8 characters",       test: (p) => p.length >= 8 },
  { id: "upper",   label: "One uppercase letter (A–Z)",   test: (p) => /[A-Z]/.test(p) },
  { id: "number",  label: "One number (0–9)",             test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One special character (!@#…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password) {
  const passed = rules.filter((r) => r.test(password)).length;
  if (passed === 0) return { score: 0, label: "", color: "" };
  if (passed === 1) return { score: 1, label: "Weak",      color: "#ff6b6b" };
  if (passed === 2) return { score: 2, label: "Fair",      color: "#f59e0b" };
  if (passed === 3) return { score: 3, label: "Good",      color: "#6ee7b7" };
  return             { score: 4, label: "Strong 💪",    color: "#c8f04d" };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Student" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getStrength(form.password);
  const allRulesPassed = rules.every((r) => r.test(form.password));
  const passwordsMatch = form.password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesPassed) { setError("Password does not meet all requirements."); return; }
    if (!passwordsMatch) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      await authApi.register(form);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">◈</span>
          <h1>InternHub</h1>
        </div>
        <p className="auth-subtitle">Create your account</p>

        <form onSubmit={handleSubmit} className="auth-form">

          {/* Name */}
          <div className="field">
            <label>Full Name</label>
            <input type="text" placeholder="Jane Smith" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          {/* Email */}
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>

          {/* Password */}
          <div className="field">
            <label>Password</label>
            <div className="input-eye-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {/* Strength bar */}
            {form.password.length > 0 && (
              <div className="strength-wrap">
                <div className="strength-bar">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="strength-segment"
                      style={{ background: i <= strength.score ? strength.color : "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
                <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}

            {/* Rules checklist */}
            {form.password.length > 0 && (
              <ul className="password-rules">
                {rules.map((r) => (
                  <li key={r.id} className={r.test(form.password) ? "rule-pass" : "rule-fail"}>
                    <span className="rule-icon">{r.test(form.password) ? "✓" : "✕"}</span>
                    {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirm Password */}
          <div className="field">
            <label>Confirm Password</label>
            <div className="input-eye-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  borderColor: confirmPassword.length > 0
                    ? passwordsMatch ? "#6ee7b7" : "#ff6b6b"
                    : undefined
                }}
              />
              <button type="button" className="eye-btn" onClick={() => setShowConfirm(p => !p)}>
                {showConfirm ? "🙈" : "👁"}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`confirm-msg ${passwordsMatch ? "confirm-ok" : "confirm-no"}`}>
                {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="Student">Student</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading || !allRulesPassed || !passwordsMatch}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
}
