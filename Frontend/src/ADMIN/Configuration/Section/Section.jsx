import React, { useMemo, useState } from "react";
import {
  ClearIcon,
  DeleteIcon,
  EditIcon,
  SaveIcon,
  SectionDetailsIcon,
  SectionFormIcon,
} from "./SectionIcons";
import "./Section.css";

const emptyForm = {
  sectionName: "",
  isActive: true,
};

const initialSections = [
  { id: 1, sectionName: "A", status: "Active", createdBy: "admin@gmail.com" },
  { id: 2, sectionName: "B", status: "Active", createdBy: "admin@gmail.com" },
  { id: 3, sectionName: "C", status: "Inactive", createdBy: "admin@gmail.com" },
];

function Section() {
  const [formData, setFormData] = useState(emptyForm);
  const [sections, setSections] = useState(initialSections);
  const [editingId, setEditingId] = useState(null);
  const [entries, setEntries] = useState("100");
  const [search, setSearch] = useState("");

  const visibleSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filteredSections = query
      ? sections.filter((section) =>
          [section.sectionName, section.status, section.createdBy]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      : sections;

    return filteredSections.slice(0, Number(entries));
  }, [entries, search, sections]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextSection = {
      id: editingId || Date.now(),
      sectionName: formData.sectionName,
      status: formData.isActive ? "Active" : "Inactive",
      createdBy: "admin@gmail.com",
    };

    if (editingId) {
      setSections((current) =>
        current.map((section) =>
          section.id === editingId ? nextSection : section
        )
      );
    } else {
      setSections((current) => [...current, nextSection]);
    }

    resetForm();
  };

  const handleEdit = (section) => {
    setEditingId(section.id);
    setFormData({
      sectionName: section.sectionName,
      isActive: section.status === "Active",
    });
  };

  const handleDelete = (id) => {
    setSections((current) => current.filter((section) => section.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  return (
    <div className="section-page">
      <section className="section-panel">
        <div className="section-title-bar">
          <SectionFormIcon />
          <h3>Dashboard / Configuration / Section</h3>
        </div>

        <form className="section-form" onSubmit={handleSubmit}>
          <label className="section-field">
            <span>Section Name <b className="section-required">*</b></span>
            <input
              name="sectionName"
              value={formData.sectionName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="section-check-field">
            <input
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <span>IsActive?</span>
          </label>

          <div className="section-form-actions">
            <button className="section-save-btn" type="submit">
              <SaveIcon />
              {editingId ? "Update" : "Save"}
            </button>
            <button className="section-clear-btn" type="button" onClick={resetForm}>
              <ClearIcon />
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="section-panel">
        <div className="section-title-bar">
          <SectionDetailsIcon />
          <h3>Section Details</h3>
        </div>

        <div className="section-table-tools">
          <label className="section-show-control">
            <span>Show</span>
            <select value={entries} onChange={(event) => setEntries(event.target.value)}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span>entries</span>
          </label>

          <label className="section-search-control">
            <span>Search:</span>
            <input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </div>

        <div className="section-table-wrap">
          <table className="section-table">
            <thead>
              <tr>
                <th>Section Name</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleSections.length > 0 ? (
                visibleSections.map((section) => (
                  <tr key={section.id}>
                    <td>{section.sectionName}</td>
                    <td>{section.status}</td>
                    <td>{section.createdBy}</td>
                    <td>
                      <div className="section-action-buttons">
                        <button
                          className="section-edit-btn"
                          type="button"
                          onClick={() => handleEdit(section)}
                        >
                          <EditIcon />
                          Edit
                        </button>
                        <button
                          className="section-delete-btn"
                          type="button"
                          onClick={() => handleDelete(section.id)}
                        >
                          <DeleteIcon />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="section-empty" colSpan="4">
                    No section details found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Section;
