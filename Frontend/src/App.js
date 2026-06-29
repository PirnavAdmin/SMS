<<<<<<< HEAD
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';

import AccountantDashboard from './ACCOUNTANT/AccountantDashboard';
import AdminDashboard from './ADMIN/AdminDashboard';
import HODDashboard from './HOD/HODDashboard';
import HostelWardenDashboard from './HOSTEL WARDEN/HostelWardenDashboard';
import HRDashboard from './HR/HRDashboard';
import LibrarianDashboard from './LIBRARIAN/LibrarianDashboard';
import Login from './Login';
import ParentDashboard from './PARENT/ParentDashboard';
import PrincipalDashboard from './PRINCIPAL/PrincipalDashboard';
import ProtectedRoute from './ProtectedRoute';
import StudentDashboard from './STUDENT/StudentDashboard';
import SuperAdminDashboard from './SUPER ADMIN/SuperAdminDashboard';
import TeacherDashboard from './TEACHER/TeacherDashboard';
import TransportManagerDashboard from './TRANSPORT MANAGER/TransportManagerDashboard';
import Unauthorized from './Unauthorized';
import { AuthProvider } from './AuthContext';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        path="/super-admin-dashboard"
        element={
          <ProtectedRoute allowedRole="super-admin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/principal-dashboard"
        element={
          <ProtectedRoute allowedRole="principal">
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod-dashboard"
        element={
          <ProtectedRoute allowedRole="hod">
            <HODDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent-dashboard"
        element={
          <ProtectedRoute allowedRole="parent">
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accountant-dashboard"
        element={
          <ProtectedRoute allowedRole="accountant">
            <AccountantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian-dashboard"
        element={
          <ProtectedRoute allowedRole="librarian">
            <LibrarianDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr-dashboard"
        element={
          <ProtectedRoute allowedRole="hr">
            <HRDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transport-dashboard"
        element={
          <ProtectedRoute allowedRole="transport-manager">
            <TransportManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hostel-dashboard"
        element={
          <ProtectedRoute allowedRole="hostel-warden">
            <HostelWardenDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
=======
import React, { useState } from "react";
import "./App.css";
import { FaSearch } from "react-icons/fa";

<<<<<<< HEAD
import Dashbaord from "./ADMIN/Dashbaord/Dashbaord";
import Admissions from "./ADMIN/Admissions/Admissions";
import StudentManagement from "./ADMIN/Student Management/StudentManagement";
import FacultyManagement from "./ADMIN/Faculity Management/FacultyManagement";
import Attendance from "./ADMIN/Attendance/Attendance";
import Fee from "./ADMIN/Fee/Fee";
import Communication from "./ADMIN/Communication/Communication";
import ConfigSubViewer from "./ADMIN/Configuration/ConfigSubViewer";
import Generate from "./ADMIN/Generate/Generate";
import PromotionManagement from "./ADMIN/Promotion Management/PromotionManagement";
import Reports from "./ADMIN/Reports/Reports";
import Settings from "./ADMIN/Settings/Settings";
=======
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
<<<<<<< HEAD
import HostelBlocks from './ADMIN/Configuration/Hostel Blocks/HostelBlocks';
import HostelRooms from './ADMIN/Configuration/Hostel Rooms/HostelRooms';

=======
import BusTimings from './ADMIN/Configuration/Bus Timings/BusTiming';
import BusStopNames from "./ADMIN/Configuration/Bus stop Names/BusStopNames";
>>>>>>> 5b38b7fa345dfb09af1bf9e192fa1024584a94c8
>>>>>>> 23dadab8849419e060ffbefdc53872d340eaf440

const navigationItems = [
  { name: "Dashboard", key: "Dashboard", badge: "04" },
  { name: "Admissions", key: "Admissions", badge: "12" },
  { name: "Student Management", key: "Student Management", badge: "128" },
  { name: "Faculty Management", key: "Faculty Management", badge: "18" },
  { name: "Attendance", key: "Attendance", badge: "09" },
  { name: "Fee", key: "Fee", badge: "07" },
  { name: "Communication", key: "Communication", badge: "06" },
  {
    name: "Configuration",
    key: "Configuration",
    badge: "18",
    isDropdown: true,
    subItems: [
      "Academic Year",
      "Bank Account Details",
      "Books Fee",
      "Bus Timings",
      "Bus stop Names",
      "Class",
      "Fee Master",
      "Holiday",
      "Hostel Blocks",
      "Hostel Rooms",
      "Medium",
      "Orientation",
      "Roles",
      "Section",
      "Syllabus types",
      "Uniform Fee",
      "Uniform settings",
      "Users",
    ],
  },
  { name: "Generate", key: "Generate", badge: "05" },
  { name: "Promotion Management", key: "Promotion Management", badge: "01" },
  { name: "Reports", key: "Reports", badge: "15" },
];

function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [configExpanded, setConfigExpanded] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleNavClick = (item) => {
    if (item.isDropdown) {
      setConfigExpanded(!configExpanded);
    } else {
      setActiveTab(item.key);
    }
  };
<<<<<<< HEAD
const configComponents = {
  "Hostel Blocks": HostelBlocks,
  "Hostel Rooms": HostelRooms,
};
=======
  
const configComponents = {
  "Bus stop Names": BusStopNames,
  "Bus Timings": BusTimings,
};
 
>>>>>>> 5b38b7fa345dfb09af1bf9e192fa1024584a94c8
  const renderActiveView = () => {
    if (activeTab.startsWith("Config:")) {
      const category = activeTab.substring(7);
       const component = configComponents[category];
      if (component) {
        return React.createElement(component);
<<<<<<< HEAD
      } 

=======
      }
 
>>>>>>> 5b38b7fa345dfb09af1bf9e192fa1024584a94c8
      return <ConfigSubViewer category={category} />;
    }



    switch (activeTab) {
      case "Dashboard":
        return <Dashbaord />;
      case "Admissions":
        return <Admissions />;
      case "Student Management":
        return <StudentManagement />;
      case "Faculty Management":
        return <FacultyManagement />;
      case "Attendance":
        return <Attendance />;
      case "Fee":
        return <Fee />;
      case "Communication":
        return <Communication />;
      case "Generate":
        return <Generate />;
      case "Promotion Management":
        return <PromotionManagement />;
      case "Reports":
        return <Reports />;
      case "Settings":
        return <Settings />;
      default:
        return <Dashbaord />;
<<<<<<< HEAD
        case 'Hostel Blocks':
          return <HostelBlocks />;
        case 'Hostel Rooms':
          return <HostelRooms />;
=======
        case 'Bus Timings':
          return <BusTimings />;
          case 'Bus stop Names':
            return <BusStopNames />;

>>>>>>> 5b38b7fa345dfb09af1bf9e192fa1024584a94c8
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
            const isConfigActive =
              activeTab.startsWith("Config:") && item.key === "Configuration";
            const isActive = activeTab === item.key || isConfigActive;
            return (
              <div key={item.key} className="nav-group">
                <button
                  type="button"
                  className={`nav-item${isActive ? " active" : ""}`}
                  onClick={() => handleNavClick(item)}
                >
                  <span>{item.name}</span>
                  <span className="nav-badge">
                    {item.isDropdown && configExpanded ? "▲" : item.badge}
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
                          className={`nav-subitem${isSubActive ? " active" : ""}`}
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
          <div
            className="profile-info"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          >
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
                onClick={() => {
                  setActiveTab("Settings");
                  setProfileMenuOpen(false);
                }}
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Logged out successfully!");
                  setProfileMenuOpen(false);
                }}
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
            <h2>
              {activeTab.startsWith("Config:")
                ? activeTab.substring(7)
                : activeTab}
            </h2>
          </div>
          <div className="tab-actions">
            <div className="search-box">
              <input type="text" placeholder="Search..." />
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => alert("Notifications")}
            >
              🔔
            </button>
          </div>
        </header>
        {renderActiveView()}
      </main>
    </div>
>>>>>>> d0f80c9a97e7ce28532d012c221c34933ea00091
  );
}

export default App;
