import React, { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaChalkboardTeacher,
  FaEdit,
  FaEraser,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import "./class.css";

const emptyForm = {
  id: null,
  name: "",
  description: "",
  code: "",
  isActive: true,
};

const initialClasses = [
  { id: 1, name: "10th Class", description: "Secondary", code: "C10", isActive: true, createdBy: "admin@gmail.com" },
  { id: 2, name: "1st Class", description: "Primary", code: "C01", isActive: true, createdBy: "admin@gmail.com" },
];

function ClassArtwork() {
  return (
    <div className="class-artwork" aria-hidden="true">
      <span className="class-art-board">
        <i /><i /><i />
      </span>
      <span className="class-art-desk" />
      <span className="class-art-book" />
    </div>
  );
}

function Class() {
  const [classList, setClassList] = useState(initialClasses);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entries, setEntries] = useState(5);
  const [editingId, setEditingId] = useState(null);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return keyword
      ? classList.filter((item) =>
          [item.name, item.description, item.code, item.createdBy]
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        )
      : classList;
  }, [classList, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / entries));
  const startIndex = (currentPage - 1) * entries;
  const currentData = filteredData.slice(startIndex, startIndex + entries);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleChange = ({ target }) => {
    const { name, value, type, checked } = target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setErrors({});
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    ["name", "description", "code"].forEach((key) => {
      if (!formData[key].trim()) nextErrors[key] = "This field is required";
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (editingId !== null) {
      setClassList((current) =>
        current.map((item) =>
          item.id === editingId
            ? { ...formData, id: editingId, createdBy: item.createdBy }
            : item
        )
      );
    } else {
      setClassList((current) => [
        ...current,
        { ...formData, id: Date.now(), createdBy: "admin@gmail.com" },
      ]);
    }
    resetForm();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData(item);
    setErrors({});
  };

  const firstEntry = filteredData.length ? startIndex + 1 : 0;
  const lastEntry = Math.min(startIndex + entries, filteredData.length);

  return (
    <div className="class-page">
      <section className="class-card class-form-card">
        <ClassArtwork />

        <div className="class-section-title">
          <span className="class-heading-icon"><FaChalkboardTeacher /></span>
          <h3>Configuration / Class</h3>
        </div>

        <form className="class-form" onSubmit={handleSubmit}>
          <label className="class-field">
            <span>Name <b>*</b></span>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Enter class name" className={errors.name ? "class-input-error" : ""} />
            <small>{errors.name}</small>
          </label>

          <label className="class-field">
            <span>Code <b>*</b></span>
            <input name="code" value={formData.code} onChange={handleChange} placeholder="Enter class code" className={errors.code ? "class-input-error" : ""} />
            <small>{errors.code}</small>
          </label>

          <label className="class-field class-description-field">
            <span>Description <b>*</b></span>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter class description" className={errors.description ? "class-input-error" : ""} />
            <small>{errors.description}</small>
          </label>

          <label className="class-checkbox-field">
            <input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} />
            <span>Is Active?</span>
          </label>

          <div className="class-form-actions">
            <button className="class-save-button" type="submit"><FaSave />{editingId !== null ? "Update Class" : "Save Class"}</button>
            <button className="class-clear-button" type="button" onClick={resetForm}><FaEraser />Clear</button>
          </div>
        </form>
      </section>

      <section className="class-card class-details-card">
        <div className="class-section-title">
          <span className="class-heading-icon"><FaChalkboardTeacher /></span>
          <h3>Class Details</h3>
          <span className="class-record-count">{filteredData.length}</span>
        </div>

        <div className="class-table-tools">
          <label className="class-show-control">
            <span>Show</span>
            <select value={entries} onChange={(event) => { setEntries(Number(event.target.value)); setCurrentPage(1); }}>
              <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
            <span>entries</span>
          </label>

          <label className="class-search-control">
            <span>Search:</span>
            <input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search..." />
          </label>
        </div>

        <div className="class-table-wrap">
          <table className="class-table">
            <thead>
              <tr><th>Name</th><th>Description</th><th>Code</th><th>Status</th><th>Created By</th><th className="class-action-column">Action</th></tr>
            </thead>
            <tbody>
              {currentData.length ? currentData.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td><td>{item.description}</td><td>{item.code}</td>
                  <td><span className={item.isActive ? "class-status-active" : "class-status-inactive"}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td>{item.createdBy}</td>
                  <td className="class-action-column">
                    <div className="class-action-buttons">
                      <button className="class-edit-button" type="button" onClick={() => handleEdit(item)}><FaEdit />Edit</button>
                      <button className="class-delete-button" type="button" onClick={() => setClassList((current) => current.filter(({ id }) => id !== item.id))}><FaTrash />Delete</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td className="class-empty" colSpan="6">No class details found.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="class-pagination-bar">
          <p>Showing {firstEntry} to {lastEntry} of {filteredData.length} entries</p>
          <div className="class-pagination-actions">
            <button className="class-page-button" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}><FaArrowLeft /> Prev</button>
            <button className="class-page-button class-page-current" type="button">{currentPage}</button>
            <button className="class-page-button" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next <FaArrowRight /></button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Class;
