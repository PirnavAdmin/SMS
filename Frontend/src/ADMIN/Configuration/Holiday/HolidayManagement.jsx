import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaEraser,
  FaSave,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import "./HolidayManagement.css";

const STORAGE_KEY = "holidays";

const initialHolidays = [
  { id: 1, date: "2026-01-01", name: "New Year", description: "New Year Holiday", academicYear: "2025-2026" },
  { id: 2, date: "2026-01-26", name: "Republic Day", description: "National Holiday", academicYear: "2025-2026" },
  { id: 3, date: "2026-05-01", name: "May Day", description: "Labour Day", academicYear: "2026-2027" },
  { id: 4, date: "2026-08-15", name: "Independence Day", description: "National Holiday", academicYear: "2026-2027" },
  { id: 5, date: "2026-12-25", name: "Christmas", description: "Festival Holiday", academicYear: "2026-2027" },
];

const emptyForm = {
  date: "",
  name: "",
  description: "",
  academicYear: "",
};

function CalendarArtwork() {
  return (
    <svg
      className="holiday-artwork"
      viewBox="0 0 260 210"
      role="img"
      aria-label="Calendar with holiday decorations"
    >
      <defs>
        <linearGradient id="holiday-card-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9868e8" />
          <stop offset="100%" stopColor="#438cf0" />
        </linearGradient>
      </defs>
      <circle cx="132" cy="108" r="91" fill="#f0edff" />
      <circle cx="221" cy="50" r="14" fill="#ffda8a" opacity=".75" />
      <circle cx="40" cy="166" r="11" fill="#5ae0cd" opacity=".8" />
      <rect x="61" y="39" width="142" height="139" rx="17" fill="url(#holiday-card-gradient)" />
      <rect x="73" y="70" width="118" height="95" rx="10" fill="#fff" />
      <path d="M61 72h142" stroke="#aaa0ff" strokeWidth="3" />
      <path d="M92 27v27M172 27v27" stroke="#7968ef" strokeWidth="9" strokeLinecap="round" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3].map((column) => (
          <circle
            key={`${row}-${column}`}
            cx={91 + column * 27}
            cy={91 + row * 20}
            r="4"
            fill={row === 1 && column === 2 ? "#ff6f85" : "#c8c1f5"}
          />
        ))
      )}
      <path d="M208 120l7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="#ffda8a" />
    </svg>
  );
}

function loadHolidays() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialHolidays;
  } catch {
    return initialHolidays;
  }
}

function HolidayManagement() {
  const [holidays, setHolidays] = useState(loadHolidays);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holidays));
  }, [holidays]);

  const filteredHolidays = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return holidays;
    return holidays.filter((holiday) =>
      [holiday.date, holiday.name, holiday.description, holiday.academicYear]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [holidays, search]);

  const totalPages = Math.max(1, Math.ceil(filteredHolidays.length / entries));
  const startIndex = (currentPage - 1) * entries;
  const visibleHolidays = filteredHolidays.slice(startIndex, startIndex + entries);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) nextErrors[key] = "This field is required";
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (editingId !== null) {
      setHolidays((current) =>
        current.map((holiday) =>
          holiday.id === editingId ? { ...formData, id: editingId } : holiday
        )
      );
    } else {
      setHolidays((current) => [...current, { ...formData, id: Date.now() }]);
    }
    resetForm();
  };

  const handleEdit = (holiday) => {
    const { id, ...values } = holiday;
    setEditingId(id);
    setFormData(values);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const firstShown = filteredHolidays.length ? startIndex + 1 : 0;
  const lastShown = Math.min(startIndex + entries, filteredHolidays.length);

  return (
    <div className="holiday-page">
      <section className="holiday-card holiday-form-card">
        <div className="holiday-section-title">
          <FaCalendarAlt className="holiday-heading-icon" />
          <h3>Holiday Configuration</h3>
        </div>

        <CalendarArtwork />

        <form className="holiday-form" onSubmit={handleSubmit}>
          <label className="holiday-field">
            <span>Holiday Date <b>*</b></span>
            <input name="date" type="date" value={formData.date} onChange={handleChange} />
            <small>{errors.date}</small>
          </label>

          <label className="holiday-field">
            <span>Holiday Name <b>*</b></span>
            <input name="name" placeholder="Enter holiday name" value={formData.name} onChange={handleChange} />
            <small>{errors.name}</small>
          </label>

          <label className="holiday-field">
            <span>Academic Year <b>*</b></span>
            <select name="academicYear" value={formData.academicYear} onChange={handleChange}>
              <option value="">Select academic year</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
              <option value="2027-2028">2027-2028</option>
            </select>
            <small>{errors.academicYear}</small>
          </label>

          <label className="holiday-field holiday-description-field">
            <span>Description <b>*</b></span>
            <textarea name="description" placeholder="Enter holiday description" value={formData.description} onChange={handleChange} />
            <small>{errors.description}</small>
          </label>

          <div className="holiday-form-actions">
            <button className="holiday-save-button" type="submit">
              <FaSave /> {editingId !== null ? "Update Holiday" : "Save Holiday"}
            </button>
            <button className="holiday-clear-button" type="button" onClick={resetForm}>
              <FaEraser /> Clear
            </button>
          </div>
        </form>
      </section>

      <section className="holiday-card">
        <div className="holiday-section-title">
          <FaCalendarAlt className="holiday-heading-icon" />
          <h3>Holiday Details</h3>
        </div>

        <div className="holiday-table-tools">
          <label>
            Show
            <select value={entries} onChange={(event) => { setEntries(Number(event.target.value)); setCurrentPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            entries
          </label>
          <label className="holiday-search">
            <FaSearch />
            <input
              type="search"
              placeholder="Search holidays"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
            />
          </label>
        </div>

        <div className="holiday-table-wrap">
          <table className="holiday-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Month</th>
                <th>Holiday Name</th>
                <th>Description</th>
                <th>Academic Year</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleHolidays.length ? visibleHolidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td>{new Date(`${holiday.date}T00:00:00`).toLocaleDateString("en-GB")}</td>
                  <td>{new Date(`${holiday.date}T00:00:00`).toLocaleString("en", { month: "long" })}</td>
                  <td>{holiday.name}</td>
                  <td>{holiday.description}</td>
                  <td>{holiday.academicYear || "—"}</td>
                  <td>
                    <div className="holiday-actions">
                      <button type="button" className="holiday-edit-button" onClick={() => handleEdit(holiday)} title="Edit holiday"><FaEdit /></button>
                      <button type="button" className="holiday-delete-button" onClick={() => setHolidays((current) => current.filter(({ id }) => id !== holiday.id))} title="Delete holiday"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="holiday-empty" colSpan="6">No holidays found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="holiday-pagination">
          <p>Showing {firstShown} to {lastShown} of {filteredHolidays.length} entries</p>
          <div>
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}><FaChevronLeft /> Previous</button>
            <span>{currentPage}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next <FaChevronRight /></button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HolidayManagement;
