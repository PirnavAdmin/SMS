import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../App.css';

import Dashbaord from './Dashbaord/Dashbaord';
import Admissions from './Admissions/Admissions';
import StudentManagement from './Student Management/StudentManagement';
import FacultyManagement from './Faculity Management/FacultyManagement';
import Attendance from './Attendance/Attendance';
import Fee from './Fee/Fee';
import Communication from './Communication/Communication';
import ConfigSubViewer from './Configuration/ConfigSubViewer';
import Generate from './Generate/Generate';
import PromotionManagement from './Promotion Management/PromotionManagement';
import Reports from './Reports/Reports';
import Settings from './Settings/Settings';
import HostelBlocks from './Configuration/Hostel Blocks/HostelBlocks';
import HostelRooms from './Configuration/Hostel Rooms/HostelRooms';
import BusTimings from './Configuration/Bus Timings/BusTiming';
import BusStopNames from "./Configuration/Bus stop Names/BusStopNames";

const navigationItems = [
  { name: 'Dashboard', key: 'Dashboard', badge: '04' },
  { name: 'Admissions', key: 'Admissions', badge: '12' },
  { name: 'Student Management', key: 'Student Management', badge: '128' },
  { name: 'Faculty Management', key: 'Faculty Management', badge: '18' },
  { name: 'Attendance', key: 'Attendance', badge: '09' },
  { name: 'Fee', key: 'Fee', badge: '07' },
  { name: 'Communication', key: 'Communication', badge: '06' },
  { 
    name: 'Configuration', 
    key: 'Configuration', 
    badge: '18',
    isDropdown: true,
    subItems: [
      'Academic Year',
      'Bank Account Details',
      'Books Fee',
      'Bus Timings',
      'Bus stop Names',
      'Class',
      'Fee Master',
      'Holiday',
      'Hostel Blocks',
      'Hostel Rooms',
      'Medium',
      'Orientation',
      'Roles',
      'Section',
      'Syllabus types',
      'Uniform Fee',
      'Uniform settings',
      'Users'
    ]
  },
  { name: 'Generate', key: 'Generate', badge: '05' },
  { name: 'Promotion Management', key: 'Promotion Management', badge: '01' },
  { name: 'Reports', key: 'Reports', badge: '15' },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [configExpanded, setConfigExpanded] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('admin-theme') === 'dark'
  );

  useEffect(() => {
    localStorage.setItem('admin-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleNavClick = (item) => {
    if (item.isDropdown) {
      setConfigExpanded(!configExpanded);
    } else {
      setActiveTab(item.key);
    }
  };
const configComponents = {
  "Hostel Blocks": HostelBlocks,
  "Hostel Rooms": HostelRooms,
  "Bus stop Names": BusStopNames,
  "Bus Timings": BusTimings,
};

  const renderActiveView = () => {
    if (activeTab.startsWith('Config:')) {
      const category = activeTab.substring(7);
      const component = configComponents[category];
      if (component) {
        return React.createElement(component);
      }

      return <ConfigSubViewer category={category} />;
    }



    switch (activeTab) {
      case 'Dashboard':
        return <Dashbaord />;
      case 'Admissions':
        return <Admissions />;
      case 'Student Management':
        return <StudentManagement />;
      case 'Faculty Management':
        return <FacultyManagement />;
      case 'Attendance':
        return <Attendance />;
      case 'Fee':
        return <Fee />;
      case 'Communication':
        return <Communication />;
      case 'Generate':
        return <Generate />;
      case 'Promotion Management':
        return <PromotionManagement />;
      case 'Reports':
        return <Reports />;
      case 'Settings':
        return <Settings />;
      default:
        return <Dashbaord />;
    }
  };

  return (
    <div className={`admin-layout${isDarkMode ? ' theme-dark' : ''}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-badge">SM</div>
          <div>
            <p className="section-label">School Manager</p>
            <h1>Admin Hub</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Admin menu">
          {navigationItems.map((item) => {
            const isConfigActive = activeTab.startsWith('Config:') && item.key === 'Configuration';
            const isActive = activeTab === item.key || isConfigActive;
            return (
              <div key={item.key} className="nav-group">
                <button
                  type="button"
                  className={`nav-item${isActive ? ' active' : ''}`}
                  onClick={() => handleNavClick(item)}
                >
                  <span>{item.name}</span>
                  <span className="nav-badge">
                    {item.isDropdown && configExpanded ? '▲' : item.badge}
                  </span>
                </button>
                
                {item.isDropdown && configExpanded && (
                  <div className="nav-submenu">
                    {item.subItems.map((sub) => {
                      const isSubActive = activeTab === `Config:${sub}`;
                      return (
                        <button
                          key={sub}
                          type="button"
                          className={`nav-subitem${isSubActive ? ' active' : ''}`}
                          onClick={() => setActiveTab(`Config:${sub}`)}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

      </aside>

      <main className="dashboard-main">
        <header className="top-tab-bar">
          <div className="tab-title">
            <h2>{activeTab.startsWith('Config:') ? activeTab.substring(7) : activeTab}</h2>
          </div>
          <div className="tab-actions">
            <div className="top-search-box">
              <svg className="top-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input type="search" placeholder="Search..." aria-label="Search admin portal" />
            </div>
            <button
              type="button"
              className="icon-button notification-button"
              aria-label={notifications.length ? `${notifications.length} notifications` : 'No new notifications'}
              onClick={() => alert(notifications.length ? notifications.join('\n') : 'No new notifications')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
              {notifications.length > 0 && (
                <span className="notification-count">
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              )}
            </button>
            <button
              type="button"
              className="icon-button theme-toggle-button"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
              onClick={() => setIsDarkMode((current) => !current)}
            >
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
                </svg>
              )}
            </button>
            <div className="profile-block top-profile-block">
              <button
                type="button"
                className="profile-info"
                aria-expanded={profileMenuOpen}
                aria-label="Open administrator menu"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div className="profile-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                  </svg>
                </div>
                <div className="profile-details">
                  <strong>Admin</strong>
                  <span>Administrator</span>
                </div>
                <svg className="profile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </button>
              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <button type="button" onClick={() => { setActiveTab('Settings'); setProfileMenuOpen(false); }}>
                    Settings
                  </button>
                  <button type="button" onClick={() => { logout(); setProfileMenuOpen(false); navigate('/login', { replace: true }); }}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="dashboard-content">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
