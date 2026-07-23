import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/use.auth.js";
import "../auth.from.scss";
import AnimatedBackground from "../../interview/components/AnimatedBackground";

const Register = () => {
  const navigate = useNavigate();
  const { Loading, handelRegister, handelVerifyOtp } = useAuth();

  // Step 1: registration form fields
  const [username, setusername] = useState("");
  const [email, setemail]       = useState("");
  const [password, setpassword] = useState("");
  const [registerError, setRegisterError] = useState(false);

  // Step 2: OTP
  const [otpStep, setOtpStep]   = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp]           = useState("");
  const [otpError, setOtpError] = useState(false);

  // ── Step 1: submit registration form ──────────────────────────────────────
  const handelsubmit = async (e) => {
    e.preventDefault();
    setRegisterError(false);
    const result = await handelRegister({ username, email, password });
    if (result && result.requiresOtp) {
      setPendingEmail(result.email);
      setOtpStep(true);
    } else {
      setRegisterError(true);
    }
  };

  // ── Step 2: submit OTP ────────────────────────────────────────────────────
  const handelOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError(false);
    const success = await handelVerifyOtp({ email: pendingEmail, otp });
    if (success) navigate("/app");
    else setOtpError(true);
  };

  if (Loading) {
    return (
      <main className="auth-page">
        <AnimatedBackground variant="auth" />
        <div className="auth-spinner" />
      </main>
    );
  }

  // ── OTP verification screen ───────────────────────────────────────────────
  if (otpStep) {
    return (
      <main className="auth-page">
        <AnimatedBackground variant="auth" />
        <div className="from-container">
          <div className="otp-header">
            <i className="ri-mail-check-line otp-icon" />
            <h1>Verify your email</h1>
            <p className="otp-sub">
              We sent a 6-digit code to <strong>{pendingEmail}</strong>.<br />
              It expires in 10 minutes.
            </p>
          </div>

          <form onSubmit={handelOtpSubmit}>
            <div className="input-group">
              <label htmlFor="otp">Verification code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="otp-input"
                autoFocus
              />
            </div>

            {otpError && (
              <div className="auth-error">
                <i className="ri-error-warning-line" />
                <span>Invalid or expired code. Please try again.</span>
              </div>
            )}

            <button className="button primary-button" type="submit">
              Verify &amp; Register
            </button>
          </form>

          <p>
            Wrong email?{" "}
            <button
              className="link-button"
              onClick={() => { setOtpStep(false); setOtp(""); setOtpError(false); }}
            >
              Go back
            </button>
          </p>
        </div>
      </main>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <main className="auth-page">
      <AnimatedBackground variant="auth" />
      <div className="from-container">
        <h1>Register</h1>
        <form onSubmit={handelsubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              onChange={(e) => setusername(e.target.value)}
              type="text"
              id="username"
              placeholder="username"
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              onChange={(e) => setemail(e.target.value)}
              type="email"
              id="email"
              placeholder="email"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              onChange={(e) => setpassword(e.target.value)}
              type="password"
              id="password"
              placeholder="password"
            />
          </div>
          {registerError && (
            <div className="auth-error">
              <i className="ri-error-warning-line" />
              <span>
                Registration failed. The username or email may already be in use.
              </span>
            </div>
          )}
          <button className="button primary-button">Register</button>
        </form>
        <p>
          Already have an account? <Link to={"/login"}>Login</Link>
        </p>
      </div>
    </main>
  );
};
export default Register;
