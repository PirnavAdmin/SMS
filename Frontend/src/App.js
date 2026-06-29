import React, { useState } from "react";
import "./App.css";

// 1. ACADEMIC YEAR COMPONENT (Included internally here, so import errors are prevented)
function AcademicYearComponent() {
  const [academicYear, setAcademicYear] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  
  const [yearsList, setYearsList] = useState([
    { id: 1, name: "2022-2023", status: "InActive", createdBy: "Admin" },
    { id: 2, name: "2023-2024", status: "Active", createdBy: "Admin" },
    { id: 3, name: "2024-2025", status: "Active", createdBy: "Admin" },
  ]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!academicYear.trim()) return;

    if (editId) {
      const updatedList = yearsList.map((item) =>
        item.id === editId
          ? { ...item, name: academicYear, status: isActive ? "Active" : "InActive" }
          : item
      );
      setYearsList(updatedList);
      setEditId(null);
    } else {
      const newYear = {
        id: Date.now(),
        name: academicYear,
        status: isActive ? "Active" : "InActive",
        createdBy: "Admin"
      };
      setYearsList([...yearsList, newYear]);
    }
    setAcademicYear("");
    setIsActive(true);
  };

  const handleEdit = (item) => {
    setAcademicYear(item.name);
    setIsActive(item.status === "Active");
    setEditId(item.id);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this academic year?")) {
      setYearsList(yearsList.filter((item) => item.id !== id));
      if (editId === id) {
        setAcademicYear("");
        setIsActive(true);
        setEditId(null);
      }
    }
  };

  const filteredYears = yearsList.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search) ||
      item.createdBy.toLowerCase().includes(search)
    );
  });

  return (
    <div className="inner-content-wrapper">
      <style>{`
        .inner-content-wrapper { width: 100%; padding: 5px 0; }
        .inner-card-section { background: #ffffff !important; border: 1px solid #dcdcdc !important; border-radius: 4px; padding: 25px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .sub-form-row { display: flex; align-items: center; margin-bottom: 15px; }
        .sub-form-label { width: 150px; font-size: 13px; color: #333; text-align: right; margin-right: 15px; font-weight: bold; }
        .sub-req { color: red; font-weight: bold; }
        .sub-form-input { width: 250px; padding: 6px 10px; border: 1px solid #ccc; border-radius: 3px; outline: none; }
        .sub-checkbox-row { padding-left: 165px; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; }
        .sub-form-buttons { padding-left: 165px; display: flex; gap: 10px; }
        .sub-btn-save { background-color: #224abe !important; color: white !important; border: none; padding: 7px 18px; font-size: 13px; border-radius: 3px; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; }
        .sub-btn-update { background-color: #2e7d32 !important; color: white !important; border: none; padding: 7px 18px; font-size: 13px; border-radius: 3px; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; }
        .sub-btn-clear { background-color: #fff !important; color: #333 !important; border: 1px solid #ccc !important; padding: 7px 18px; font-size: 13px; border-radius: 3px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .sub-table-section { padding: 0 !important; overflow: hidden; }
        .sub-table-purple-header { background-color: #6339a8 !important; color: white !important; padding: 12px 15px; font-size: 14px; font-weight: bold; }
        .sub-table-controls { display: flex; justify-content: space-between; align-items: center; padding: 15px; font-size: 13px; }
        .sub-table-controls select { padding: 4px 8px; border: 1px solid #ccc; border-radius: 3px; outline: none; }
        .sub-search { display: flex; align-items: center; gap: 5px; }
        .search-input-wrapper { display: flex; align-items: center; border: 1px solid #ccc; border-radius: 3px; padding: 4px 8px; background: #fff; }
        .search-input-wrapper input { border: none; outline: none; font-size: 13px; width: 160px; }
        .search-input-wrapper i { color: #888; font-size: 13px; margin-right: 5px; }
        .sub-custom-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .sub-custom-table th, .sub-custom-table td { border: 1px solid #e2e8f0 !important; padding: 12px 15px; text-align: left; }
        .sub-custom-table th { background-color: #f7fafc !important; color: #2b4c97 !important; font-weight: bold; }
        .sub-custom-table tbody tr:nth-child(even) { background-color: #fcfdfe; }
        .sub-status-active { color: #2e7d32; font-weight: bold; }
        .sub-status-inactive { color: #c62828; font-weight: bold; }
        .sub-action-btns { display: flex; gap: 6px; }
        .sub-edit-btn { background-color: #f0ad4e !important; border: none; color: white !important; padding: 6px 12px; cursor: pointer; border-radius: 3px; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
        .sub-delete-btn { background-color: #d9534f !important; border: none; color: white !important; padding: 6px 12px; cursor: pointer; border-radius: 3px; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
        .sub-no-records { text-align: center !important; color: #888; font-style: italic; padding: 20px !important; }
        .sub-footer-copyright { text-align: center; font-size: 11px; color: #777; padding: 15px; border-top: 1px solid #e2e8f0; background-color: #fff; margin-top: 20px; }
      `}</style>

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
            <label htmlFor="isActiveSub" style={{ fontSize: "13px", cursor: "pointer" }}>Is Active?</label>
          </div>
          <div className="sub-form-buttons">
            <button type="submit" className={editId ? "sub-btn-update" : "sub-btn-save"}>
              <i className={editId ? "fas fa-check" : "fas fa-save"}></i>
              {editId ? "Update" : "Save"}
            </button>
            <button type="button" onClick={() => { setAcademicYear(""); setEditId(null); setIsActive(true); }} className="sub-btn-clear">
              <i className="fas fa-eraser"></i> Clear
            </button>
          </div>
        </form>
      </div>

      <div className="inner-card-section sub-table-section">
        <div className="sub-table-purple-header">Academic Year Details</div>
        <div className="sub-table-controls">
          <div className="sub-entries">
            Show <select defaultValue="100"><option>100</option><option>50</option></select> entries
          </div>
          <div className="sub-search">
            <span>Search:</span>
            <div className="search-input-wrapper">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search here..."
              />
            </div>
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
            {filteredYears.length > 0 ? (
              filteredYears.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>
                    <span className={row.status === "Active" ? "sub-status-active" : "sub-status-inactive"}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.createdBy}</td>
                  <td>
                    <div className="sub-action-btns">
                      <button type="button" className="sub-edit-btn" onClick={() => handleEdit(row)}>
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button type="button" className="sub-delete-btn" onClick={() => handleDelete(row.id)}>
                        <i className="fas fa-trash-alt"></i> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="sub-no-records">No matching records found</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="sub-footer-copyright">2026 © School.All Rights Reserved.</div>
      </div>
    </div>
  );
}

