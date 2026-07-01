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