import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/api";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);       // 1=login, 2=otp, 3=forgot, 4=reset-otp, 5=new-password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ── Step 1: Login ──────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await authApi.login({ email, password });
      setInfo(data.message || "OTP sent to your email!");
      setStep(2);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  // ── Step 2: Verify OTP (login) ─────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { role } = await authApi.verifyOtp({ email, code: otp });
      login({ role }, email);
      if (role === "Admin") navigate("/admin");   // use 'role' directly
      else navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setInfo(""); setLoading(true);
    try {
      await authApi.login({ email, password });
      setInfo("New OTP sent to your email!");
    } catch { setError("Failed to resend OTP."); }
    finally { setLoading(false); }
  };

  // ── Step 3: Forgot — send OTP to email ────────────
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

  // ── Step 4: Verify OTP (forgot) ───────────────────
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

  // ── Step 5: Set new password ───────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      await authApi.resetPassword({ email: forgotEmail, code: otp, newPassword });
      setInfo("Password reset! Please login.");
      setStep(1);
      setForgotEmail(""); setOtp(""); setNewPassword("");
    } catch (err) {
      setError(err.message || "Reset failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">◈</span>
          <h1>InternHub</h1>
        </div>

        {/* ── STEP 1: Login ── */}
        {step === 1 && (
          <>
            <p className="auth-subtitle">Sign in to your account</p>
            {info && <p className="auth-info">{info}</p>}
            <form onSubmit={handleLogin} className="auth-form">
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
                <button type="button" className="btn-link" onClick={() => { setStep(3); setError(""); setInfo(""); }}>
                  Forgot password?
                </button>
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Sending OTP..." : "Continue →"}
              </button>
            </form>
            <p className="auth-link">Don't have an account? <Link to="/register">Register</Link></p>
          </>
        )}

        {/* ── STEP 2: OTP (login) ── */}
        {step === 2 && (
          <>
            <p className="auth-subtitle">Enter the OTP sent to</p>
            <p className="otp-email">{email}</p>
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
              <button className="btn-link" onClick={handleResend} disabled={loading}>Resend OTP</button>
            </div>
          </>
        )}

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
      </div>
    </div>
  );
}
