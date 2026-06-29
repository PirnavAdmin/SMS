import React from "react";
import { FaEdit, FaTrash, FaUser, FaSort, FaSearch } from "react-icons/fa";

const UniformSettingList = ({
  data,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
}) => {
  return (
    <>
      {/* Header */}
      <div className="section-header">
        <FaUser />
        <span>Uniform Settings Details</span>
      </div>

      <div className="uniform-card">
        {/* Table Controls */}
        <div className="table-top">
          <div>
            Show{" "}
            <select className="entry-select">
              <option>10</option>
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>{" "}
            entries
          </div>

          {/* Search Box */}
          <div className="search-box-container">
            <FaSearch className="search-icon" />

            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <table className="uniform-table">
          <thead>
            <tr>
              <th>
                Academic Year <FaSort />
              </th>

              <th>
                Class <FaSort />
              </th>

              <th>
                Uniform <FaSort />
              </th>

              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-records">
                  No Records Found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  <td>{item.academicYear}</td>

                  <td>{item.className}</td>

                  <td>
                    {item.uniforms.map((uniform, index) => (
                      <div key={index} className="uniform-item">
                        {uniform}
                      </div>
                    ))}
                  </td>

                  <td className="action-buttons">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => onEdit(item)}
                    >
                      <FaEdit /> Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => onDelete(item.id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination-section">
          <div>
            Showing {data.length > 0 ? 1 : 0} to {data.length} of {data.length}{" "}
            entries
          </div>

          <div className="pagination">
            <button type="button" disabled>
              Previous
            </button>

            <button type="button" className="active-page">
              1
            </button>

            <button type="button" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UniformSettingList;
