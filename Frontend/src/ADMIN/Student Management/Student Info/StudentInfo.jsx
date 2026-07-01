<<<<<<< HEAD
import React, { useMemo, useState } from 'react';
import { Edit2, Search, UserRound } from 'lucide-react';
import './StudentInfo.css';

const students = [
  { id: 'STD-101', name: 'Aarav Mehta', className: '10', section: 'A', gender: 'Male', phone: '+91 90123 45678', status: 'Active' },
  { id: 'STD-102', name: 'Isha Nair', className: '10', section: 'B', gender: 'Female', phone: '+91 91234 56789', status: 'Active' },
  { id: 'STD-103', name: 'Kabir Sen', className: '11', section: 'A', gender: 'Male', phone: '+91 92345 67890', status: 'Inactive' },
  { id: 'STD-104', name: 'Meera Rao', className: '12', section: 'A', gender: 'Female', phone: '+91 93456 78901', status: 'Active' },
];

function StudentInfo() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const visible = useMemo(() => students.filter((student) => {
    const matchesSearch = `${student.id} ${student.name} ${student.phone}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (classFilter === 'All' || student.className === classFilter);
  }), [search, classFilter]);

  return <div className="student-info-page"><section className="student-info-card"><div className="student-info-title"><span><UserRound /></span><h3>Student Management / Student Info</h3></div><div className="student-info-tools"><label>Class<select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}><option>All</option><option>10</option><option>11</option><option>12</option></select></label><label className="student-info-search"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..." /></label></div><div className="student-info-table-wrap"><table><thead><tr><th>Admission No</th><th>Student Name</th><th>Class</th><th>Section</th><th>Gender</th><th>Mobile</th><th>Status</th><th>Action</th></tr></thead><tbody>{visible.map((student) => <tr key={student.id}><td>{student.id}</td><td>{student.name}</td><td>{student.className}</td><td>{student.section}</td><td>{student.gender}</td><td>{student.phone}</td><td><span className={`student-info-status ${student.status.toLowerCase()}`}>{student.status}</span></td><td><button type="button"><Edit2 />Edit</button></td></tr>)}{!visible.length && <tr><td className="student-info-empty" colSpan="8">No students found.</td></tr>}</tbody></table></div><p className="student-info-count">Showing {visible.length} of {students.length} students</p></section></div>;
}
export default StudentInfo;
=======
import React from "react";
import "./StudentInfo.css";
import {
    FaGraduationCap,
    FaCheck,
} from "react-icons/fa";

const StudentInfo = () => {
    return (
        <div className="student-container">
            <div className="title-bar">
                <span className="menu-icon">☰</span>
                Student Details
            </div>

            <div className="form-container">
                <div className="form-grid">

                    <div className="form-group">
                        <label>Academic</label>
                        <div className="input-icon">
                            <FaGraduationCap className="icon" />
                            <select>
                                <option>Select</option>
                                <option>2024-2025</option>
                                <option>2025-2026</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Orientation</label>
                        <div className="input-icon">
                            <FaGraduationCap className="icon" />
                            <select>
                                <option>Select</option>
                                <option>State</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Class</label>
                        <div className="input-icon">
                            <FaGraduationCap className="icon" />
                            <select>
                                <option>-- Select All --</option>
                                <option>9th</option>
                                <option>10th</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Section</label>
                        <div className="input-icon">
                            <FaGraduationCap className="icon" />
                            <select>
                                <option>Select</option>
                                <option>A</option>
                                <option>B</option>
                                <option>C</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Syllabus</label>
                        <div className="input-icon">
                            <FaGraduationCap className="icon" />
                            <select>
                                <option>Select</option>
                                <option>SSC</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Medium</label>
                        <div className="input-icon">
                            <FaGraduationCap className="icon" />
                            <select>
                                <option>Select</option>
                                <option>English</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Campus</label>
                        <div className="input-icon">
                            <FaGraduationCap className="icon" />
                            <select>
                                <option>Select</option>
                                <option>AC</option>
                                <option>Non AC</option>
                            </select>
                        </div>
                    </div>

                </div>

                <div className="button-group">
                    <button className="btn-primary">
                        <FaCheck />
                        Get Student Data
                    </button>

                    <button className="btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentInfo;
>>>>>>> cb7e19c1af487c0595f907f84cd1255ef15fb1af
