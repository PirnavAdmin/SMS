import React from 'react';
import { Link } from 'react-router-dom';

function Unauthorized() {
  return (
    <main className="auth-screen">
      <section className="login-panel unauthorized-panel">
        <span className="auth-kicker">Access denied</span>
        <h1>Unauthorized</h1>
        <p>Your signed-in role does not have access to this dashboard.</p>
        <Link className="primary-button" to="/">
          Return to login
        </Link>
      </section>
    </main>
  );
}

export default Unauthorized;
