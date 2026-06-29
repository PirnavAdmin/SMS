import React, { useState } from 'react';
import './AcademicYear.css'; 

const AcademicYearComponent = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [yearsList, setYearsList] = useState([
    { id: 1, name: '2022-2023', status: 'InActive', createdBy: 'Admin' },
    { id: 2, name: '2023-2024', status: 'Active', createdBy: 'Admin' },
    { id: 3, name: '2024-2025', status: 'Active', createdBy: 'Admin' },
  ]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!academicYear.trim()) return;

    const newYear = {
      id: Date.now(),
      name: academicYear,
      status: isActive ? 'Active' : 'InActive',
      createdBy: 'Admin'
    };

    setYearsList([...yearsList, newYear]);
    setAcademicYear('');
    setIsActive(true);
  };

  return (
    <div className="inner-content-wrapper">
      {/* 1. Academic Year input Form Card */}
      <div className="inner-card-section">
        <form onSubmit={handleSave} className="sub-academic-form">
          <div className="sub-form-row">
            <label className="sub-form-label">Academic Year <span className="sub-req">*</span></label>
            <input 
              type="text" 
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="sub-form-input" 
              placeholder="e.g., 2025-2026"
              required
            />
          </div>
          <div className="sub-form-row sub-checkbox-row">
            <input 
              type="checkbox" 
              id="isActiveSub" 
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="isActiveSub">Is Active?</label>
          </div>
          <div className="sub-form-buttons">
            <button type="submit" className="sub-btn-save">Save</button>
            <button type="button" onClick={() => setAcademicYear('')} className="sub-btn-clear">Clear</button>
          </div>
        </form>
      </div>

      {/* 2. Academic Year Details Table Card */}
      <div className="inner-card-section sub-table-section">
        <div className="sub-table-purple-header">
          <i className="fas fa-calendar-alt"></i> Academic Year Details
        </div>
        
        <div className="sub-table-controls">
          <div className="sub-entries">
            Show <select defaultValue="100"><option>100</option><option>50</option></select> entries
          </div>
          <div className="sub-search">
            Search: <input type="text" />
          </div>
        </div>

        <table className="sub-custom-table">
          <thead>
            <tr>
              <th>Academic Year Name</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {yearsList.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <span className={row.status === 'Active' ? 'sub-status-active' : 'sub-status-inactive'}>
                    {row.status}
                  </span>
                </td>
                <td>{row.createdBy}</td>
                <td>
                  <div className="sub-action-btns">
                    <button type="button" className="sub-edit-btn"><i className="fas fa-edit"></i> Edit</button>
                    <button type="button" className="sub-delete-btn"><i className="fas fa-trash"></i> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sub-footer-copyright">
          2026 © School.All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

export default AcademicYearComponent;