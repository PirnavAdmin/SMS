import React, { useState } from 'react';
import { Check, GraduationCap, Menu } from 'lucide-react';
import { initialStudents } from '../studentData';
import './StudentInfo.css';

const defaultFilters = {
  academicYear: '2024-2025',
  orientation: 'State',
  className: 'All',
  section: 'A',
  syllabus: 'SSC',
  medium: 'English',
  campus: 'Non AC',
};

const SelectField = ({ label, name, value, options, onChange }) => (
  <label className="student-details-field">
    <span>{label}</span>
    <div className="student-details-select-wrap">
      <span className="student-details-select-icon" aria-hidden="true"><GraduationCap /></span>
      <select name={name} value={value} onChange={onChange}>
        {options.map((option) => <option key={option} value={option}>{option === 'All' ? '-- Select All --' : option}</option>)}
      </select>
    </div>
  </label>
);

function StudentInfo() {
  const [filters, setFilters] = useState(defaultFilters);
  const [showResults, setShowResults] = useState(false);

  const handleChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
    setShowResults(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowResults(true);
  };

  const handleCancel = () => {
    setFilters(defaultFilters);
    setShowResults(false);
  };

  const visibleStudents = initialStudents.filter((student) => {
    const matchesClass = filters.className === 'All' || student.grade === `Grade ${filters.className}`;
    return matchesClass && student.section === filters.section;
  });

  return (
    <div className="student-details-page">
      <section className="student-details-panel" aria-labelledby="student-details-title">
        <div className="student-details-header">
          <Menu aria-hidden="true" />
          <h3 id="student-details-title">Student Details</h3>
        </div>

        <form className="student-details-form" onSubmit={handleSubmit}>
          <div className="student-details-grid">
            <SelectField label="Academic" name="academicYear" value={filters.academicYear} options={['2024-2025', '2025-2026', '2026-2027']} onChange={handleChange} />
            <SelectField label="Orientation" name="orientation" value={filters.orientation} options={['State', 'CBSE', 'ICSE']} onChange={handleChange} />
            <SelectField label="Class" name="className" value={filters.className} options={['All', '9', '10', '11', '12']} onChange={handleChange} />
            <SelectField label="Section" name="section" value={filters.section} options={['A', 'B', 'C']} onChange={handleChange} />
            <SelectField label="Syllabus" name="syllabus" value={filters.syllabus} options={['SSC', 'CBSE', 'ICSE']} onChange={handleChange} />
            <SelectField label="Medium" name="medium" value={filters.medium} options={['English', 'Hindi', 'Telugu']} onChange={handleChange} />
            <SelectField label="Campus" name="campus" value={filters.campus} options={['Non AC', 'AC']} onChange={handleChange} />
          </div>

          <div className="student-details-actions">
            <button className="student-details-submit" type="submit"><Check />Get Student Data</button>
            <button className="student-details-cancel" type="button" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </section>

      {showResults && (
        <section className="student-details-results">
          <div className="student-details-results-header"><GraduationCap /><h3>Student List</h3><span>{visibleStudents.length}</span></div>
          <div className="student-details-table-wrap"><table><thead><tr><th>Admission No</th><th>Student Name</th><th>Class</th><th>Section</th><th>Contact</th><th>Status</th></tr></thead><tbody>
            {visibleStudents.map((student) => <tr key={student.rollNo}><td>{student.rollNo}</td><td>{student.name}</td><td>{student.grade}</td><td>{student.section}</td><td>{student.contact}</td><td>{student.status}</td></tr>)}
            {!visibleStudents.length && <tr><td className="student-details-empty" colSpan="6">There is no data to display.</td></tr>}
          </tbody></table></div>
        </section>
      )}
    </div>
  );
}

export default StudentInfo;
