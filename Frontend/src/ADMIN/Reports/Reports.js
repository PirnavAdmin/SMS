import React, { useState } from 'react';

const mockReports = {
  academic: [
    { rank: 1, student: 'Rohan Sharma', grade: 'Grade 10', percentage: '94.2%', status: 'Distinction' },
    { rank: 2, student: 'Kabir Mehta', grade: 'Grade 10', percentage: '91.8%', status: 'Distinction' },
    { rank: 3, student: 'Priya Patel', grade: 'Grade 11', percentage: '88.5%', status: 'First Class' },
    { rank: 4, student: 'Isha Nair', grade: 'Grade 10', percentage: '84.0%', status: 'First Class' },
  ],
  finance: [
    { category: 'Tuition Fee Collections', budget: '₹12,00,000', realized: '₹10,50,000', pending: '₹1,50,000' },
    { category: 'Transport Services', budget: '₹3,00,000', realized: '₹2,70,000', pending: '₹30,000' },
    { category: 'Lab & Computer Accs', budget: '₹1,50,000', realized: '₹1,45,000', pending: '₹5,000' },
  ]
};

function Reports() {
  const [activeReport, setActiveReport] = useState('academic');

  return (
    <>
      <section className="hero-panel">
        <div>
          <p className="section-label hero-label">Analytics & Audit</p>
          <h2>Welcome to Reports</h2>
          <p className="hero-copy">
            Aggregate student metrics into custom dashboards. Generate comprehensive reports regarding class performances, finance books, or overall attendance.
          </p>
        </div>
      </section>

      <section className="overview-grid">
        <article className="stat-card teal">
          <p>Saved Report Presets</p>
          <strong>12 Presets</strong>
          <span>Configured for quick pull</span>
        </article>
        <article className="stat-card gold">
          <p>Academic Audit Ratio</p>
          <strong>88.4%</strong>
          <span>Passing student threshold</span>
        </article>
        <article className="stat-card coral">
          <p>Financial Realization</p>
          <strong>92.1%</strong>
          <span>Collected billing invoices</span>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="section-label">Report Builder</p>
              <h3>Select Report Profile</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <button 
              type="button" 
              className={`nav-item ${activeReport === 'academic' ? 'active' : ''}`}
              onClick={() => setActiveReport('academic')}
            >
              <span>Academic Standings Report</span>
              <span className="nav-badge">Rankings</span>
            </button>

            <button 
              type="button" 
              className={`nav-item ${activeReport === 'finance' ? 'active' : ''}`}
              onClick={() => setActiveReport('finance')}
            >
              <span>Fee Collection Summary</span>
              <span className="nav-badge">Audited</span>
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button type="button" className="primary-button" style={{ flex: 1 }} onClick={() => alert('Exporting PDF file...')}>
              Download PDF
            </button>
            <button type="button" className="secondary-button" style={{ flex: 1 }} onClick={() => alert('Exporting Excel spreadsheet...')}>
              Download Excel
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="section-label">Data Preview</p>
              <h3>{activeReport === 'academic' ? 'Academic Performance Preview' : 'Fee Collections Preview'}</h3>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {activeReport === 'academic' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5ddd0', color: '#63737a' }}>
                    <th style={{ padding: '0.8rem' }}>Rank</th>
                    <th style={{ padding: '0.8rem' }}>Student</th>
                    <th style={{ padding: '0.8rem' }}>Grade</th>
                    <th style={{ padding: '0.8rem', textAlign: 'right' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReports.academic.map(r => (
                    <tr key={r.rank} style={{ borderBottom: '1px solid #e5ddd0' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 600 }}>{r.rank}</td>
                      <td style={{ padding: '0.8rem' }}>{r.student}</td>
                      <td style={{ padding: '0.8rem' }}>{r.grade}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 600, color: '#1f8f88' }}>{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5ddd0', color: '#63737a' }}>
                    <th style={{ padding: '0.8rem' }}>Billing Stream</th>
                    <th style={{ padding: '0.8rem' }}>Target</th>
                    <th style={{ padding: '0.8rem' }}>Realized</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReports.finance.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e5ddd0' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 600 }}>{r.category}</td>
                      <td style={{ padding: '0.8rem' }}>{r.budget}</td>
                      <td style={{ padding: '0.8rem', color: '#1f8f88', fontWeight: 600 }}>{r.realized}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </section>
    </>
  );
}

export default Reports;
