import React, { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaEdit,
  FaEnvelope,
  FaEraser,
  FaPlus,
  FaSave,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import "./users.css";

const emptyForm = {
  role: "",
  userName: "",
  password: "",
  email: "",
  mobile: "",
  altEmail: "",
  altMobile: "",
  address: "",
  isActive: true,
};

const initialUsers = [
  { id: 1, role: "Admin", userName: "Anita Rao", password: "admin123", email: "anita.rao@school.com", mobile: "9876543210", altEmail: "", altMobile: "", address: "Bengaluru", isActive: true },
  { id: 2, role: "Principal", userName: "Ravi Kumar", password: "principal123", email: "ravi.kumar@school.com", mobile: "9876501234", altEmail: "", altMobile: "", address: "Mysuru", isActive: true },
  { id: 3, role: "Teacher", userName: "Meera Shah", password: "teacher123", email: "meera.shah@school.com", mobile: "9876512340", altEmail: "", altMobile: "", address: "Hubballi", isActive: false },
];

function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(100);
  const [errors, setErrors] = useState({});

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? users.filter((user) =>
          [user.userName, user.email, user.role, user.mobile, user.address]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      : users;
  }, [search, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setEditingId(user.id);
    setFormData({ ...user });
    setErrors({});
    setShowForm(true);
  };

  const handleChange = ({ target }) => {
    const { name, value, type, checked } = target;
    setFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.role) nextErrors.role = "Role is required";
    if (!formData.userName.trim()) nextErrors.userName = "User name is required";
    if (!formData.password.trim()) nextErrors.password = "Password is required";
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) nextErrors.email = "Enter a valid email";
    if (!formData.mobile.trim()) nextErrors.mobile = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.mobile)) nextErrors.mobile = "Mobile number must be 10 digits";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    if (editingId !== null) {
      setUsers((current) => current.map((user) => user.id === editingId ? { ...formData, id: editingId } : user));
    } else {
      setUsers((current) => [...current, { ...formData, id: Date.now() }]);
    }
    closeForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    setUsers((current) => current.filter((user) => user.id !== id));
    if (selectedUser?.id === id) setSelectedUser(null);
  };

  const firstEntry = filteredUsers.length ? startIndex + 1 : 0;
  const lastEntry = Math.min(startIndex + usersPerPage, filteredUsers.length);

  return (
    <div className="users-page">
      <section className="users-card users-list-card">
        <div className="users-list-header">
          <div className="users-title">
            <span className="users-heading-icon"><FaUsers /></span>
            <div><h3>User Details</h3><p>Manage school portal accounts and access roles.</p></div>
          </div>
          <button className="users-add-button" type="button" onClick={openAddForm}><FaPlus /> Add User</button>
        </div>

        <div className="users-summary">
          <article><strong>{users.length}</strong><span>Total Users</span></article>
          <article><strong>{new Set(users.map((user) => user.role)).size}</strong><span>Assigned Roles</span></article>
        </div>

        <div className="users-table-controls">
          <label className="users-show-control">
            <span>Show</span>
            <select value={usersPerPage} onChange={(event) => { setUsersPerPage(Number(event.target.value)); setCurrentPage(1); }}>
              <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
            </select>
            <span>entries</span>
          </label>
          <label className="users-search-control">
            <FaSearch />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search users..." />
          </label>
        </div>

        <div className="users-table-wrap">
          <table className="users-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Mobile</th><th className="users-action-column">Action</th></tr></thead>
            <tbody>
              {currentUsers.length ? currentUsers.map((user) => (
                <tr key={user.id}>
                  <td><button className="users-name-button" type="button" onClick={() => setSelectedUser(user)}>{user.userName}</button></td>
                  <td>{user.email}</td><td>{user.role}</td><td>{user.mobile}</td>
                  <td className="users-action-column">
                    <div className="users-row-actions">
                      <div>
                        <button className="users-edit-btn" type="button" onClick={() => openEditForm(user)} title="Edit user"><FaEdit /> Edit</button>
                        <button className="users-delete-btn" type="button" onClick={() => handleDelete(user.id)} title="Delete user"><FaTrash /> Delete</button>
                      </div>
                      <button
                        className="users-login-details-btn"
                        type="button"
                        onClick={() => window.alert(`Login details sent to ${user.email}`)}
                      >
                        <FaEnvelope /> Send Login Details
                      </button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td className="users-empty" colSpan="5">No users found.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="users-pagination-bar">
          <p>Showing {firstEntry} to {lastEntry} of {filteredUsers.length} entries</p>
          <div>
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}><FaArrowLeft /> Prev</button>
            <span>{currentPage}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next <FaArrowRight /></button>
          </div>
        </div>
      </section>

      {showForm && (
        <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
          <section className="users-modal users-form-modal" role="dialog" aria-modal="true" aria-labelledby="users-form-title">
            <header className="users-modal-header">
              <div className="users-title"><span className="users-heading-icon"><FaUser /></span><h3 id="users-form-title">{editingId !== null ? "Edit User" : "Add New User"}</h3></div>
              <button className="users-modal-close" type="button" onClick={closeForm} aria-label="Close"><FaTimes /></button>
            </header>

            <form className="users-form-grid" onSubmit={handleSubmit}>
              <label className="users-field"><span>Role <b className="users-required">*</b></span><select name="role" value={formData.role} onChange={handleChange}><option value="">Select role</option><option>Admin</option><option>Principal</option><option>Teacher</option><option>Student</option><option>Parent</option></select><small>{errors.role}</small></label>
              <label className="users-field"><span>User Name <b className="users-required">*</b></span><input name="userName" value={formData.userName} onChange={handleChange} placeholder="Enter user name" /><small>{errors.userName}</small></label>
              <label className="users-field"><span>Password <b className="users-required">*</b></span><input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Enter password" /><small>{errors.password}</small></label>
              <label className="users-field"><span>Email <b className="users-required">*</b></span><input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter email" /><small>{errors.email}</small></label>
              <label className="users-field"><span>Mobile No. <b className="users-required">*</b></span><input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile number" maxLength="10" /><small>{errors.mobile}</small></label>
              <label className="users-field"><span>Alternate Mobile</span><input name="altMobile" value={formData.altMobile} onChange={handleChange} placeholder="Alternate mobile" /></label>
              <label className="users-field"><span>Alternate Email</span><input name="altEmail" type="email" value={formData.altEmail} onChange={handleChange} placeholder="Alternate email" /></label>
              <label className="users-field"><span>Address</span><textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter address" /></label>
              <label className="users-checkbox-field"><input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} /><span>Is Active?</span></label>

              <div className="users-form-actions">
                <button className="users-save-button" type="submit"><FaSave /> {editingId !== null ? "Update User" : "Save User"}</button>
                <button className="users-clear-button" type="button" onClick={() => { setFormData(emptyForm); setErrors({}); }}><FaEraser /> Clear</button>
                <button className="users-cancel-button" type="button" onClick={closeForm}><FaTimes /> Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedUser && (
        <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedUser(null)}>
          <section className="users-modal users-profile-modal" role="dialog" aria-modal="true" aria-labelledby="user-profile-title">
            <header className="users-profile-header">
              <span className="users-profile-avatar"><FaUser /></span>
              <div><h3 id="user-profile-title">{selectedUser.userName}</h3><p>{selectedUser.role}</p></div>
              <button className="users-modal-close" type="button" onClick={() => setSelectedUser(null)} aria-label="Close"><FaTimes /></button>
            </header>
            <div className="users-profile-grid">
              <div><span>Email</span><strong>{selectedUser.email}</strong></div>
              <div><span>Mobile</span><strong>{selectedUser.mobile}</strong></div>
              <div><span>Alternate Email</span><strong>{selectedUser.altEmail || "—"}</strong></div>
              <div><span>Alternate Mobile</span><strong>{selectedUser.altMobile || "—"}</strong></div>
              <div className="users-profile-wide"><span>Address</span><strong>{selectedUser.address || "—"}</strong></div>
              <div><span>Status</span><strong className={selectedUser.isActive ? "users-profile-active" : "users-profile-inactive"}>{selectedUser.isActive ? "Active" : "Inactive"}</strong></div>
            </div>
            <footer className="users-profile-footer">
              <button className="users-edit-btn" type="button" onClick={() => { setSelectedUser(null); openEditForm(selectedUser); }}><FaEdit /> Edit User</button>
              <button className="users-close-button" type="button" onClick={() => setSelectedUser(null)}>Close</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Users;
