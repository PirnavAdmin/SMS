import React, { useEffect, useState } from "react";

const AddUniformSettings = ({ onSave, editData }) => {
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [studentClass, setStudentClass] = useState("");
  const [uniforms, setUniforms] = useState([]);

  const [errors, setErrors] = useState({
    academicYear: "",
    studentClass: "",
    uniforms: "",
  });

  useEffect(() => {
    if (editData) {
      setAcademicYear(editData.academicYear);
      setStudentClass(editData.className);
      setUniforms(editData.uniforms);

      setErrors({
        academicYear: "",
        studentClass: "",
        uniforms: "",
      });
    }
  }, [editData]);

  const handleUniformChange = (e) => {
    const selectedUniforms = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );

    setUniforms(selectedUniforms);

    setErrors((prev) => ({
      ...prev,
      uniforms: "",
    }));
  };

  const resetForm = () => {
    setAcademicYear("2024-2025");
    setStudentClass("");
    setUniforms([]);

    setErrors({
      academicYear: "",
      studentClass: "",
      uniforms: "",
    });
  };

  const handleSubmit = () => {
    let newErrors = {};

    if (!academicYear) {
      newErrors.academicYear = "Academic Year is required";
    }

    if (!studentClass) {
      newErrors.studentClass = "Class is required";
    }

    if (uniforms.length === 0) {
      newErrors.uniforms = "Uniform is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSave({
      academicYear,
      className: studentClass,
      uniforms,
    });

    resetForm();
  };

  const handleClear = () => {
    resetForm();
  };

  return (
    <>
      <div className="section-header">Uniform Settings</div>

      <div className="uniform-card">
        <div className="form-row">
          {/* Academic Year */}
          <div className="form-group">
            <label>
              Academic Year <span className="required">*</span>
            </label>

            <select
              className={errors.academicYear ? "error" : ""}
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  academicYear: "",
                }));
              }}
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>

            {errors.academicYear && (
              <span className="error-text">{errors.academicYear}</span>
            )}
          </div>

          {/* Class */}
          <div className="form-group">
            <label>
              Class <span className="required">*</span>
            </label>

            <select
              className={errors.studentClass ? "error" : ""}
              value={studentClass}
              onChange={(e) => {
                setStudentClass(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  studentClass: "",
                }));
              }}
            >
              <option value="">---Select---</option>
              <option value="Nursery">Nursery</option>
              <option value="LKG">LKG</option>
              <option value="UKG">UKG</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
            </select>

            {errors.studentClass && (
              <span className="error-text">{errors.studentClass}</span>
            )}
          </div>

          {/* Uniform */}
          <div className="form-group uniform-group">
            <label>
              Uniform <span className="required">*</span>
            </label>

            <select
              multiple
              value={uniforms}
              onChange={handleUniformChange}
              className={`uniform-select ${errors.uniforms ? "error" : ""}`}
            >
              <option value="Boys Dongri-12">Boys Dongri-12</option>
              <option value="Boys Dongri-13">Boys Dongri-13</option>
              <option value="Boys Dongri-14">Boys Dongri-14</option>
            </select>

            {errors.uniforms && (
              <span className="error-text">{errors.uniforms}</span>
            )}
          </div>

          {/* Buttons */}
          <div className="button-group">
            <button type="button" className="save-btn" onClick={handleSubmit}>
              {editData ? "Update" : "Save"}
            </button>

            <button type="button" className="clear-btn" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddUniformSettings;
