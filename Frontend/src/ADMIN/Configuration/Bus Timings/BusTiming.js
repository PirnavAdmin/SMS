import React, { useEffect, useMemo, useState } from "react";
import "./BusTiming.css";

const initialTimings = [
  { id: 1, busTime: "07:00 A.M", value: "07:00", status: "Active", createdBy: "admin@gmail.com" },
  { id: 2, busTime: "07:05 A.M", value: "07:05", status: "Active", createdBy: "admin@gmail.com" },
  { id: 3, busTime: "07:10 A.M", value: "07:10", status: "Active", createdBy: "admin@gmail.com" },
];

function BusIcon({ type }) {
  const paths = {
    bus: <><rect x="4" y="3" width="16" height="16" rx="3" /><path d="M4 11h16M8 7h8M7 19v2M17 19v2" /><circle cx="8" cy="15" r="1" /><circle cx="16" cy="15" r="1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>,
    clear: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>,
    edit: <><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></>,
    delete: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
  };
  return <svg className={`bt-icon bt-icon-${type}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function formatTime(time) {
  if (!time) return "";
  const [hour, minute] = time.split(":");
  const numericHour = Number(hour);
  return `${String(numericHour % 12 || 12).padStart(2, "0")}:${minute} ${numericHour >= 12 ? "P.M" : "A.M"}`;
}

export default function BusTiming() {
  const [formData, setFormData] = useState({ busTime: "", active: true });
  const [editingId, setEditingId] = useState(null);
  const [busTimings, setBusTimings] = useState(initialTimings);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState("100");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTimings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? busTimings.filter((item) => `${item.busTime} ${item.status} ${item.createdBy}`.toLowerCase().includes(query)) : busTimings;
  }, [busTimings, search]);

  const entriesPerPage = Number(entries);
  const totalPages = Math.max(1, Math.ceil(filteredTimings.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleTimings = filteredTimings.slice(startIndex, startIndex + entriesPerPage);
  const firstEntry = filteredTimings.length ? startIndex + 1 : 0;
  const lastEntry = Math.min(startIndex + entriesPerPage, filteredTimings.length);

  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  const resetForm = () => {
    setFormData({ busTime: "", active: true });
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.busTime) return;
    const timing = { busTime: formatTime(formData.busTime), value: formData.busTime, status: formData.active ? "Active" : "Inactive" };

    if (editingId !== null) {
      setBusTimings((current) => current.map((item) => item.id === editingId ? { ...item, ...timing } : item));
    } else {
      setBusTimings((current) => [...current, { id: Date.now(), ...timing, createdBy: "admin@gmail.com" }]);
    }
    resetForm();
  };

  const handleEdit = (row) => {
    setFormData({ busTime: row.value || "", active: row.status === "Active" });
    setEditingId(row.id);
  };

  const handleDelete = (id) => {
    setBusTimings((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <div className="bt-page">
      <section className="bt-card bt-form-card">
        <div className="bt-watermark" aria-hidden="true"><span className="bt-watermark-road" /><span className="bt-watermark-bus"><i /><i /></span><span className="bt-watermark-clock"><BusIcon type="clock" /></span></div>
        <div className="bt-section-title"><span className="bt-heading-icon"><BusIcon type="bus" /></span><h3>Configuration / Bus Timings</h3></div>

        <form className="bt-form" onSubmit={handleSubmit}>
          <label className="bt-field"><span>Bus Time *</span><input type="time" value={formData.busTime} onChange={(event) => setFormData((current) => ({ ...current, busTime: event.target.value }))} required /></label>
          <label className="bt-checkbox-field"><input type="checkbox" checked={formData.active} onChange={(event) => setFormData((current) => ({ ...current, active: event.target.checked }))} /><span>Is Active?</span></label>
          <div className="bt-form-actions"><button className="bt-save-button" type="submit"><BusIcon type="save" />{editingId !== null ? "Update Timing" : "Save Timing"}</button><button className="bt-clear-button" type="button" onClick={resetForm}><BusIcon type="clear" />Clear</button></div>
        </form>
      </section>

      <section className="bt-card bt-details-card">
        <div className="bt-section-title"><span className="bt-heading-icon"><BusIcon type="clock" /></span><h3>Bus Timing Details</h3></div>
        <div className="bt-table-tools">
          <label className="bt-show-control">Show <select value={entries} onChange={(event) => { setEntries(event.target.value); setCurrentPage(1); }}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select> entries</label>
          <label className="bt-search-control">Search: <input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} /></label>
        </div>

        <div className="bt-table-wrap"><table className="bt-table">
          <thead><tr><th>Bus Time</th><th>Status</th><th>Created By</th><th className="bt-action-column">Action</th></tr></thead>
          <tbody>{visibleTimings.length ? visibleTimings.map((row) => <tr key={row.id}><td>{row.busTime}</td><td><span className={row.status === "Active" ? "bt-status-active" : "bt-status-inactive"}>{row.status}</span></td><td>{row.createdBy}</td><td><div className="bt-action-buttons"><button className="bt-edit-button" type="button" onClick={() => handleEdit(row)}><BusIcon type="edit" />Edit</button><button className="bt-delete-button" type="button" onClick={() => handleDelete(row.id)}><BusIcon type="delete" />Delete</button></div></td></tr>) : <tr><td className="bt-empty" colSpan="4">No bus timings found.</td></tr>}</tbody>
        </table></div>

        <div className="bt-pagination-bar"><p>Showing {firstEntry} to {lastEntry} of {filteredTimings.length} entries</p><div className="bt-pagination-actions"><button className="bt-page-button" type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>Prev</button><button className="bt-page-button bt-page-current" type="button">{currentPage}</button><button className="bt-page-button" type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div></div>
      </section>
    </div>
  );
}
