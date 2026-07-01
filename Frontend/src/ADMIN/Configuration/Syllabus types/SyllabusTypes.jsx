import React, { useMemo, useState } from "react";
import {
  ClearIcon,
  DeleteIcon,
  EditIcon,
  SaveIcon,
  SyllabusDetailsIcon,
  SyllabusFormIcon,
} from "./SyllabusIcons";
import "./SyllabusTypes.css";

const emptyForm = {
  name: "",
  code: "",
  description: "",
  isActive: true,
};

const initialSyllabusTypes = [
  {
    id: 1,
    code: "CBSE",
    name: "Central Board",
    description: "Central Board of Secondary Education",
    status: "Active",
    createdBy: "admin@gmail.com",
  },
  {
    id: 2,
    code: "ICSE",
    name: "Indian Certificate",
    description: "Indian Certificate of Secondary Education",
    status: "Active",
    createdBy: "admin@gmail.com",
  },
];

function SyllabusTypes() {
  const [formData, setFormData] = useState(emptyForm);
  const [syllabusTypes, setSyllabusTypes] = useState(initialSyllabusTypes);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState("100");

  const filteredSyllabusTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return syllabusTypes;
    }

    return syllabusTypes.filter((type) =>
      [type.code, type.status, type.createdBy, type.name, type.description]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search, syllabusTypes]);

  const visibleSyllabusTypes = filteredSyllabusTypes.slice(0, Number(entries));

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

    const nextType = {
      id: editingId || Date.now(),
      code: formData.code,
      name: formData.name,
      description: formData.description,
      status: formData.isActive ? "Active" : "Inactive",
      createdBy: "admin@gmail.com",
    };

    if (editingId) {
      setSyllabusTypes((current) =>
        current.map((type) => (type.id === editingId ? nextType : type))
      );
    } else {
      setSyllabusTypes((current) => [...current, nextType]);
    }

    resetForm();
  };

  const handleEdit = (type) => {
    setEditingId(type.id);
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description,
      isActive: type.status === "Active",
    });
  };

  const handleDelete = (id) => {
    setSyllabusTypes((current) => current.filter((type) => type.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  return (
    <div className="syllabus-page">
      <section className="syllabus-panel">
        <div className="syllabus-title-bar">
          <SyllabusFormIcon />
          <h3>Configuration / Syllabus Types</h3>
        </div>

        <div className="syllabus-hero-art" aria-hidden="true">
          <span className="syllabus-art-book syllabus-art-book-one" />
          <span className="syllabus-art-book syllabus-art-book-two" />
          <span className="syllabus-art-page" />
        </div>

        <form className="syllabus-form" onSubmit={handleSubmit}>
          <label className="syllabus-field">
            <span>
              Name <strong>*</strong>
            </span>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="syllabus-field">
            <span>
              Code <strong>*</strong>
            </span>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
            />
          </label>

          <label className="syllabus-field syllabus-description">
            <span>
              Description <strong>*</strong>
            </span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </label>

          <label className="syllabus-check-field">
            <input
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <span>IsActive?</span>
          </label>

          <div className="syllabus-form-actions">
            <button className="syllabus-save-btn" type="submit">
              <SaveIcon />
              {editingId ? "Update" : "Save"}
            </button>
            <button className="syllabus-clear-btn" type="button" onClick={resetForm}>
              <ClearIcon />
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="syllabus-panel">
        <div className="syllabus-title-bar">
          <SyllabusDetailsIcon />
          <h3>Syllabus Types Details</h3>
        </div>

        <div className="syllabus-table-tools">
          <label className="syllabus-show-control">
            <span>Show</span>
            <select value={entries} onChange={(event) => setEntries(event.target.value)}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span>entries</span>
          </label>

          <label className="syllabus-search-control">
            <span>Search:</span>
            <input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </div>

        <div className="syllabus-table-wrap">
          <table className="syllabus-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleSyllabusTypes.length > 0 ? (
                visibleSyllabusTypes.map((type) => (
                  <tr key={type.id}>
                    <td>{type.name}</td>
                    <td>{type.code}</td>
                    <td>{type.status}</td>
                    <td>{type.createdBy}</td>
                    <td>
                      <div className="syllabus-action-buttons">
                        <button
                          className="syllabus-edit-btn"
                          type="button"
                          onClick={() => handleEdit(type)}
                        >
                          <EditIcon />
                          Edit
                        </button>
                        <button
                          className="syllabus-delete-btn"
                          type="button"
                          onClick={() => handleDelete(type.id)}
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
                  <td className="syllabus-empty" colSpan="5">
                    No syllabus types found.
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

export default SyllabusTypes;
