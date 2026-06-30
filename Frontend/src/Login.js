import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function SignInIcon({ className = '' }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 3.75h2.25A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.5 8.25 14.25 12l-3.75 3.75M14.25 12H4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon({ className = '' }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.5 6.75 5.25 12l5.25 5.25M5.25 12H18.75"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login, roles } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCredentials, setShowCredentials] = useState(false);
  const matchedRole = roles.find(
    (role) => role.email === email.trim().toLowerCase()
  );

  const handleCloseCredentials = () => {
    setShowCredentials(false);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }

    const result = login({ email: email.trim(), password });
    if (!result.ok) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setError(
        nextAttempts >= 3
          ? 'Multiple unsuccessful attempts. Please verify your school credentials.'
          : 'Invalid email or password.'
      );
      return;
    }

    setFailedAttempts(0);
    navigate(result.route, { replace: true });
  };

  return (
    <main className="auth-screen login-screen">
      <section className="official-login-shell unified-login-shell" aria-labelledby="login-title">
        {!showCredentials && (
          <button
            type="button"
            className="signin-corner-badge"
            onClick={() => setShowCredentials(true)}
            aria-controls="login-credentials"
            aria-expanded={showCredentials}
          >
            <SignInIcon className="signin-corner-icon" />
            <span>Sign In</span>
          </button>
        )}

        <div className="system-brand">
          <h1 id="login-title">School Management System</h1>
        </div>

        {showCredentials && (
          <div className="unified-access-layout" id="login-credentials">
            <form className="position-panel login-portal-panel" onSubmit={handleSubmit}>
              <div className="panel-title login-panel-title">
                <h2>Enter Your Credentials</h2>
              </div>

              <div className="login-form">
                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError('');
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
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError('');
                    }}
                    autoComplete="current-password"
                  />
                </label>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="primary-button">
                <SignInIcon className="button-icon" />
                <span>Sign in to Dashboard</span>
              </button>

              <div className="login-back-row">
                <button
                  type="button"
                  className="panel-back-button"
                  onClick={handleCloseCredentials}
                  aria-label="Go back from sign in form"
                >
                  <BackIcon className="back-icon" />
                  <span>Back</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}

export default Login;
