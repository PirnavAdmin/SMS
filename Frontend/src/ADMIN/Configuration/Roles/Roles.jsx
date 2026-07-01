import React, { useMemo, useState } from 'react';
import './Roles.css';

const initialRoles = [
  { id: 1, name: 'Administrator', description: 'Full access to school administration', status: 'Active' },
  { id: 2, name: 'Teacher', description: 'Academic and classroom access', status: 'Active' },
];

const emptyRole = { name: '', description: '', status: 'Active' };

const Icon = ({ type }) => {
  if (type === 'list') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
  if (type === 'edit') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>;
  if (type === 'delete') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></svg>;
  if (type === 'clear') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 16 16M20 4 4 20" /></svg>;
  if (type === 'save') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM7 3v6h10V4M8 21v-7h8v7" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" /><path d="M9 12l2 2 4-4" /></svg>;
};

function Roles() {
  const [roles, setRoles] = useState(initialRoles);
  const [form, setForm] = useState(emptyRole);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState('10');

  const visibleRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query ? roles.filter((role) => `${role.name} ${role.description} ${role.status}`.toLowerCase().includes(query)) : roles;
    return filtered.slice(0, Number(entries));
  }, [roles, search, entries]);

  const resetForm = () => { setForm(emptyRole); setEditingId(null); };

  const handleSubmit = (event) => {
    event.preventDefault();
    setRoles((current) => editingId
      ? current.map((role) => role.id === editingId ? { ...form, id: editingId } : role)
      : [...current, { ...form, id: Date.now() }]);
    resetForm();
  };

  const handleEdit = (role) => {
    setEditingId(role.id);
    setForm({ name: role.name, description: role.description, status: role.status });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="roles-page">
      <section className="roles-card roles-form-card">
        <div className="roles-hero-art" aria-hidden="true">
          <div className="roles-art-shield"><Icon /></div>
          <span className="roles-art-user roles-art-user-one" /><span className="roles-art-user roles-art-user-two" />
        </div>
        <div className="roles-section-title"><span className="roles-heading-icon"><Icon /></span><h3>Configuration / Roles</h3></div>
        <form className="roles-form" onSubmit={handleSubmit}>
          <label className="roles-field"><span>Role Name <b>*</b></span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter Role Name" required /></label>
          <label className="roles-field"><span>Description <b>*</b></span><input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Enter Role Description" required /></label>
          <label className="roles-field"><span>Status <b>*</b></span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Active</option><option>Inactive</option></select></label>
          <div className="roles-form-actions">
            <button className="roles-save-button" type="submit"><Icon type="save" />{editingId ? 'Update Role' : 'Save Role'}</button>
            <button className="roles-clear-button" type="button" onClick={resetForm}><Icon type="clear" />Clear</button>
          </div>
        </form>
      </section>

      <section className="roles-card">
        <div className="roles-section-title"><span className="roles-heading-icon"><Icon type="list" /></span><h3>Role Details</h3><span className="roles-count">{roles.length}</span></div>
        <div className="roles-table-tools">
          <label>Show <select value={entries} onChange={(event) => setEntries(event.target.value)}><option>10</option><option>25</option><option>50</option><option>100</option></select> entries</label>
          <label>Search: <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." /></label>
        </div>
        <div className="roles-table-wrap"><table className="roles-table"><thead><tr><th>Role Name</th><th>Description</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {visibleRoles.map((role) => <tr key={role.id}><td>{role.name}</td><td>{role.description}</td><td><span className={`roles-status ${role.status.toLowerCase()}`}>{role.status}</span></td><td><div className="roles-action-buttons"><button className="roles-edit-button" type="button" onClick={() => handleEdit(role)}><Icon type="edit" />Edit</button><button className="roles-delete-button" type="button" onClick={() => setRoles((current) => current.filter((item) => item.id !== role.id))}><Icon type="delete" />Delete</button></div></td></tr>)}
          {visibleRoles.length === 0 && <tr><td className="roles-empty" colSpan="4">No roles found.</td></tr>}
        </tbody></table></div>
        <div className="roles-pagination-bar"><p>Showing {visibleRoles.length ? 1 : 0} to {visibleRoles.length} of {visibleRoles.length} entries</p><div><button disabled>Prev</button><button className="current">1</button><button disabled>Next</button></div></div>
      </section>
    </div>
  );
}

export default Roles;
