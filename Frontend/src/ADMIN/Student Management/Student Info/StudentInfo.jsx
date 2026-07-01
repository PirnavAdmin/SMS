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