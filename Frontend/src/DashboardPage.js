import React from 'react';
import { useAuth } from './AuthContext';

function SignOutIcon({ className = '' }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 20.25H6.75A2.25 2.25 0 0 1 4.5 18V6a2.25 2.25 0 0 1 2.25-2.25H9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M14.25 8.25 18 12l-3.75 3.75M18 12H8.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  return 'Good evening';
};

const getWelcomeMessage = (role, greeting) => {
  const roleMessages = {
    'super-admin': 'welcome back, Super Admin. Wishing you a productive day ahead',
    admin: 'welcome back admin. Wishing you a smooth and productive day',
    principal: 'Welcome sir. Wishing you a pleasant and productive day',
    hod: 'welcome back sir. Wishing you a pleasant and productive day',
    teacher: 'welcome back teacher. Wishing you a wonderful day ahead',
    student: 'welcome back student. Wishing you a bright day of learning',
    parent: 'welcome back parent. We are glad to have you here',
    accountant: 'welcome back accountant. Wishing you a smooth day ahead',
    librarian: 'welcome back librarian. Wishing you a peaceful and productive day',
    hr: 'welcome back HR. Wishing you a smooth and productive day',
    'transport-manager': 'welcome back Transport Manager. Wishing you a safe and smooth day',
    'hostel-warden': 'welcome back Hostel Warden. Wishing you a peaceful and productive day',
  };

  return `${greeting}, ${roleMessages[role.id] || `welcome back ${role.label}`}.`;
};

function DashboardPage({ role }) {
  const { logout } = useAuth();
  const greeting = getGreeting();
  const welcomeMessage = getWelcomeMessage(role, greeting);

  return (
    <main className="dashboard-placeholder">
      <button
        type="button"
        className="signout-edge-button"
        onClick={logout}
        aria-label="Sign out"
        title="Sign out"
      >
        <SignOutIcon className="signout-edge-icon" />
        <span>Sign Out</span>
      </button>

      <section className="placeholder-panel">
        <div>
          <span className="auth-kicker">School Management System</span>
          <h1>{role.label} Dashboard</h1>
          <p>{welcomeMessage}</p>
        </div>
      </section>
    </main>
  );
}

export default DashboardPage;
