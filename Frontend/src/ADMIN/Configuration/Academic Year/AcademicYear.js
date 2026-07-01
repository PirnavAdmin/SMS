import React, { useEffect, useMemo, useState } from "react";
import "./AcademicYear.css";

const initialYears = [
  { id: 1, name: "2022-2023", status: "InActive", createdBy: "Admin" },
  { id: 2, name: "2023-2024", status: "Active", createdBy: "Admin" },
  { id: 3, name: "2024-2025", status: "Active", createdBy: "Admin" },
];

function Icon({ type }) {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>,
    clear: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>,
    edit: <><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></>,
    delete: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
  };

  return <svg className={`ay-icon ay-icon-${type}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export default function AcademicYear() {
  const [academicYear, setAcademicYear] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [years, setYears] = useState(initialYears);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState("100");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredYears = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? years.filter((year) => `${year.name} ${year.status} ${year.createdBy}`.toLowerCase().includes(query))
      : years;
  }, [years, search]);

  const entriesPerPage = Number(entries);
  const totalPages = Math.max(1, Math.ceil(filteredYears.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleYears = filteredYears.slice(startIndex, startIndex + entriesPerPage);
  const firstEntry = filteredYears.length ? startIndex + 1 : 0;
  const lastEntry = Math.min(startIndex + entriesPerPage, filteredYears.length);

  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  const resetForm = () => {
    setAcademicYear("");
    setIsActive(true);
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = academicYear.trim();
    if (!name) return;

    if (editingId !== null) {
      setYears((current) => current.map((year) => year.id === editingId
        ? { ...year, name, status: isActive ? "Active" : "InActive" }
        : year));
    } else {
      setYears((current) => [...current, { id: Date.now(), name, status: isActive ? "Active" : "InActive", createdBy: "Admin" }]);
    }
    resetForm();
  };

  const handleEdit = (year) => {
    setAcademicYear(year.name);
    setIsActive(year.status === "Active");
    setEditingId(year.id);
  };

  const handleDelete = (id) => {
    setYears((current) => current.filter((year) => year.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <div className="ay-page">
      <section className="ay-card ay-form-card">
        <div className="ay-watermark" aria-hidden="true">
          <span className="ay-watermark-calendar"><i /><i /><i /><i /><i /><i /></span>
          <span className="ay-watermark-check">✓</span>
        </div>

        <div className="ay-section-title"><span className="ay-heading-icon"><Icon type="calendar" /></span><h3>Configuration / Academic Year</h3></div>

        <form className="ay-form" onSubmit={handleSubmit}>
          <label className="ay-field">
            <span>Academic Year <b className="ay-required">*</b></span>
            <input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} placeholder="e.g., 2025-2026" required />
          </label>

          <label className="ay-checkbox-field">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            <span>Is Active?</span>
          </label>

          <div className="ay-form-actions">
            <button className="ay-save-button" type="submit"><Icon type="save" />{editingId !== null ? "Update Year" : "Save Year"}</button>
            <button className="ay-clear-button" type="button" onClick={resetForm}><Icon type="clear" />Clear</button>
          </div>
        </form>
      </section>

      <section className="ay-card ay-details-card">
        <div className="ay-section-title"><span className="ay-heading-icon"><Icon type="list" /></span><h3>Academic Year Details</h3></div>

        <div className="ay-table-tools">
          <label className="ay-show-control">Show <select value={entries} onChange={(event) => { setEntries(event.target.value); setCurrentPage(1); }}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select> entries</label>
          <label className="ay-search-control">Search: <input placeholder="Search..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} /></label>
        </div>

        <div className="ay-table-wrap">
          <table className="ay-table">
            <thead><tr><th>Academic Year Name</th><th>Status</th><th>Created By</th><th className="ay-action-column">Action</th></tr></thead>
            <tbody>
              {visibleYears.length ? visibleYears.map((year) => (
                <tr key={year.id}>
                  <td>{year.name}</td>
                  <td><span className={year.status === "Active" ? "ay-status-active" : "ay-status-inactive"}>{year.status}</span></td>
                  <td>{year.createdBy}</td>
                  <td><div className="ay-action-buttons"><button className="ay-edit-button" type="button" onClick={() => handleEdit(year)}><Icon type="edit" />Edit</button><button className="ay-delete-button" type="button" onClick={() => handleDelete(year.id)}><Icon type="delete" />Delete</button></div></td>
                </tr>
              )) : <tr><td className="ay-empty" colSpan="4">No academic years found.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="ay-pagination-bar">
          <p>Showing {firstEntry} to {lastEntry} of {filteredYears.length} entries</p>
          <div className="ay-pagination-actions">
            <button className="ay-page-button" type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>Prev</button>
            <button className="ay-page-button ay-page-current" type="button">{currentPage}</button>
            <button className="ay-page-button" type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
