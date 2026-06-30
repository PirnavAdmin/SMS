import React, { useState } from "react";
import "./class.css";
import {
    FaUser,
    FaEdit,
    FaTrash,
    FaSave,
    FaEraser,
    FaArrowLeft,
    FaArrowRight,
} from "react-icons/fa";

const Class = () => {
    const [classList, setClassList] = useState([
        {
            id: 1,
            name: "10th Class",
            description: "Secondary",
            code: "C10",
            isActive: true,
            createdBy: "admin@gmail.com",
        },
        {
            id: 2,
            name: "1st Class",
            description: "Primary",
            code: "C01",
            isActive: true,
            createdBy: "admin@gmail.com",
        },
    ]);

    const emptyForm = {
        id: null,
        name: "",
        description: "",
        code: "",
        isActive: true,
    };

    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [entries, setEntries] = useState(5);
    const [editMode, setEditMode] = useState(false);

    const REQUIRED_MSG = "This field is required";

    const validate = () => {
        let err = {};

        if (!formData.name.trim()) err.name = REQUIRED_MSG;
        if (!formData.description.trim()) err.description = REQUIRED_MSG;
        if (!formData.code.trim()) err.code = REQUIRED_MSG;

        setErrors(err);

        return Object.keys(err).length === 0;
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

    const handleSave = (e) => {
        e.preventDefault();

        if (!validate()) return;

        if (editMode) {
            setClassList(
                classList.map((item) =>
                    item.id === formData.id
                        ? {
                            ...formData,
                            createdBy: item.createdBy,
                        }
                        : item
                )
            );

            setEditMode(false);
        } else {
            setClassList([
                ...classList,
                {
                    ...formData,
                    id: Date.now(),
                    createdBy: "admin@gmail.com",
                },
            ]);
        }

        setFormData(emptyForm);
        setErrors({});
    };

    const handleEdit = (item) => {
        setFormData(item);
        setEditMode(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleDelete = (id) => {
        if (window.confirm("Delete this class?")) {
            setClassList(classList.filter((item) => item.id !== id));
        }
    };

    const handleClear = () => {
        setFormData(emptyForm);
        setErrors({});
        setEditMode(false);
    };

    const filteredData = classList.filter((item) => {
        const keyword = search.toLowerCase();

        return (
            item.name.toLowerCase().includes(keyword) ||
            item.code.toLowerCase().includes(keyword) ||
            item.createdBy.toLowerCase().includes(keyword)
        );
    });

    const indexOfLast = currentPage * entries;
    const indexOfFirst = indexOfLast - entries;

    const currentData = filteredData.slice(
        indexOfFirst,
        indexOfLast
    );

    const totalPages = Math.ceil(
        filteredData.length / entries
    );

    return (
        <div>
            <div style={{ backgroundColor: "#fff" }}>
                <div className="fm-section-title" style={{ paddingTop: 10 }}>
                    <span className="fm-heading-icon">
                        <FaUser />
                    </span>
                    <h4>Dashboard / Configuration / Class</h4>
                </div>
                <form className="class-form">
                    <div className="left-side">
                        <div className="form-group">
                            <label>
                                Name <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={errors.name ? "error-input" : ""}
                            />
                            {errors.name && (
                                <small style={{ color: "red" }}>{errors.name}</small>
                            )}
                        </div>
                        <div className="form-group">
                            <label>
                                Description <span style={{ color: "red" }}>*</span>
                            </label>
                            <textarea
                                rows="3"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={errors.name ? "error-input" : ""}
                            />
                            {errors.description && (
                                <small style={{ color: "red" }}>{errors.description}</small>
                            )}
                        </div>
                    </div>

                    <div className="right-side">
                        <div className="form-group">
                            <label>
                                Code <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className={errors.name ? "error-input" : ""}
                            />
                            {errors.code && (
                                <small style={{ color: "red" }}>{errors.code}</small>
                            )}
                        </div>
                        <label className="checkbox-group">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                            />
                            Is Active?
                        </label>
                    </div>

                    <div className="button-row">
                        <button type="submit" onClick={handleSave}>
                            <FaSave />
                            {editMode ? " Update" : " Save"}
                        </button>
                        <button type="button" onClick={handleClear}>
                            <FaEraser /> Clear
                        </button>
                    </div>
                </form>
            </div>
            <div className="table-section">
                <div className="fm-section-title">
                    <span className="fm-heading-icon">
                        <FaUser />
                    </span>
                    <h4>Class Details</h4>
                </div>
                <div className="table-controls">
                    <div className="show-entry">
                        Show
                        <select
                            value={entries}
                            onChange={(e) => {
                                setEntries(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        entries
                    </div>

                    <div className="search-box">
                        Search:
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="class-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Code</th>
                                <th>Status</th>
                                <th>Created By</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentData.length > 0 ? (
                                currentData.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.description}</td>
                                        <td>{item.code}</td>
                                        <td>{item.isActive ? "Active" : "Inactive"}</td>
                                        <td>{item.createdBy}</td>
                                        <td>
                                            <button
                                                className="edit-btn"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <FaEdit /> Edit
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-record">
                                        No Records Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredData.length > 0 && (
                    <div className="pagination">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <FaArrowLeft />
                        </button>
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index}
                                className={
                                    currentPage === index + 1 ? "active-page" : ""
                                }
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </button>

                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            <FaArrowRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

};

export default Class;