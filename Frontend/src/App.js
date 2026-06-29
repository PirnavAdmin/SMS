import React, { useState } from 'react';
import './App.css';

import Dashbaord from './ADMIN/Dashbaord/Dashbaord';
import Admissions from './ADMIN/Admissions/Admissions';
import StudentManagement from './ADMIN/Student Management/StudentManagement';
import FacultyManagement from './ADMIN/Faculity Management/FacultyManagement';
import Attendance from './ADMIN/Attendance/Attendance';
import Fee from './ADMIN/Fee/Fee';
import Communication from './ADMIN/Communication/Communication';
import ConfigSubViewer from './ADMIN/Configuration/ConfigSubViewer';
import Generate from './ADMIN/Generate/Generate';
import PromotionManagement from './ADMIN/Promotion Management/PromotionManagement';
import Reports from './ADMIN/Reports/Reports';
import Settings from './ADMIN/Settings/Settings';
import HostelBlocks from './ADMIN/Configuration/Hostel Blocks/HostelBlocks';
import HostelRooms from './ADMIN/Configuration/Hostel Rooms/HostelRooms';
import BusTimings from './ADMIN/Configuration/Bus Timings/BusTiming';
import BusStopNames from "./ADMIN/Configuration/Bus stop Names/BusStopNames";

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

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [configExpanded, setConfigExpanded] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
      // If it's a Config view but doesn't have a specific component, pass category to the viewer
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
      case 'Hostel Blocks':
        return <HostelBlocks />;
      case 'Hostel Rooms':
        return <HostelRooms />;
      case 'Bus Timings':
        return <BusTimings />;
      case 'Bus stop Names':
        return <BusStopNames />;
      default:
        return <Dashbaord />;
    }
  };

  return (
    <div className="admin-layout">
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

        <div className="profile-block">
          <div className="profile-info" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
            <div className="profile-avatar">AR</div>
            <div className="profile-details">
              <strong>Anita Rao</strong>
              <span>Super Admin</span>
            </div>
          </div>
          {profileMenuOpen && (
            <div className="profile-dropdown">
              <button 
                type="button" 
                onClick={() => { setActiveTab('Settings'); setProfileMenuOpen(false); }}
              >
                Settings
              </button>
              <button 
                type="button" 
                onClick={() => { alert('Logged out successfully!'); setProfileMenuOpen(false); }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="top-tab-bar">
          <div className="tab-title">
            <h2>{activeTab.startsWith('Config:') ? activeTab.substring(7) : activeTab}</h2>
          </div>
          <div className="tab-actions">
            <div className="search-box">
              <input type="text" placeholder="Search..." />
            </div>
            <button type="button" className="icon-button" onClick={() => alert('Notifications')}>🔔</button>
          </div>
        </header>
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;