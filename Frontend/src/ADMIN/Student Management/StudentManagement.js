import React, { useState } from 'react';
import { initialStudents } from './studentData';

function StudentManagement() {
  const [students, setStudents] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || student.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const toggleStatus = (rollNo) => {
    setStudents(prev => prev.map(s => {
      if (s.rollNo === rollNo) {
        const nextStatus = s.status === 'Active' ? 'Inactive' : 'Active';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  return (
    <>
      <section className="hero-panel">
        <div>
          <p className="section-label hero-label">Student Records</p>
          <h2>Welcome to Student Management</h2>
          <p className="hero-copy">
            Search, edit, filter, and monitor active enrollments, check contact numbers, modify student profiles, and update status codes.
          </p>
        </div>

        <div className="hero-actions">
          <button type="button" className="primary-button" onClick={() => alert('New Student Profile wizard')}>
            Add New Student
          </button>
        </div>
      </section>

      <section className="overview-grid">
        <article className="stat-card teal">
          <p>Total Registered Students</p>
          <strong>{students.length}</strong>
          <span>In active database</span>
        </article>
        <article className="stat-card gold">
          <p>Active Status</p>
          <strong>{students.filter(s => s.status === 'Active').length}</strong>
          <span>Attending classes</span>
        </article>
        <article className="stat-card coral">
          <p>On Leave / Inactive</p>
          <strong>{students.filter(s => s.status !== 'Active').length}</strong>
          <span>Suspended or Inactive</span>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="panel panel-wide">
          <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="section-label">Database Lookup</p>
              <h3>Student Directory</h3>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Search name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  border: '1px solid #d2d7d4', 
                  borderRadius: '999px', 
                  padding: '0.5rem 1.2rem', 
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#fffdf8'
                }}
              />

              <select 
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                style={{ 
                  border: '1px solid #d2d7d4', 
                  borderRadius: '999px', 
                  padding: '0.5rem 1.2rem', 
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#fffdf8'
                }}
              >
                <option value="All">All Grades</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5ddd0', color: '#63737a', fontSize: '0.9rem' }}>
                  <th style={{ padding: '1rem' }}>Roll No</th>
                  <th style={{ padding: '1rem' }}>Full Name</th>
                  <th style={{ padding: '1rem' }}>Grade</th>
                  <th style={{ padding: '1rem' }}>Section</th>
                  <th style={{ padding: '1rem' }}>Contact</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.rollNo} style={{ borderBottom: '1px solid #e5ddd0' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{student.rollNo}</td>
                    <td style={{ padding: '1rem' }}>{student.name}</td>
                    <td style={{ padding: '1rem' }}>{student.grade}</td>
                    <td style={{ padding: '1rem' }}>{student.section}</td>
                    <td style={{ padding: '1rem' }}>{student.contact}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className="status-pill" style={{
                        backgroundColor: student.status === 'Active' ? '#e5ecd2' : student.status === 'Suspended' ? '#ffebe9' : '#f0f0f0',
                        color: student.status === 'Active' ? '#405032' : student.status === 'Suspended' ? '#b94f46' : '#666'
                      }}>
                        {student.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        type="button" 
                        className="secondary-button" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                        onClick={() => toggleStatus(student.rollNo)}
                      >
                        Toggle Status
                      </button>
                      <button 
                        type="button" 
                        className="primary-button" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', boxShadow: 'none' }}
                        onClick={() => alert(`Editing student: ${student.name}`)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#63737a' }}>
                      No students found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}

export default StudentManagement;
