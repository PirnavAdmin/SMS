import React from "react";
import { FaEdit, FaTrash, FaSort } from "react-icons/fa";

const UniformFeeList = ({ data, onEdit, onDelete }) => {
  return (
    <>
      <div className="section-header">Rs Uniform Fee Configuration Details</div>

      <div className="uniform-card">
        <div className="table-top">
          <div>
            Show
            <select>
              <option>10</option>
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            entries
          </div>

          <div>
            Search :
            <input type="text" />
          </div>
        </div>

        <table className="uniform-table">
          <thead>
            <tr>
              <th>
                Academic Year <FaSort />
              </th>

              <th>
                Name <FaSort />
              </th>

              <th>
                Gender <FaSort />
              </th>

              <th>
                Size <FaSort />
              </th>

              <th>
                Fee <FaSort />
              </th>

              <th>
                Created By <FaSort />
              </th>

              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="7" align="center">
                  No Records Found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  <td>{item.academicYear}</td>
                  <td>{item.uniformName}</td>
                  <td>{item.gender}</td>
                  <td>{item.size}</td>
                  <td>{item.fee}</td>
                  <td>{item.createdBy}</td>

                  <td>
                    <button className="edit-btn" onClick={() => onEdit(item)}>
                      <FaEdit />
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => onDelete(item.id)}
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UniformFeeList;
