import { useState, useEffect } from "react";
import {
  FaTrash,
  FaSearch,
  FaSave,
  FaTimes,
  FaEdit,
  FaUserShield,
  FaList,
  FaDesktop,
} from "react-icons/fa";
import "./Role.css";

function Role() {

  const roleOptions = [
    "Admin",
    "Principal",
    "Teacher",
    "Accountant",
    "Receptionist",
    "Student",
    "Parent",
  ];

  const menuOptions = [
    "Dashboard",
    "Student",
    "Employee",
    "Attendance",
    "Examination",
    "Fees",
    "Library",
    "Transport",
    "Settings",
  ];

  const screenOptions = {
    Dashboard: [
      "Dashboard",
      "Analytics",
      "Notifications",
    ],

    Student: [
      "Student Master",
      "Student Attendance",
      "Student Promotion",
    ],

    Employee: [
      "Employee Master",
      "Employee Attendance",
      "Payroll",
    ],

    Attendance: [
      "Mark Attendance",
      "Attendance Report",
    ],

    Examination: [
      "Exam Schedule",
      "Marks Entry",
      "Results",
    ],

    Fees: [
      "Fee Collection",
      "Fee Report",
    ],

    Library: [
      "Books",
      "Issue Book",
      "Return Book",
    ],

    Transport: [
      "Vehicle",
      "Route",
      "Driver",
    ],

    Settings: [
      "Role Management",
      "User Management",
    ],
  };

  const defaultRoles = [
    {
      id: 1,
      role: "Admin",
      menu: "Dashboard",
      screen: "Dashboard",
    },
    {
      id: 2,
      role: "Teacher",
      menu: "Student",
      screen: "Student Attendance",
    },
    {
      id: 3,
      role: "Principal",
      menu: "Examination",
      screen: "Results",
    },
    {
      id: 4,
      role: "Accountant",
      menu: "Fees",
      screen: "Fee Collection",
    },
    {
      id: 5,
      role: "Receptionist",
      menu: "Student",
      screen: "Student Master",
    },
  ];

  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem("roles");

    return saved
      ? JSON.parse(saved)
      : defaultRoles;
  });

  const [role, setRole] = useState("");
  const [menu, setMenu] = useState("");
  const [screen, setScreen] = useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [entriesPerPage, setEntriesPerPage] =
    useState(5);

  const [editingId, setEditingId] =
    useState(null);

  const [errors, setErrors] = useState({
    role: "",
    menu: "",
    screen: "",
  });

  useEffect(() => {
    localStorage.setItem(
      "roles",
      JSON.stringify(roles)
    );
  }, [roles]);

  const filteredRoles = roles.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.role.toLowerCase().includes(search) ||
      item.menu.toLowerCase().includes(search) ||
      item.screen.toLowerCase().includes(search)
    );
  });

  const indexOfLastRole =
    currentPage * entriesPerPage;

  const indexOfFirstRole =
    indexOfLastRole - entriesPerPage;

  const currentRoles = filteredRoles.slice(
    indexOfFirstRole,
    indexOfLastRole
  );

  const totalPages = Math.ceil(
    filteredRoles.length / entriesPerPage
  );

  const saveRole = () => {

    let newErrors = {};

    if (!role) {
      newErrors.role = "Role is required";
    }

    if (!menu) {
      newErrors.menu =
        "Main Menu is required";
    }

    if (!screen) {
      newErrors.screen =
        "Screen is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0)
      return;

    const newRole = {
      id: editingId
        ? editingId
        : Date.now(),
      role,
      menu,
      screen,
    };

    let updatedRoles;

    if (editingId) {

      updatedRoles = roles.map((item) =>
        item.id === editingId
          ? newRole
          : item
      );

    } else {

      updatedRoles = [
        ...roles,
        newRole,
      ];

    }

    setRoles(updatedRoles);

    clearForm();
  };

  const clearForm = () => {

    setRole("");
    setMenu("");
    setScreen("");

    setEditingId(null);

    setErrors({
      role: "",
      menu: "",
      screen: "",
    });

  };

  const editRole = (item) => {

    setEditingId(item.id);

    setRole(item.role);

    setMenu(item.menu);

    setScreen(item.screen);

  };

  const deleteRole = (id) => {

    setRoles(
      roles.filter(
        (item) => item.id !== id
      )
    );

  };

  return (

    <div className="role-page">

      <div className="section-header">
        <h3>
          🔐 Configuration / Role Based Screens Master
        </h3>
      </div>

      <div className="role-form-card">
                <div className="form-row">

          <div className="form-group">
            <label>
              <FaUserShield /> Role
              <span className="required">*</span>
            </label>

            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setErrors({
                  ...errors,
                  role: "",
                });
              }}
            >
              <option value="">Select Role</option>

              {roleOptions.map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="error-text">
              {errors.role}
            </div>
          </div>

          <div className="form-group">
            <label>
              <FaList /> Main Menu
              <span className="required">*</span>
            </label>

            <select
              value={menu}
              onChange={(e) => {
                setMenu(e.target.value);
                setScreen("");
                setErrors({
                  ...errors,
                  menu: "",
                });
              }}
            >
              <option value="">
                Select Main Menu
              </option>

              {menuOptions.map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="error-text">
              {errors.menu}
            </div>
          </div>

        </div>

          <div className="form-group">
            <label>
              <FaDesktop /> Screen
              <span className="required">*</span>
            </label>

            <select
              value={screen}
              onChange={(e) => {
                setScreen(e.target.value);
                setErrors({
                  ...errors,
                  screen: "",
                });
              }}
            >
              <option value="">
                Select Screen
              </option>

              {menu &&
                screenOptions[menu].map(
                  (item, index) => (
                    <option
                      key={index}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
            </select>

            <div className="error-text">
              {errors.screen}
            </div>
          </div>

        

        

        <div className="button-group">

          <button
            className="save-btn"
            onClick={saveRole}
          >
            <FaSave />
            <span>
              {editingId ? "Update" : "Save"}
            </span>
          </button>

          <button
            className="cancel-btn"
            onClick={clearForm}
          >
            <FaTimes />
            <span>Clear</span>
          </button>

        </div>

      </div>

      <div className="section-header">
        <h3>📋 Roles Details</h3>
      </div>

      <div className="table-card">

        <div className="table-top">

          <div className="entries-section">

            <span>Show</span>

            <select
              className="entries"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(
                  Number(e.target.value)
                );
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>

            <span>Entries</span>

          </div>

          <div className="search-wrapper">

            <div className="search-container">

              <FaSearch className="search-icon" />

              <input
                type="text"
                placeholder="Search"
                className="search-box"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(
                    e.target.value
                  );
                  setCurrentPage(1);
                }}
              />

            </div>

          </div>

        </div>

        <table>

          <thead>

            <tr>
              <th>Role</th>
              <th>Main Menu</th>
              <th>Screen</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            {filteredRoles.length > 0 ? (

              currentRoles.map((item) => (

                <tr key={item.id}>

                  <td>{item.role}</td>

                  <td>{item.menu}</td>

                  <td>{item.screen}</td>

                  <td className="action-cell">

                    <div className="action-buttons">

                      <button
                        className="icon-edit"
                        onClick={() =>
                          editRole(item)
                        }
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="icon-delete"
                        onClick={() =>
                          deleteRole(item.id)
                        }
                      >
                        <FaTrash />
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No Roles Found
                </td>

              </tr>

            )}

          </tbody>

        </table>

        <div className="table-footer">

          <span>
            Showing{" "}
            {filteredRoles.length === 0
              ? 0
              : indexOfFirstRole + 1}
            {" "}to{" "}
            {indexOfFirstRole +
              currentRoles.length}
            {" "}of{" "}
            {filteredRoles.length} entries
          </span>

          <div className="pagination">

            <button
              className="arrow-btn"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  currentPage - 1
                )
              }
            >
              ◀
            </button>

            <span className="page-indicator">
              Page {currentPage} of{" "}
              {totalPages}
            </span>

            <button
              className="arrow-btn"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  currentPage + 1
                )
              }
            >
              ▶
            </button>

          </div>

        </div>

      </div>

    </div>

  );
}

export default Role;