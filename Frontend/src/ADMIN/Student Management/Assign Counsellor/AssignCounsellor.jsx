import React, { useState } from "react";
import "./AssignCounsellor.css";

function AssignCounsellor() {
  const academicYears = ["2024-2025", "2025-2026"];

  const classList = [
    "LKG", "UKG", "1st Class", "2nd Class", "3rd Class",
    "4th Class", "5th Class", "6th Class", "7th Class",
    "8th Class", "9th Class", "10th Class"
  ];

  const sectionList = ["A", "B", "C"];

  const [formData, setFormData] = useState({
    academicYear: "2024-2025",
    className: "",
    section: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCancel = () => {
    setFormData({
      academicYear: "2024-2025",
      className: "",
      section: "",
    });
  };

  return (
    <div className="assignPage">
      <div className="assignCard">
        <div className="assignHeader">
          <span className="assignIcon">☰</span>
          <span>Student Details</span>
        </div>

        <div className="assignBody">
          <div className="assignFormRow">
            <div className="assignField">
              <label>Academic</label>
              <div className="assignInputGroup">
                <span className="assignInputIcon">🎓</span>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                >
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="assignField">
              <label>Class</label>
              <div className="assignInputGroup">
                <span className="assignInputIcon">🎓</span>
                <select
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                >
                  <option value="">-- Class --</option>
                  {classList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="assignField">
              <label>Section</label>
              <div className="assignInputGroup">
                <span className="assignInputIcon">🎓</span>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                >
                  <option value="">-- Section --</option>
                  {sectionList.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="assignButtonRow">
            <button className="getStudentBtn">✓ Get Student Data</button>
            <button className="cancelBtn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="assignCard">
        <div className="assignHeader">
          <span className="assignIcon">☑</span>
          <span>Assign Students to Counsellor</span>
        </div>

        <div className="assignResultBody">
          <p>There is no data to display</p>
        </div>
      </div>
    </div>
  );
}

export default AssignCounsellor;