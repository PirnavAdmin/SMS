import React, { useState } from 'react';

function Settings() {
  const [profile, setProfile] = useState({ name: 'Anita Rao', email: 'anita.rao@sms.edu', code: 'ADM-024' });
  const [notifications, setNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Preferences saved successfully!');
  };

  return (
    <>
      <section className="hero-panel">
        <div>
          <p className="section-label hero-label">Control Panel</p>
          <h2>Welcome to Settings</h2>
          <p className="hero-copy">
            Maintain your system credentials, configure automated broadcast targets, customize display theme options, and activate integration webhooks.
          </p>
        </div>
      </section>

      <section className="overview-grid">
        <article className="stat-card teal">
          <p>Login Status</p>
          <strong>Secure</strong>
          <span>Last active: 2 mins ago</span>
        </article>
        <article className="stat-card gold">
          <p>Server Latency</p>
          <strong>24 ms</strong>
          <span>Running on Cloud West</span>
        </article>
        <article className="stat-card coral">
          <p>API Tokens</p>
          <strong>2 Active</strong>
          <span>Automated backup running</span>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="section-label">Identity</p>
              <h3>Profile Settings</h3>
            </div>
          </div>

          <form className="admin-form" onSubmit={handleSave}>
            <label>
              Administrator Name
              <input 
                type="text" 
                value={profile.name} 
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </label>

            <label>
              System ID code
              <input type="text" value={profile.code} disabled style={{ opacity: 0.6, background: '#f5f5f5' }} />
            </label>

            <label className="full-span">
              Registered Email
              <input 
                type="email" 
                value={profile.email} 
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </label>

            <div className="form-actions full-span" style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="primary-button">
                Update Profile Info
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="section-label">Preferences</p>
              <h3>System Preferences</h3>
            </div>
          </div>

          <ul className="field-stack">
            <li className="field-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>In-App Notifications</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#63737a' }}>Get alerts on student registration approvals</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications} 
                onChange={() => setNotifications(!notifications)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </li>
            <li className="field-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Weekly Email Digest</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#63737a' }}>Receive automatic finance audits every Monday</p>
              </div>
              <input 
                type="checkbox" 
                checked={weeklyDigest} 
                onChange={() => setWeeklyDigest(!weeklyDigest)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </li>
            <li className="field-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Developer Sandboxing</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#63737a' }}>Enable testbed for mock payment data</p>
              </div>
              <span style={{ color: '#1f8f88', fontWeight: 600 }}>Active</span>
            </li>
          </ul>
        </article>
      </section>
    </>
  );
}

export default Settings;
