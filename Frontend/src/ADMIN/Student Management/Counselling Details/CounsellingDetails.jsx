import React, { useState } from "react";
import { Check, Menu } from "lucide-react";
import "./CounsellingDetails.css";

const students = [
  {
    rno: "RNO-1001",
    name: "Aarav Sharma",
    className: "Class 8 - A",
    counsellor: "Ms. Kavitha Rao",
    date: "26 Jun 2026",
    concern: "Needs support with exam anxiety and concentration.",
    actionPlan: "Weekly counselling session, breathing exercises, parent follow-up.",
    status: "In Progress",
  },
  {
    rno: "RNO-1002",
    name: "Diya Patel",
    className: "Class 9 - B",
    counsellor: "Mr. Naveen Kumar",
    date: "24 Jun 2026",
    concern: "Requested guidance for peer communication and confidence.",
    actionPlan: "Group activity participation and two-week observation.",
    status: "Follow Up",
  },
  {
    rno: "RNO-1003",
    name: "Kabir Reddy",
    className: "Class 10 - A",
    counsellor: "Ms. Asha Menon",
    date: "20 Jun 2026",
    concern: "Career stream selection discussion with academic performance review.",
    actionPlan: "Aptitude checklist shared, parent meeting scheduled.",
    status: "Completed",
  },
];

const CounsellingDetails = () => {
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);

  const handleGetStudent = () => {
    const searchText = studentSearch.trim().toLowerCase();
    const nextStudent = students.find((student) => {
      const optionText = `${student.rno} - ${student.name}`.toLowerCase();
      return (
        student.rno.toLowerCase() === searchText ||
        student.name.toLowerCase() === searchText ||
        optionText === searchText
      );
    });
    setStudentDetails(nextStudent || null);
  };

  const handleCancel = () => {
    setStudentSearch("");
    setStudentDetails(null);
  };

  return (
    <section className="counselling-details-page" aria-labelledby="counselling-details-title">
      <div className="counselling-panel">
        <div className="counselling-title-bar">
          <Menu aria-hidden="true" />
          <h3 id="counselling-details-title">Counselling Details</h3>
        </div>

        <form className="counselling-form" onSubmit={(event) => event.preventDefault()}>
          <label className="counselling-field">
            <span>RNo</span>
            <input
              type="search"
              list="counselling-students"
              value={studentSearch}
              onChange={(event) => {
                setStudentSearch(event.target.value);
                setStudentDetails(null);
              }}
              placeholder="Select Here"
              aria-label="RNo"
            />
            <datalist id="counselling-students">
              {students.map((student) => (
                <option key={student.rno} value={`${student.rno} - ${student.name}`} />
              ))}
            </datalist>
          </label>

          <div className="counselling-actions">
            <button
              className="counselling-get-student"
              type="button"
              onClick={handleGetStudent}
              disabled={!studentSearch.trim()}
            >
              <Check aria-hidden="true" />
              Get Student
            </button>
            <button
              className="counselling-cancel"
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>

        {studentDetails && (
          <div className="counselling-student-card">
            <div className="counselling-student-header">
              <div>
                <h4>{studentDetails.name}</h4>
                <p>{studentDetails.rno} | {studentDetails.className}</p>
              </div>
              <span className="counselling-status">{studentDetails.status}</span>
            </div>

            <dl className="counselling-details-grid">
              <div>
                <dt>Counsellor</dt>
                <dd>{studentDetails.counsellor}</dd>
              </div>
              <div>
                <dt>Last Session</dt>
                <dd>{studentDetails.date}</dd>
              </div>
              <div>
                <dt>Concern</dt>
                <dd>{studentDetails.concern}</dd>
              </div>
              <div>
                <dt>Action Plan</dt>
                <dd>{studentDetails.actionPlan}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </section>
  );
};

export default CounsellingDetails;
