import React, { useEffect, useMemo, useState } from "react";
import "./Orientation.css";

const emptyForm = { name: "", code: "", description: "", isActive: true };

const initialOrientations = [
  { id: 1, name: "IMPEL", code: "IMPL", description: "Student induction program", status: "Active", createdBy: "admin@gmail.com", createdOn: "22-Jun-2025" },
  { id: 2, name: "State", code: "STATE", description: "State orientation program", status: "Active", createdBy: "admin@gmail.com", createdOn: "22-Jun-2025" },
];

function Icon({ type }) {
  const paths = {
    document: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>,
    save: <><path d="M5 3h12l4 4v14H3V3z" /><path d="M7 3v6h9V3M7 21v-8h10v8" /></>,
    clear: <><path d="m5 5 14 14M19 5 5 19" /></>,
    edit: <><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
    delete: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  };
  return <svg className="orientation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function OrientationArtwork() {
  return (
    <svg
      className="orientation-artwork"
      viewBox="0 0 300 230"
      role="img"
      aria-label="Teacher presenting an orientation session"
    >
      <defs>
        <linearGradient id="orientation-board-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9868e8" />
          <stop offset="100%" stopColor="#438cf0" />
        </linearGradient>
      </defs>
      <path d="M36 167c-16-49 16-108 70-130 51-21 118-6 144 40 28 48 4 112-46 136-57 27-149 8-168-46Z" fill="#f0edff" />
      <circle cx="249" cy="46" r="13" fill="#5ae0cd" opacity=".75" />
      <circle cx="49" cy="188" r="10" fill="#ffda8a" opacity=".85" />
      <rect x="72" y="48" width="158" height="111" rx="12" fill="url(#orientation-board-gradient)" />
      <rect x="83" y="60" width="136" height="87" rx="7" fill="#fff" />
      <path d="M101 82h75M101 102h98M101 122h57" stroke="#aaa0ff" strokeWidth="8" strokeLinecap="round" />
      <circle cx="216" cy="170" r="24" fill="#ffcfaa" />
      <path d="M179 225c2-32 15-49 37-49s36 17 38 49" fill="#7968ef" />
      <path d="M216 194v30M196 207l20 12 20-12" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="m163 163 31 22" stroke="#5ae0cd" strokeWidth="8" strokeLinecap="round" />
      <path d="M151 153l18 7-11 15Z" fill="#5ae0cd" />
      <path d="M95 159v25M207 159v18M83 184h136" stroke="#7968ef" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export default function Orientation() {
  const [form, setForm] = useState(emptyForm);
  const [orientations, setOrientations] = useState(initialOrientations);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? orientations.filter((item) =>
      [item.name, item.code, item.description, item.status, item.createdBy, item.createdOn]
        .join(" ").toLowerCase().includes(query)
    ) : orientations;
  }, [orientations, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const start = (page - 1) * entries;
  const visible = filtered.slice(start, start + entries);

  useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages]);

  const handleChange = ({ target }) => {
    const { name, value, type, checked } = target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const clearForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const record = {
      ...form,
      id: editingId || Date.now(),
      status: form.isActive ? "Active" : "Inactive",
      createdBy: "admin@gmail.com",
      createdOn: editingId
        ? orientations.find(({ id }) => id === editingId)?.createdOn
        : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
    };

    setOrientations((current) => editingId
      ? current.map((item) => item.id === editingId ? record : item)
      : [...current, record]);
    clearForm();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name, code: item.code, description: item.description, isActive: item.status === "Active" });
  };

  return (
    <div className="orientation-page">
      <nav className="orientation-breadcrumb" aria-label="Breadcrumb">
        <span>Dashboard</span><b>›</b><span>Configuration</span><b>›</b><strong>Orientation</strong>
      </nav>

      <section className="orientation-card orientation-form-card">
        <div className="orientation-title">
          <span className="orientation-title-icon"><Icon type="document" /></span>
          <h3>{editingId ? "Edit Orientation" : "Add New Orientation"}</h3>
        </div>

        <OrientationArtwork />

        <form className="orientation-form" onSubmit={handleSubmit}>
          <label className="orientation-field">
            <span>Name <b>*</b></span>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Enter orientation name" required />
          </label>
          <label className="orientation-field">
            <span>Code <b>*</b></span>
            <input name="code" value={form.code} onChange={handleChange} placeholder="Enter code" required />
          </label>
          <label className="orientation-field">
            <span>Description <b>*</b></span>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Enter description" required />
          </label>
          <label className="orientation-check">
            <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} />
            <span>Is Active?</span>
          </label>
          <div className="orientation-form-actions">
            <button className="orientation-save" type="submit"><Icon type="save" />{editingId ? "Update" : "Save"}</button>
            <button className="orientation-clear" type="button" onClick={clearForm}><Icon type="clear" />Clear</button>
          </div>
        </form>
      </section>

      <section className="orientation-card orientation-details-card">
        <div className="orientation-title">
          <span className="orientation-title-icon"><Icon type="document" /></span>
          <h3>Orientation Details</h3>
        </div>

        <div className="orientation-tools">
          <label>Show
            <select value={entries} onChange={(event) => { setEntries(Number(event.target.value)); setPage(1); }}>
              <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select> entries
          </label>
          <label className="orientation-search">
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search orientation..." />
            <Icon type="search" />
          </label>
        </div>

        <div className="orientation-table-wrap">
          <table className="orientation-table">
            <thead><tr><th>Name</th><th>Code</th><th>Status</th><th>Created By</th><th>Created On</th><th>Action</th></tr></thead>
            <tbody>
              {visible.length ? visible.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td><td>{item.code}</td>
                  <td><span className={item.status === "Active" ? "orientation-active" : "orientation-inactive"}>{item.status}</span></td>
                  <td>{item.createdBy}</td><td>{item.createdOn}</td>
                  <td><div className="orientation-actions">
                    <button className="orientation-edit" type="button" onClick={() => handleEdit(item)}><Icon type="edit" />Edit</button>
                    <button className="orientation-delete" type="button" onClick={() => setOrientations((current) => current.filter(({ id }) => id !== item.id))}><Icon type="delete" />Delete</button>
                  </div></td>
                </tr>
              )) : <tr><td className="orientation-empty" colSpan="6">No orientations found.</td></tr>}
            </tbody>
          </table>
        </div>

        <footer className="orientation-footer">
          <p>Showing {filtered.length ? start + 1 : 0} to {Math.min(start + entries, filtered.length)} of {filtered.length} entries</p>
          <div>
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>‹</button>
            <span>{page}</span>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>›</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
