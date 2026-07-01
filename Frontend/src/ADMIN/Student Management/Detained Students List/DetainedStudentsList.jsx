<<<<<<< HEAD
import React, { useMemo, useState } from 'react';
import { ListChecks, Search } from 'lucide-react';
import './DetainedStudentsList.css';
const records=[{id:'STD-103',name:'Kabir Sen',className:'11-A',reason:'Attendance below requirement',date:'25 Jun 2026',status:'Under Review'},{id:'STD-108',name:'Riya Das',className:'9-C',reason:'Academic performance review',date:'22 Jun 2026',status:'Detained'},{id:'STD-112',name:'Nikhil Roy',className:'10-B',reason:'Disciplinary committee decision',date:'18 Jun 2026',status:'Detained'}];
function DetainedStudentsList(){const[search,setSearch]=useState('');const visible=useMemo(()=>records.filter(r=>`${r.id} ${r.name} ${r.reason}`.toLowerCase().includes(search.toLowerCase())),[search]);return <div className="detained-list-page"><section className="detained-list-card"><div className="detained-list-title"><span><ListChecks /></span><h3>Detained Students List</h3></div><div className="detained-list-tools"><label>Show<select defaultValue="10"><option>10</option><option>25</option><option>50</option></select>entries</label><label><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."/></label></div><div className="detained-list-wrap"><table><thead><tr><th>Admission No</th><th>Student Name</th><th>Class</th><th>Reason</th><th>Detained Date</th><th>Status</th></tr></thead><tbody>{visible.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.name}</td><td>{r.className}</td><td>{r.reason}</td><td>{r.date}</td><td><span className={r.status==='Detained'?'detained':'review'}>{r.status}</span></td></tr>)}{!visible.length&&<tr><td colSpan="6" className="detained-list-empty">No detained students found.</td></tr>}</tbody></table></div><p>Showing {visible.length} of {records.length} entries</p></section></div>}
export default DetainedStudentsList;
=======
// import React from 'react';
// import './DetainedStudentsList.css';
// const DetainedStudentsList = () => <section className="student-management-page"><p className="student-management-page__eyebrow">Student Management</p><h2>Detained Students List</h2><div className="student-management-page__empty">Detained students list content goes here.</div></section>;
// export default DetainedStudentsList;
import  { useState } from "react";
import "./DetainedStudentsList.css";

function DetainedStudentsList() {
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [showData, setShowData] = useState(false);

  const detainedStudents = [
    {
      id: 1,
      admissionNo: "ADM001",
      name: "Rahul Sharma",
      className: "10",
      section: "A",
      reason: "Low attendance",
    },
    {
      id: 2,
      admissionNo: "ADM002",
      name: "Priya Verma",
      className: "9",
      section: "B",
      reason: "Fee pending",
    },
  ];

  const handleGetStudentData = () => {
    setShowData(true);
  };

  const handleCancel = () => {
    setAcademicYear("2024-2025");
    setShowData(false);
  };

  return (
    <div className="detained-wrapper">
      <div className="detained-box">
        <div className="detained-box-header">
          <span className="header-icon">☰</span>
          <span>Detained Student Details</span>
        </div>

        <div className="detained-form">
          <label>Academic Year</label>

          <div className="select-wrapper">
            <span className="select-icon">🎓</span>

            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
            </select>
          </div>
        </div>

        <div className="button-row">
          <button className="get-btn" onClick={handleGetStudentData}>
            ✓  Get Student Data
          </button>

          <button className="cancel-btn" onClick={handleCancel}>
              Cancel
          </button>
        </div>
      </div>

      <div className="detained-box list-box">
        <div className="detained-box-header">
          <span className="header-icon">🎓</span>
          <span>Detained Student List</span>
        </div>

        {!showData ? (
          <div className="no-data">There is no data to display</div>
        ) : (
          <div className="table-area">
            <table className="student-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Academic Year</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>
                {detainedStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.admissionNo}</td>
                    <td>{student.name}</td>
                    <td>{student.className}</td>
                    <td>{student.section}</td>
                    <td>{academicYear}</td>
                    <td>{student.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetainedStudentsList;
>>>>>>> cb7e19c1af487c0595f907f84cd1255ef15fb1af
