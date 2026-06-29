import React, { useEffect, useState } from "react";

const AddUniformFee = ({ onSave, editData }) => {
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [uniformName, setUniformName] = useState("");
  const [size, setSize] = useState("");
  const [gender, setGender] = useState("Male");
  const [fee, setFee] = useState("");

  const [errors, setErrors] = useState({
    academicYear: "",
    uniformName: "",
    size: "",
    fee: "",
  });

  useEffect(() => {
    if (editData) {
      setAcademicYear(editData.academicYear);
      setUniformName(editData.uniformName);
      setSize(editData.size);
      setGender(editData.gender);
      setFee(editData.fee);

      setErrors({
        academicYear: "",
        uniformName: "",
        size: "",
        fee: "",
      });
    }
  }, [editData]);

  const resetForm = () => {
    setAcademicYear("2024-2025");
    setUniformName("");
    setSize("");
    setGender("Male");
    setFee("");

    setErrors({
      academicYear: "",
      uniformName: "",
      size: "",
      fee: "",
    });
  };

  const handleSubmit = () => {
    let newErrors = {};

    if (!academicYear) {
      newErrors.academicYear = "Academic Year is required";
    }

    if (!uniformName) {
      newErrors.uniformName = "Uniform Name is required";
    }

    if (!size) {
      newErrors.size = "Size / Quantity is required";
    }

    if (!fee) {
      newErrors.fee = "Fee is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSave({
      academicYear,
      uniformName,
      size,
      gender,
      fee,
      createdBy: "admin@gmail.com",
    });

    resetForm();
  };

  return (
    <>
      <div className="section-header">Rs Student Uniform Fee Configuration</div>

      <div className="uniform-card">
        <div className="fee-form-grid">
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

          {/* Uniform Name */}
          <div className="form-group">
            <label>
              Name <span className="required">*</span>
            </label>

            <select
              className={errors.uniformName ? "error" : ""}
              value={uniformName}
              onChange={(e) => {
                setUniformName(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  uniformName: "",
                }));
              }}
            >
              <option value="">--- Select Name ---</option>
              <option value="Boys Dongri">Boys Dongri</option>
              <option value="Girls Dongri">Girls Dongri</option>
            </select>

            {errors.uniformName && (
              <span className="error-text">{errors.uniformName}</span>
            )}
          </div>

          {/* Size */}
          <div className="form-group">
            <label>
              Size / Quantity <span className="required">*</span>
            </label>

            <select
              className={errors.size ? "error" : ""}
              value={size}
              onChange={(e) => {
                setSize(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  size: "",
                }));
              }}
            >
              <option value="">--- Select Size ---</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
            </select>

            {errors.size && <span className="error-text">{errors.size}</span>}
          </div>

          {/* Gender */}
          <div className="gender-group">
            <label>
              <input
                type="radio"
                checked={gender === "Male"}
                onChange={() => setGender("Male")}
              />
              Male
            </label>

            <label>
              <input
                type="radio"
                checked={gender === "Female"}
                onChange={() => setGender("Female")}
              />
              Female
            </label>
          </div>

          {/* Fee */}
          <div className="form-group">
            <label>
              Fee <span className="required">*</span>
            </label>

            <input
              type="number"
              className={errors.fee ? "error" : ""}
              value={fee}
              onChange={(e) => {
                setFee(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  fee: "",
                }));
              }}
            />

            {errors.fee && <span className="error-text">{errors.fee}</span>}
          </div>

          {/* Buttons */}
          <div className="button-group">
            <button type="button" className="save-btn" onClick={handleSubmit}>
              {editData ? "Update" : "Save"}
            </button>

            <button type="button" className="clear-btn" onClick={resetForm}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddUniformFee;
