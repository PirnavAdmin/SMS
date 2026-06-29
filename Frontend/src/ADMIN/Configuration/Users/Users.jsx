import React, { useState } from "react";
import { FaEdit, FaEnvelope, FaTrash, FaUser, FaSearch, FaSave, FaEraser, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import '../../Configuration/Users/users.css'

const Users = () => {
    const [formData, setFormData] = useState({
        role: "",
        userName: "",
        password: "",
        email: "",
        mobile: "",
        altEmail: "",
        altMobile: "",
        address: "",
        isActive: false,
    });
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(5);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        let newErrors = {};

        if (!formData.role.trim()) {
            newErrors.role = "Please select Role ID";
        }

        if (!formData.userName.trim()) {
            newErrors.userName = "Please enter Username";
        }

        if (!formData.password.trim()) {
            newErrors.password = "Please enter Password";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Please enter Email";
        } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
        ) {
            newErrors.email = "Please enter a valid Email";
        }

        if (!formData.mobile.trim()) {
            newErrors.mobile = "Please enter Mobile Number";
        } else if (!/^\d{10}$/.test(formData.mobile)) {
            newErrors.mobile = "Mobile Number must be 10 digits";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });

        setErrors({
            ...errors,
            [name]: "",
        });
    };

    const handleSave = () => {
        if (!validateForm()) {
            return;
        }
        if (
            !formData.role ||
            !formData.userName ||
            !formData.password ||
            !formData.email
        ) {
            alert("Please fill required fields");
            return;
        }

        setUsers([...users, formData]);
        setFormData({
            role: "",
            userName: "",
            password: "",
            email: "",
            mobile: "",
            altEmail: "",
            altMobile: "",
            address: "",
            isActive: true,
        });
        setErrors({});
        setShowForm(false);
    };

    const handleDelete = (index) => {
        const updatedUsers = users.filter((_, i) => i !== index);

        setUsers(updatedUsers);

        const newTotalPages = Math.ceil(updatedUsers.length / usersPerPage);

        if (currentPage > newTotalPages && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const filteredUsers = users.filter((user) =>
        user.userName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.role.toLowerCase().includes(search.toLowerCase()) ||
        user.mobile.includes(search)
    );

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;

    const currentUsers = filteredUsers.slice(
        indexOfFirstUser,
        indexOfLastUser
    );

    const totalPages = Math.ceil(
        filteredUsers.length / usersPerPage
    );

    return (
        <div style={styles.container}>
            {showForm && (
                <div style={styles.card}>
                    <div style={styles.header}>
                        <div style={styles.headerIcon}>
                            <FaUser style={styles.icon} />
                        </div>
                        <span> Dashboard / Configuration / Users</span>
                    </div>

                    <div style={styles.grid}>
                        <div style={styles.field}>
                            <label style={styles.label}>
                                Role ID: <span style={{ color: "red" }}>*</span>
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                style={{
                                    ...styles.input,
                                    ...(errors.role ? styles.errorInput : {}),
                                }}
                            >
                                <option value="">--Select--</option>
                                <option>Admin</option>
                                <option>Principal</option>
                                <option>Student</option>
                            </select>
                            {errors.role && (
                                <span style={styles.errorText}>{errors.role}</span>
                            )}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>
                                User Name: <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="userName"
                                value={formData.userName}
                                onChange={handleChange}
                                style={{
                                    ...styles.input,
                                    ...(errors.userName ? styles.errorInput : {}),
                                }}
                            />
                            {errors.userName && (
                                <span style={styles.errorText}>{errors.userName}</span>
                            )}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>
                                Password: <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                style={{
                                    ...styles.input,
                                    ...(errors.password ? styles.errorInput : {}),
                                }}
                            />
                            {errors.password && (
                                <span style={styles.errorText}>{errors.password}</span>
                            )}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>
                                Email: <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={{
                                    ...styles.input,
                                    ...(errors.email ? styles.errorInput : {}),
                                }}
                            />
                            {errors.email && (
                                <span style={styles.errorText}>{errors.email}</span>
                            )}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>
                                Mobile No: <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                style={{
                                    ...styles.input,
                                    ...(errors.mobile ? styles.errorInput : {}),
                                }}
                            />
                            {errors.mobile && (
                                <span style={styles.errorText}>{errors.mobile}</span>
                            )}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Alt Mobile:</label>
                            <input
                                type="text"
                                name="altMobile"
                                value={formData.altMobile}
                                onChange={handleChange}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Alt Email:</label>
                            <input
                                type="email"
                                name="altEmail"
                                value={formData.altEmail}
                                onChange={handleChange}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Address:</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                style={styles.textarea}
                            />
                        </div>

                        <div style={styles.checkboxWrap}>
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                            />
                            <span>Is Active?</span>
                        </div>
                    </div>

                    <div style={styles.buttonContainer}>
                        <button className="btn" style={styles.saveBtn} onClick={handleSave}>
                            <FaSave />
                            Save
                        </button>
                        <button
                            className="btn"
                            style={styles.clearBtn}
                            onClick={() =>
                                setFormData({
                                    role: "",
                                    userName: "",
                                    password: "",
                                    email: "",
                                    mobile: "",
                                    altEmail: "",
                                    altMobile: "",
                                    address: "",
                                    isActive: true,
                                })
                            }
                        >
                            <FaEraser />
                            Clear
                        </button>
                    </div>
                </div>
            )}
            <div style={styles.card}>
                <div style={styles.userHeader}>
                    <div style={styles.leftHeader}>
                        <div style={styles.headerIcon}>
                            <FaUser style={styles.icon} />
                        </div>
                        <span>User Details</span>
                    </div>

                    <button
                        className="btn"
                        style={styles.addUserBtn}
                        onClick={() => setShowForm(true)}
                    >
                        Add User
                    </button>
                </div>

                <div style={styles.tableControls}>
                    <div style={styles.leftControls}>
                        <label>Show </label>
                        <select
                            style={styles.selectBox}
                            value={usersPerPage}
                            onChange={(e) => {
                                setUsersPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <label> entries</label>
                    </div>
                    <div style={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={styles.searchBox}
                        />
                        <FaSearch style={styles.searchIcon} />
                    </div>
                </div>

                <div style={{ padding: 10 }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Mobile</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>

                        <tbody style={{ textAlign: 'center' }}>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={styles.noData}>
                                        No Users Added
                                    </td>
                                </tr>
                            ) : (
                                currentUsers.map((user, index) => (
                                    <tr key={index}>
                                        <td style={styles.td}>{user.userName}</td>
                                        <td style={styles.td}>{user.email}</td>
                                        <td style={styles.td}>{user.role}</td>
                                        <td style={styles.td}>{user.mobile}</td>
                                        <td style={styles.td}>
                                            <button className="btn" style={styles.editBtn}><FaEdit /></button>
                                            <button
                                                className="btn"
                                                style={styles.deleteBtn}
                                                onClick={() =>
                                                    handleDelete(indexOfFirstUser + index)
                                                }
                                            >
                                                <FaTrash />
                                            </button>
                                            <button className="btn" style={styles.loginBtn}>
                                                <FaEnvelope />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {filteredUsers.length > 0 && (
                        <div style={styles.paginationContainer}>
                            <button
                                className="btn"
                                style={styles.pageBtn}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                <FaArrowLeft size={12} />
                            </button>

                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index}
                                    className="btn"
                                    style={{
                                        ...styles.pageBtn,
                                        background:
                                            currentPage === index + 1
                                                ? "linear-gradient(to right,#8e44ad,#3f51b5)"
                                                : "#fff",
                                        color:
                                            currentPage === index + 1
                                                ? "#fff"
                                                : "#000",
                                    }}
                                    onClick={() => setCurrentPage(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            ))}
                            <button
                                className="btn"
                                style={styles.pageBtn}
                                disabled={
                                    currentPage === totalPages || totalPages === 0
                                }
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                <FaArrowRight size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        fontFamily: "Arial, sans-serif",
    },
    icon: {
        fontSize: "14px",
    },
    roleRows: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "15px",
        padding: "20px",
    },
    card: {
        borderRadius: "5px",
        overflow: "hidden",
        marginBottom: "15px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        background: "#fff"
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderBottom: "1px solid #f0f0f0",
        background: "#fff",
        fontSize: "16px",
        fontWeight: "600",
    },
    headerIcon: {
        width: "35px",
        height: "35px",
        borderRadius: "20px",
        background: "linear-gradient(135deg,#8e44ad,#3f51b5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        boxShadow: "0 4px 10px rgba(142,68,173,0.25)",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "15px",
        padding: "20px",
    },
    field: {
        display: "flex",
        flexDirection: "column",
    },
    label: {
        marginBottom: "6px",
        fontSize: "14px",
        fontWeight: "700",
    },
    input: {
        height: "32px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "0 5px",
    },
    textarea: {
        height: "auto",
        border: "1px solid #ccc",
        borderRadius: "4px",
    },
    checkboxWrap: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "30px",
    },
    buttonContainer: {
        padding: "13px",
        display: "flex",
        justifyContent: "flex-start",
        gap: "10px",
        marginLeft: "5px"
    },
    saveBtn: {
        background: "linear-gradient(to right,#8e44ad,#3f51b5)",
        color: "#fff",
        border: "none",
        padding: "8px 10px",
        borderRadius: "4px",
        cursor: "pointer",
        marginRight: "10px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },
    clearBtn: {
        background: "white",
        border: "none",
        padding: "8px 10px",
        borderRadius: "4px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        border: "1px solid #ebe0e0",
    },
    th: {
        background: "linear-gradient(to right,#8e44ad,#3f51b5)",
        color: "#fff",
        padding: "10px",
        textAlign: "left",
        border: "1px solid #ebe0e0",
    },
    td: {
        padding: "10px",
        border: "1px solid #ebe0e0",
    },
    noData: {
        textAlign: "center",
        padding: "20px",
    },
    tableControls: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 15px",
    },
    leftControls: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
    },
    selectBox: {
        padding: "5px",
        border: "1px solid #ccc",
        borderRadius: "4px",
    },
    searchContainer: {
        position: "relative",
        display: "inline-block",
    },
    searchBox: {
        width: "220px",
        height: "36px",
        padding: "0 35px 0 10px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        outline: "none",
    },
    searchIcon: {
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "#3b23a8",
        fontSize: "14px",
        pointerEvents: "none",
    },
    editBtn: {
        background: "linear-gradient(to right,#8e44ad,#3f51b5)",
        color: "#fff",
        border: "none",
        padding: "5px 10px",
        borderRadius: "4px",
        marginRight: "5px",
        cursor: "pointer",
    },
    loginBtn: {
        background: "#1976d2",
        color: "#fff",
        border: "none",
        padding: "5px 10px",
        borderRadius: "4px",
        marginLeft: "5px",
        cursor: "pointer",
        marginTop: "5px"
    },
    deleteBtn: {
        background: "#e53935",
        color: "#fff",
        border: "none",
        padding: "5px 12px",
        borderRadius: "4px",
        cursor: "pointer",
    },
    userHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        borderBottom: "1px solid #f0f0f0",
        fontWeight: "600",
        fontSize: "16px",
    },
    leftHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    addUserBtn: {
        background: "#0c9e30",
        color: "#ecf1f1",
        border: "none",
        padding: "8px 14px",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "600",
    },
    paginationContainer: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "5px",
        padding: "8px",
        marginTop: 10
    },
    pageBtn: {
        padding: "4px 10px",
        border: "1px solid lightgray",
        cursor: "pointer",
        color: "black"
    },
    errorInput: {
        border: "1px solid red",
    },
    errorText: {
        color: "red",
        fontSize: "12px",
        marginTop: "4px",
    },
};


export default Users;