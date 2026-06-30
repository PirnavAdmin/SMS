import React, { useEffect, useMemo, useState } from "react";
import "./busStopNames.css";

const routeList = ["ATMAKURU", "GUDUR", "KAVALI", "KOVUR", "NELLORE"];
const busList = ["AP15Y7409", "AP16AB1234", "AP16CD5678", "AP16EF9012"];
const emptyForm = { routeName: "", busRegNo: "", stopName: "", distance: "", active: true };

function StopIcon({ type }) {
  const paths = {
    stop: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h3a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3h-1a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h6" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>,
    clear: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>,
    edit: <><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></>,
    delete: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
  };
  return <svg className={`bs-icon bs-icon-${type}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export default function BusStopNames() {
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busStops, setBusStops] = useState([{ id: 1, routeName: "ATMAKURU", busRegNo: "AP15Y7409", stopName: "ATMAKURU", distance: "45.00", status: "Active", createdBy: "admin@gmail.com" }]);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState("100");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredStops = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? busStops.filter((item) => `${item.routeName} ${item.busRegNo} ${item.stopName} ${item.distance} ${item.status} ${item.createdBy}`.toLowerCase().includes(query)) : busStops;
  }, [busStops, search]);

  const entriesPerPage = Number(entries);
  const totalPages = Math.max(1, Math.ceil(filteredStops.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleStops = filteredStops.slice(startIndex, startIndex + entriesPerPage);
  const firstEntry = filteredStops.length ? startIndex + 1 : 0;
  const lastEntry = Math.min(startIndex + entriesPerPage, filteredStops.length);
  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  const resetForm = () => { setFormData(emptyForm); setEditingId(null); };
  const handleSubmit = (event) => {
    event.preventDefault();
    const values = { routeName: formData.routeName, busRegNo: formData.busRegNo, stopName: formData.stopName.trim(), distance: formData.distance, status: formData.active ? "Active" : "Inactive" };
    if (editingId !== null) setBusStops((current) => current.map((item) => item.id === editingId ? { ...item, ...values } : item));
    else setBusStops((current) => [...current, { id: Date.now(), ...values, createdBy: "admin@gmail.com" }]);
    resetForm();
  };
  const handleEdit = (row) => { setFormData({ routeName: row.routeName, busRegNo: row.busRegNo, stopName: row.stopName, distance: row.distance, active: row.status === "Active" }); setEditingId(row.id); };
  const handleDelete = (id) => { setBusStops((current) => current.filter((item) => item.id !== id)); if (editingId === id) resetForm(); };

  return <div className="bs-page">
    <section className="bs-card bs-form-card">
      <div className="bs-watermark" aria-hidden="true"><span className="bs-watermark-route" /><span className="bs-watermark-pin"><StopIcon type="stop" /></span><span className="bs-watermark-bus"><i /><i /></span></div>
      <div className="bs-section-title"><span className="bs-heading-icon"><StopIcon type="stop" /></span><h3>Configuration / Bus Stop Names</h3></div>
      <form className="bs-form" onSubmit={handleSubmit}>
        <label className="bs-field"><span>Route Name *</span><select name="routeName" value={formData.routeName} onChange={handleChange} required><option value="">Select Route</option>{routeList.map((route) => <option key={route} value={route}>{route}</option>)}</select></label>
        <label className="bs-field"><span>Bus Reg. No *</span><select name="busRegNo" value={formData.busRegNo} onChange={handleChange} required><option value="">Select Bus</option>{busList.map((bus) => <option key={bus} value={bus}>{bus}</option>)}</select></label>
        <label className="bs-field"><span>Stop Name *</span><input name="stopName" value={formData.stopName} onChange={handleChange} placeholder="Enter Stop Name" required /></label>
        <label className="bs-field"><span>Distance (km) *</span><input type="number" min="0" step="0.01" name="distance" value={formData.distance} onChange={handleChange} placeholder="Enter Distance" required /></label>
        <label className="bs-checkbox-field"><input type="checkbox" name="active" checked={formData.active} onChange={handleChange} /><span>Is Active?</span></label>
        <div className="bs-form-actions"><button className="bs-save-button" type="submit"><StopIcon type="save" />{editingId !== null ? "Update Stop" : "Save Stop"}</button><button className="bs-clear-button" type="button" onClick={resetForm}><StopIcon type="clear" />Clear</button></div>
      </form>
    </section>
    <section className="bs-card bs-details-card">
      <div className="bs-section-title"><span className="bs-heading-icon"><StopIcon type="route" /></span><h3>Bus Stop Details</h3></div>
      <div className="bs-table-tools"><label className="bs-show-control">Show <select value={entries} onChange={(event) => { setEntries(event.target.value); setCurrentPage(1); }}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select> entries</label><label className="bs-search-control">Search: <input placeholder="Search..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} /></label></div>
      <div className="bs-table-wrap"><table className="bs-table"><thead><tr><th>Route Name</th><th>Bus Reg. No</th><th>Stop Name</th><th>Distance</th><th>Status</th><th>Created By</th><th className="bs-action-column">Action</th></tr></thead><tbody>{visibleStops.length ? visibleStops.map((row) => <tr key={row.id}><td>{row.routeName}</td><td>{row.busRegNo}</td><td>{row.stopName}</td><td>{row.distance} km</td><td><span className={row.status === "Active" ? "bs-status-active" : "bs-status-inactive"}>{row.status}</span></td><td>{row.createdBy}</td><td><div className="bs-action-buttons"><button className="bs-edit-button" type="button" onClick={() => handleEdit(row)}><StopIcon type="edit" />Edit</button><button className="bs-delete-button" type="button" onClick={() => handleDelete(row.id)}><StopIcon type="delete" />Delete</button></div></td></tr>) : <tr><td className="bs-empty" colSpan="7">No bus stops found.</td></tr>}</tbody></table></div>
      <div className="bs-pagination-bar"><p>Showing {firstEntry} to {lastEntry} of {filteredStops.length} entries</p><div className="bs-pagination-actions"><button className="bs-page-button" type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>Prev</button><button className="bs-page-button bs-page-current" type="button">{currentPage}</button><button className="bs-page-button" type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div></div>
    </section>
  </div>;
}
