import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/api";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const GOOGLE_URL = "https://internhub-api.onrender.com/api/auth/google";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("password");
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otpEmail, setOtpEmail] = useState("");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ── Password Tab: Direct Login ─────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await authApi.login({ email, password });
      login({ role: data.role }, email);
      if (data.role === "Admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  // ── OTP Tab: Step 1 — Send OTP ─────────────────────
  const handleSendLoginOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await authApi.sendLoginOtp(otpEmail);
      setInfo("OTP sent to your email!");
      setStep(2);
    } catch (err) {
      setError(err.message || "No account found with this email.");
    } finally { setLoading(false); }
  };

  // ── OTP Tab: Step 2 — Verify OTP ───────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { role } = await authApi.verifyOtp({ email: otpEmail, code: otp });
      login({ role }, otpEmail);
      if (role === "Admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  const handleResendLoginOtp = async () => {
    setError(""); setInfo(""); setLoading(true);
    try {
      await authApi.sendLoginOtp(otpEmail);
      setInfo("New OTP sent to your email!");
    } catch { setError("Failed to resend OTP."); }
    finally { setLoading(false); }
  };

  // ── Forgot Password: Step 3 ────────────────────────
  const handleForgotSend = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await authApi.forgotPassword(forgotEmail);
      setInfo("OTP sent! Check your email.");
      setStep(4);
    } catch (err) {
      setError(err.message || "Email not found.");
    } finally { setLoading(false); }
  };

  // ── Forgot Password: Step 4 — Verify OTP ──────────
  const handleForgotOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await authApi.verifyForgotOtp({ email: forgotEmail, code: otp });
      setInfo("OTP verified! Set your new password.");
      setStep(5);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  // ── Forgot Password: Step 5 — Reset ───────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      await authApi.resetPassword({ email: forgotEmail, code: otp, newPassword });
      setInfo("Password reset! Please login.");
      setStep(1);
      setTab("password");
      setForgotEmail(""); setOtp(""); setNewPassword("");
    } catch (err) {
      setError(err.message || "Reset failed.");
    } finally { setLoading(false); }
  };

  // ── Reusable Google Button ─────────────────────────
  const GoogleButton = () => (
    <>
      <div className="divider"><span>or</span></div>
      <button
        type="button"
        className="btn-google"
        onClick={() => window.location.href = GOOGLE_URL}
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        Continue with Google
      </button>
    </>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">◈</span>
          <h1>InternHub</h1>
        </div>

        {/* ── STEP 3: Forgot — enter email ── */}
        {step === 3 && (
          <>
            <p className="auth-subtitle">Reset your password</p>
            <p className="auth-hint">Enter your registered email and we'll send you an OTP.</p>
            <form onSubmit={handleForgotSend} className="auth-form">
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)} required />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Sending OTP..." : "Send Reset OTP →"}
              </button>
            </form>
            <div className="otp-footer">
              <button className="btn-link" onClick={() => { setStep(1); setError(""); }}>← Back to Login</button>
            </div>
          </>
        )}

        {/* ── STEP 4: Forgot — verify OTP ── */}
        {step === 4 && (
          <>
            <p className="auth-subtitle">Enter OTP</p>
            <p className="otp-email">{forgotEmail}</p>
            {info && <p className="auth-info">{info}</p>}
            <form onSubmit={handleForgotOtp} className="auth-form">
              <div className="field">
                <label>6-Digit OTP</label>
                <input type="text" placeholder="e.g. 482910" maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="otp-input" autoFocus required />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP →"}
              </button>
            </form>
            <div className="otp-footer">
              <button className="btn-link" onClick={() => { setStep(3); setError(""); setOtp(""); }}>← Change email</button>
              <button className="btn-link" onClick={handleForgotSend} disabled={loading}>Resend OTP</button>
            </div>
          </>
        )}

        {/* ── STEP 5: Set new password ── */}
        {step === 5 && (
          <>
            <p className="auth-subtitle">Set new password</p>
            {info && <p className="auth-info">{info}</p>}
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="field">
                <label>New Password</label>
                <div className="input-eye-wrap">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required autoFocus
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowNewPassword(p => !p)}>
                    {showNewPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password ✓"}
              </button>
            </form>
          </>
        )}

        {/* ── STEPS 1 & 2: Main Login UI ── */}
        {(step === 1 || step === 2) && (
          <>
            {/* Tabs — only on step 1 */}
            {step === 1 && (
              <div className="login-tabs">
                <button
                  className={`login-tab ${tab === "password" ? "active" : ""}`}
                  onClick={() => { setTab("password"); setError(""); setInfo(""); }}
                >
                  🔑 Password
                </button>
                <button
                  className={`login-tab ${tab === "otp" ? "active" : ""}`}
                  onClick={() => { setTab("otp"); setError(""); setInfo(""); }}
                >
                  📧 Email OTP
                </button>
              </div>
            )}

            {/* ── PASSWORD TAB ── */}
            {tab === "password" && step === 1 && (
              <>
                <p className="auth-subtitle">Sign in with your password</p>
                {info && <p className="auth-info">{info}</p>}
                <form onSubmit={handlePasswordLogin} className="auth-form">
                  <div className="field">
                    <label>Email</label>
                    <input type="email" placeholder="you@example.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <div className="input-eye-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPassword(p => !p)}>
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                  <div className="forgot-link-row">
                    <button type="button" className="btn-link"
                      onClick={() => { setStep(3); setError(""); setInfo(""); }}>
                      Forgot password?
                    </button>
                  </div>
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Logging in..." : "Login →"}
                  </button>
                </form>
                <GoogleButton />
              </>
            )}

            {/* ── EMAIL OTP TAB ── */}
            {tab === "otp" && step === 1 && (
              <>
                <p className="auth-subtitle">Sign in with a one-time code</p>
                <p className="auth-hint">Enter your email and we'll send you a 6-digit OTP. No password needed.</p>
                {info && <p className="auth-info">{info}</p>}
                <form onSubmit={handleSendLoginOtp} className="auth-form">
                  <div className="field">
                    <label>Email</label>
                    <input type="email" placeholder="you@example.com" value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)} required />
                  </div>
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send OTP →"}
                  </button>
                </form>
                <GoogleButton />
              </>
            )}

            {/* ── OTP VERIFY — Step 2 ── */}
            {step === 2 && (
              <>
                <p className="auth-subtitle">Enter the OTP sent to</p>
                <p className="otp-email">{otpEmail}</p>
                {info && <p className="auth-info">{info}</p>}
                <form onSubmit={handleVerifyOtp} className="auth-form">
                  <div className="field">
                    <label>6-Digit OTP</label>
                    <input type="text" placeholder="e.g. 482910" maxLength={6}
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="otp-input" autoFocus required />
                  </div>
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP & Sign In"}
                  </button>
                </form>
                <div className="otp-footer">
                  <button className="btn-link" onClick={() => { setStep(1); setError(""); setOtp(""); }}>← Change email</button>
                  <button className="btn-link" onClick={handleResendLoginOtp} disabled={loading}>Resend OTP</button>
                </div>
              </>
            )}

            <p className="auth-link">Don't have an account? <Link to="/register">Register</Link></p>
          </>
        )}
      </div>
    </div>
  );
}