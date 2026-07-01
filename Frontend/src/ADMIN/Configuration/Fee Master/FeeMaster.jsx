import React, { useEffect, useMemo, useState } from "react";
import "./FeeMaster.css";

const initialFees = [
  { id: 1, feeName: "Tuition Fee" },
  { id: 2, feeName: "Books Fee" },
  { id: 3, feeName: "Transport Fee" },
];

function FeeIcon({ type }) {
  const paths = {
    rupee: <><path d="M6 4h12M6 8h12M7 4c5 0 7 2 7 5s-2 5-7 5h-1l9 7" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>,
    clear: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>,
    edit: <><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></>,
    delete: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
  };
  return <svg className={`fm-icon fm-icon-${type}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export default function FeeMaster() {
  const [feeType, setFeeType] = useState("");
  const [fees, setFees] = useState(initialFees);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredFees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? fees.filter((fee) => fee.feeName.toLowerCase().includes(query)) : fees;
  }, [fees, search]);

  const entriesPerPage = Number(entries);
  const totalPages = Math.max(1, Math.ceil(filteredFees.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleFees = filteredFees.slice(startIndex, startIndex + entriesPerPage);
  const firstEntry = filteredFees.length ? startIndex + 1 : 0;
  const lastEntry = Math.min(startIndex + entriesPerPage, filteredFees.length);
  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  const resetForm = () => { setFeeType(""); setEditingId(null); setError(""); };
  const handleSubmit = (event) => {
    event.preventDefault();
    const feeName = feeType.trim();
    if (!feeName) { setError("Please enter a fee type name."); return; }
    if (editingId !== null) setFees((current) => current.map((fee) => fee.id === editingId ? { ...fee, feeName } : fee));
    else setFees((current) => [...current, { id: Date.now(), feeName }]);
    resetForm();
  };
  const handleEdit = (fee) => { setFeeType(fee.feeName); setEditingId(fee.id); setError(""); };
  const handleDelete = (id) => { setFees((current) => current.filter((fee) => fee.id !== id)); if (editingId === id) resetForm(); };

  return <div className="fm-page">
    <section className="fm-card fm-form-card">
      <div className="fm-watermark" aria-hidden="true"><span className="fm-watermark-receipt"><i /><i /><i /></span><span className="fm-watermark-coin">₹</span><span className="fm-watermark-coin fm-watermark-coin-small">₹</span></div>
      <div className="fm-section-title"><span className="fm-heading-icon"><FeeIcon type="rupee" /></span><h3>Configuration / Fee Master</h3></div>
      <form className="fm-form" onSubmit={handleSubmit}>
        <label className="fm-field"><span>Fee Type Name *</span><input value={feeType} onChange={(event) => { setFeeType(event.target.value); setError(""); }} placeholder="Enter Fee Type Name" aria-invalid={Boolean(error)} required />{error && <small className="fm-error">{error}</small>}</label>
        <div className="fm-form-actions"><button className="fm-save-button" type="submit"><FeeIcon type="save" />{editingId !== null ? "Update Fee" : "Save Fee"}</button><button className="fm-clear-button" type="button" onClick={resetForm}><FeeIcon type="clear" />Clear</button></div>
      </form>
    </section>
    <section className="fm-card fm-details-card">
      <div className="fm-section-title"><span className="fm-heading-icon"><FeeIcon type="list" /></span><h3>Fee Master Details</h3></div>
      <div className="fm-table-tools"><label className="fm-show-control">Show <select value={entries} onChange={(event) => { setEntries(event.target.value); setCurrentPage(1); }}><option value="5">5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option></select> entries</label><label className="fm-search-control">Search: <input placeholder="Search..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} /></label></div>
      <div className="fm-table-wrap"><table className="fm-table"><thead><tr><th>Fee Type Name</th><th className="fm-action-column">Action</th></tr></thead><tbody>{visibleFees.length ? visibleFees.map((fee) => <tr key={fee.id}><td>{fee.feeName}</td><td><div className="fm-action-buttons"><button className="fm-edit-button" type="button" onClick={() => handleEdit(fee)}><FeeIcon type="edit" />Edit</button><button className="fm-delete-button" type="button" onClick={() => handleDelete(fee.id)}><FeeIcon type="delete" />Delete</button></div></td></tr>) : <tr><td className="fm-empty" colSpan="2">No fee types found.</td></tr>}</tbody></table></div>
      <div className="fm-pagination-bar"><p>Showing {firstEntry} to {lastEntry} of {filteredFees.length} entries</p><div className="fm-pagination-actions"><button className="fm-page-button" type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>Prev</button><button className="fm-page-button fm-page-current" type="button">{currentPage}</button><button className="fm-page-button" type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div></div>
    </section>
  </div>;
}