// 2. MAIN APP COMPONENT
function App() {
  const [activeMenu, setActiveMenu] = useState("Configuration");
  const [activeSubMenu, setActiveSubMenu] = useState("Academic Year");

  const handleMenuClick = (menuName) => {
    if (activeMenu === menuName) {
      setActiveMenu(""); 
    } else {
      setActiveMenu(menuName);
    }
  };

  return (
    <div className="erp-main-wrapper">
      {/* Top Bar - Spans full width across the top of the screen */}
      <header className="erp-global-header">
        <div className="header-left">
          <i className="fas fa-bars toggle-menu-icon"></i>
          <span className="global-brand-title">School - ERP System</span>
        </div>
        <div className="header-right">
          <span className="admin-profile-text">Admin <i className="fas fa-caret-down"></i></span>
        </div>
      </header>

      {/* Sidebar + Main View Layout */}
      <div className="erp-body-layout">
        <aside className="erp-sidebar-panel">
          <nav className="sidebar-nav-menu">
            <div className="nav-menu-group">
              <button 
                className={`menu-nav-btn ${activeMenu === "Dashboard" ? "active-menu" : ""}`}
                onClick={() => { setActiveMenu("Dashboard"); setActiveSubMenu(""); }}
              >
                <div className="btn-left-content">
                  <i className="fas fa-tachometer-alt menu-icon"></i>
                  <span>Dashboard</span>
                </div>
              </button>
            </div>

            <div className="nav-menu-group">
              <button 
                className={`menu-nav-btn ${activeMenu === "Configuration" ? "active-menu" : ""}`}
                onClick={() => handleMenuClick("Configuration")}
              >
                <div className="btn-left-content">
                  <i className="fas fa-cogs menu-icon"></i>
                  <span>Configuration</span>
                </div>
                <i className={`fas ${activeMenu === "Configuration" ? "fa-chevron-down" : "fa-chevron-right"} arrow-indicator`}></i>
              </button>
              
              {activeMenu === "Configuration" && (
                <div className="sidebar-submenu-list">
                  <button 
                    className={`submenu-nav-btn ${activeSubMenu === "Academic Year" ? "active-sub" : ""}`}
                    onClick={() => setActiveSubMenu("Academic Year")}
                  >
                    Academic Year
                  </button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Bank Account Details")}>Bank Account Details</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Books Fee")}>Books Fee</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Bus Timings")}>Bus Timings</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Bus stop Names")}>Bus stop Names</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Class")}>Class</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Fee Master")}>Fee Master</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Holiday")}>Holiday</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Hostel Blocks")}>Hostel Blocks</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Hostel Rooms")}>Hostel Rooms</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Medium")}>Medium</button>
                  <button className="submenu-nav-btn" onClick={() => setActiveSubMenu("Orientation")}>Orientation</button>
                </div>
              )}
            </div>

            <div className="nav-menu-group">
              <button className="menu-nav-btn" onClick={() => handleMenuClick("Admissions")}>
                <div className="btn-left-content">
                  <i className="fas fa-university menu-icon"></i>
                  <span>Admissions</span>
                </div>
                <i className="fas fa-chevron-right arrow-indicator"></i>
              </button>
            </div>
          </nav>
        </aside>

        <main className="erp-main-view">
          {/* Sub-header bar displaying Dashboard / Configuration path */}
          <div className="erp-top-breadcrumb">
            <i className="fas fa-user-cog"></i> 
            <span>Dashboard / {activeMenu} {activeSubMenu && `/ ${activeSubMenu}`}</span>
          </div>

          <div className="erp-view-container">
            {activeSubMenu === "Academic Year" ? (
              <AcademicYearComponent />
            ) : (
              <div style={{ background: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #dcdcdc' }}>
                <h2>{activeSubMenu || activeMenu || "Welcome"}</h2>
                <p>Welcome to the School Manager Dashboard.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;