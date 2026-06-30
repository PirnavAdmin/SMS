import React, { useEffect, useMemo, useState } from "react";
import { Edit2, List, Search, Trash2 } from "lucide-react";

export default function UniformFeeList({ data, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState("10");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return query ? data.filter((item) => `${item.academicYear} ${item.uniformName} ${item.gender} ${item.size} ${item.fee} ${item.createdBy}`.toLowerCase().includes(query)) : data; }, [data, search]);
  const perPage = Number(entries);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);
  useEffect(() => setPage((current) => Math.min(current, pages)), [pages]);

  return <section className="uf-card uf-details-card">
    <div className="uf-section-title"><span className="uf-heading-icon"><List /></span><h3>Uniform Fee Details</h3></div>
    <div className="uf-tools"><label>Show <select value={entries} onChange={(e) => { setEntries(e.target.value); setPage(1); }}><option>10</option><option>25</option><option>50</option><option>100</option></select> entries</label><label className="uf-search"><Search /><span>Search:</span><input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label></div>
    <div className="uf-table-wrap"><table className="uf-table"><thead><tr><th>Academic Year</th><th>Name</th><th>Gender</th><th>Size</th><th>Fee</th><th>Created By</th><th className="uf-action-column">Action</th></tr></thead><tbody>{visible.length ? visible.map((item) => <tr key={item.id}><td>{item.academicYear}</td><td>{item.uniformName}</td><td>{item.gender}</td><td>{item.size}</td><td>₹{item.fee}</td><td>{item.createdBy}</td><td><div className="uf-row-actions"><button className="uf-edit" type="button" onClick={() => onEdit(item)}><Edit2 />Edit</button><button className="uf-delete" type="button" onClick={() => onDelete(item.id)}><Trash2 />Delete</button></div></td></tr>) : <tr><td className="uf-empty" colSpan="7">No uniform fee records found.</td></tr>}</tbody></table></div>
    <div className="uf-footer"><p>Showing {filtered.length ? start + 1 : 0} to {Math.min(start + perPage, filtered.length)} of {filtered.length} entries</p><div><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button><button className="active">{page}</button><button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
  </section>;
}
