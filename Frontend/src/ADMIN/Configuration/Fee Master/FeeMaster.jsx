import React, { useState } from "react";
import { FaRupeeSign, FaEdit, FaTrash, FaSearch, FaArrowLeft, FaArrowRight, FaSave } from "react-icons/fa";

const FeeMaster = () => {
    const [feeType, setFeeType] = useState("");
    const [fees, setFees] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(5);
    const [editIndex, setEditIndex] = useState(null);
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!feeType.trim()) {
            setError("Please enter Fee type name");
            return;
        }

        if (editIndex !== null) {
            const updatedFees = [...fees];
            updatedFees[editIndex].feeName = feeType;
            setFees(updatedFees);
            setEditIndex(null);
        } else {
            setFees([
                ...fees,
                {
                    feeName: feeType,
                },
            ]);
        }

        setFeeType("");
        setError("");
    };

    const handleEdit = (index) => {
        setFeeType(fees[index].feeName);
        setEditIndex(index);
    };

    const handleDelete = (index) => {
        const updatedFees = fees.filter((_, i) => i !== index);
        setFees(updatedFees);

        const newTotalPages = Math.ceil(
            updatedFees.length / usersPerPage
        );

        if (currentPage > newTotalPages && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const filteredFees = fees.filter((fee) =>
        fee.feeName.toLowerCase().includes(search.toLowerCase())
    );

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;

    const currentFees = filteredFees.slice(
        indexOfFirstUser,
        indexOfLastUser
    );

    const totalPages = Math.ceil(
        filteredFees.length / usersPerPage
    );

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.headerIcon}>
                        <FaRupeeSign style={styles.icon} />
                    </div>
                    <span>Fee Types</span>
                </div>

                <div style={styles.formContainer}>
                    <label style={styles.label}>
                        Fee Type Name
                        <span style={{ color: "red" }}> *</span>
                    </label>
                    <div style={styles.inputWrapper}>
                        <div style={styles.iconBox}>
                            <FaSave
                                style={{
                                    color: "#777",
                                    fontSize: "14px",
                                    transform: "scaleX(-1)",
                                }}
                            />
                        </div>
                        <input
                            type="text"
                            value={feeType}
                            onChange={(e) => {
                                setFeeType(e.target.value);
                                setError("");
                            }}
                            style={{
                                ...styles.input,
                                ...(error ? styles.errorInput : {}),
                            }}
                        />
                    </div>
                    <button
                        className="btn"
                        style={styles.saveBtn}
                        onClick={handleSave}
                    >
                        {editIndex !== null ? "Update" : "Save"}
                    </button>
                </div>

                {error && (
                    <div
                        style={{
                            color: "red",
                            padding: "0px 20px 15px",
                            fontSize: "13px",
                        }}
                    >
                        {error}
                    </div>
                )}
            </div>

            <div style={styles.card}>
                <div style={styles.userHeader}>
                    <div style={styles.headerIcon}>
                        <FaRupeeSign style={styles.icon} />
                    </div>
                    <span> Fee Master Details</span>
                </div>

                <div style={styles.tableControls}>
                    <div style={styles.leftControls}>
                        <label>Show </label>

                        <select
                            style={styles.selectBox}
                            value={usersPerPage}
                            onChange={(e) => {
                                setUsersPerPage(
                                    Number(e.target.value)
                                );
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
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            style={styles.searchBox}
                        />
                        <FaSearch style={styles.searchIcon} />
                    </div>
                </div>

                <div style={{ padding: 10 }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>
                                    Fee Names
                                </th>
                                <th
                                    style={{
                                        ...styles.th,
                                        textAlign: "center",
                                    }}
                                >
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentFees.length === 0 ? (
                                <tr>
                                    <td colSpan="2" style={styles.noData}>
                                        No Fee Types Added
                                    </td>
                                </tr>
                            ) : (
                                currentFees.map((fee, index) => {
                                    const rowStyle = {
                                        backgroundColor:
                                            index % 2 === 0
                                                ? "#eef5f6"
                                                : "#ffffff",
                                    };

                                    return (
                                        <tr key={index}>
                                            <td
                                                style={{
                                                    ...styles.td,
                                                    ...rowStyle,
                                                }}
                                            >
                                                {fee.feeName}
                                            </td>

                                            <td
                                                style={{
                                                    ...styles.td,
                                                    ...rowStyle,
                                                    textAlign: "center",
                                                }}
                                            >
                                                <button
                                                    className="btn"
                                                    style={styles.editBtn}
                                                    onClick={() =>
                                                        handleEdit(
                                                            indexOfFirstUser +
                                                            index
                                                        )
                                                    }
                                                >
                                                    <FaEdit />
                                                </button>

                                                <button
                                                    className="btn"
                                                    style={styles.deleteBtn}
                                                    onClick={() =>
                                                        handleDelete(
                                                            indexOfFirstUser +
                                                            index
                                                        )
                                                    }
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {filteredFees.length > 0 && (
                        <div
                            style={
                                styles.paginationContainer
                            }
                        >
                            <button
                                className="btn"
                                style={styles.pageBtn}
                                disabled={currentPage === 1}
                                onClick={() =>
                                    setCurrentPage(
                                        currentPage - 1
                                    )
                                }
                            >
                                <FaArrowLeft size={12} />
                            </button>

                            {[...Array(totalPages)].map(
                                (_, index) => (
                                    <button
                                        key={index}
                                        className="btn"
                                        style={{
                                            ...styles.pageBtn,
                                            background:
                                                currentPage ===
                                                    index + 1
                                                    ? "linear-gradient(to right,#8e44ad,#3f51b5)"
                                                    : "#fff",
                                            color:
                                                currentPage ===
                                                    index + 1
                                                    ? "#fff"
                                                    : "#000",
                                        }}
                                        onClick={() =>
                                            setCurrentPage(
                                                index + 1
                                            )
                                        }
                                    >
                                        {index + 1}
                                    </button>
                                )
                            )}

                            <button
                                className="btn"
                                style={styles.pageBtn}
                                disabled={
                                    currentPage === totalPages
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        currentPage + 1
                                    )
                                }
                            >
                                <FaArrowRight size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

const styles = {
    container: {
        fontFamily: "Arial, sans-serif",
    },
    card: {
        borderRadius: "5px",
        overflow: "hidden",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        background: "#fff",
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

    icon: {
        fontSize: "16px",
    },
    userHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderBottom: "1px solid #f0f0f0",
        background: "#fff",
        fontSize: "16px",
        fontWeight: "600",
    },
    formContainer: {
        padding: "12px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
    },
    label: {
        fontSize: "14px",
        fontWeight: "700",
    },
    inputWrapper: {
        display: "flex",
        alignItems: "center",
    },
    iconBox: {
        width: "42px",
        height: "38px",
        border: "1px solid #ccc",
        borderRight: "none",
        background: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px 0 0 4px",
    },
    input: {
        height: "38px",
        width: "250px",
        border: "1px solid #ccc",
        borderRadius: "0 4px 4px 0",
        padding: "0 10px",
        outline: "none",
    },
    errorInput: {
        border: "1px solid red",
    },
    saveBtn: {
        background: "linear-gradient(to right,#8e44ad,#3f51b5)",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: "4px",
        cursor: "pointer",
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
        color: "linear-gradient(to right,#8e44ad,#3f51b5)",
        fontSize: "14px",
        pointerEvents: "none",
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
        padding: "5px",
        border: "1px solid #ebe0e0",
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
    deleteBtn: {
        background: "#e53935",
        color: "#fff",
        border: "none",
        padding: "6px 12px",
        borderRadius: "4px",
        cursor: "pointer",
    },
    noData: {
        textAlign: "center",
        padding: "20px",
    },
    paginationContainer: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "5px",
        padding: "8px",
        marginTop: 10,
    },
    pageBtn: {
        padding: "4px 10px",
        border: "1px solid lightgray",
        cursor: "pointer",
        color: "black"
    },
};

export default FeeMaster;