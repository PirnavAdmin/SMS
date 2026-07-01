import React, { useState } from "react";
import "./ParentOtpVerification.css";

function ParentOtpVerification() {
  const academicYears = ["2024-2025", "2025-2026"];
  const classList = ["LKG", "UKG", "1st Class", "2nd Class", "3rd Class", "4th Class", "5th Class", "6th Class", "7th Class", "8th Class", "9th Class", "10th Class"];
  const sectionList = ["A", "B", "C"];
  const feeTypes = ["Tuition Fee", "Transport Fee", "Exam Fee", "Admission Fee"];

  const [formData, setFormData] = useState({
    academicYear: "2024-2025",
    className: "",
    section: "",
    feeName: "",
  });

  const [message, setMessage] = useState("There is no data to display");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetStudentData = () => {
    setMessage("There is no data to display");
  };

  const handleCancel = () => {
    setFormData({
      academicYear: "2024-2025",
      className: "",
      section: "",
      feeName: "",
    });
    setMessage("There is no data to display");
  };

  return (
    <div className="otpPage">
      <div className="otpCard">
        <div className="otpCardHeader">
          <span className="otpHeaderIcon">☰</span>
          <span>Student Details</span>
        </div>

        <div className="otpCardBody">
          <div className="otpFormRow">
            <div className="otpField">
              <label>Academic</label>
              <div className="otpInputGroup">
                <span className="otpInputIcon">🎓</span>
                <select name="academicYear" value={formData.academicYear} onChange={handleChange}>
                  {academicYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>

            <div className="otpField">
              <label>Class</label>
              <div className="otpInputGroup">
                <span className="otpInputIcon">🎓</span>
                <select name="className" value={formData.className} onChange={handleChange}>
                  <option value="">-- Class --</option>
                  {classList.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>
            </div>

            <div className="otpField">
              <label>Section</label>
              <div className="otpInputGroup">
                <span className="otpInputIcon">🎓</span>
                <select name="section" value={formData.section} onChange={handleChange}>
                  <option value="">-- Section --</option>
                  {sectionList.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>
            </div>

            <div className="otpField">
              <label>FeeName</label>
              <div className="otpInputGroup">
                <span className="otpInputIcon">🎓</span>
                <select name="feeName" value={formData.feeName} onChange={handleChange}>
                  <option value="">-- FeeType --</option>
                  {feeTypes.map((fee) => <option key={fee} value={fee}>{fee}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="otpButtonRow">
            <button className="getStudentBtn" onClick={handleGetStudentData}>
              ✓ Get Student Data
            </button>
            <button className="cancelBtn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="otpCard">
        <div className="otpCardHeader">
          <span className="otpHeaderIcon">☑</span>
          <span>Parent OTP Verification</span>
        </div>

        <div className="otpResultBody">
          <div className="noDataMessage">{message}</div>
        </div>
      </div>
    </div>
  );
}

export default ParentOtpVerification;