import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function SignInIcon({ className = "" }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M15 3.75h2.25A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.5 8.25 14.25 12l-3.75 3.75M14.25 12H4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SchoolIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m2 9 10-5 10 5-10 5L2 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 11.5V17c3.4 2.4 8.6 2.4 12 0v-5.5M22 9v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login, roles } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);

  const matchedRole = roles.find(
    (role) => role.email === email.trim().toLowerCase()
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }

    const result = login({ email: email.trim(), password });
    if (!result.ok) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setError(
        nextAttempts >= 3
          ? "Multiple unsuccessful attempts. Please verify your school credentials."
          : "Invalid email or password."
      );
      return;
    }

    setFailedAttempts(0);
    navigate(result.route, { replace: true });
  };

  return (
    <main className="auth-screen login-screen">
      <section className="theme-login-shell" aria-labelledby="login-title">
        <div className="login-brand-panel">
          <div className="login-brand-lockup">
            <span className="login-brand-mark"><SchoolIcon /></span>
            <div>
              <span className="login-brand-eyebrow">School Manager</span>
              <strong>Admin Hub</strong>
            </div>
          </div>

          <div className="login-welcome-copy">
            <span className="login-kicker">Smart school operations</span>
            <h1 id="login-title">School Management System</h1>
            <p>
              One secure workspace for academics, students, staff, fees,
              communication, and everyday school administration.
            </p>
          </div>

          <div className="login-feature-list" aria-label="Platform features">
            <span>Secure access</span>
            <span>Role-based dashboards</span>
            <span>Unified administration</span>
          </div>
        </div>

        <form className="theme-login-card" onSubmit={handleSubmit}>
          <div className="login-card-icon"><SignInIcon /></div>
          <div className="login-card-heading">
            <span>Welcome back</span>
            <h2>Sign in to your account</h2>
            <p>Enter your registered school credentials to continue.</p>
          </div>

          <div className="theme-login-form">
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                autoComplete="email"
                placeholder="name@sms.com"
              />
            </label>

            {matchedRole && (
              <p className="matched-role" aria-live="polite">
                Signing in as <strong>{matchedRole.label}</strong>
              </p>
            )}

            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </label>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="theme-login-button">
            <SignInIcon className="button-icon" />
            <span>Sign in to Dashboard</span>
          </button>

          <p className="login-security-note">
            Protected school portal · Authorized users only
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;
