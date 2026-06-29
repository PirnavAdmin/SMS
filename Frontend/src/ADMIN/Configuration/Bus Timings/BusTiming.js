import React, { useState } from "react";
import "./BusTiming.css";

function BusTiming() {
  const [formData, setFormData] = useState({
    busTime: "",
    active: true,
  });

  const [search, setSearch] = useState("");

  const [busTimings, setBusTimings] = useState([
    {
      id: 1,
      busTime: "07:00 A.M",
      status: "Active",
      createdBy: "admin@gmail.com",
    },
    {
      id: 2,
      busTime: "07:05 A.M",
      status: "Active",
      createdBy: "admin@gmail.com",
    },
    {
      id: 3,
      busTime: "07:10 A.M",
      status: "Active",
      createdBy: "admin@gmail.com",
    },
  ]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const formatTime = (time) => {
    if (!time) return "";

    const [hour, minute] = time.split(":");
    let h = Number(hour);
    const suffix = h >= 12 ? "P.M" : "A.M";

    h = h % 12 || 12;

    return `${String(h).padStart(2, "0")}:${minute} ${suffix}`;
  };

  const handleSave = () => {
    if (formData.busTime === "") {
      alert("Please select bus time.");
      return;
    }

    const newTiming = {
      id: Date.now(),
      busTime: formatTime(formData.busTime),
      status: formData.active ? "Active" : "Inactive",
      createdBy: "admin@gmail.com",
    };

    setBusTimings([...busTimings, newTiming]);

    setFormData({
      busTime: "",
      active: true,
    });
  };

  const handleClear = () => {
    setFormData({
      busTime: "",
      active: true,
    });
  };

  const handleDelete = (id) => {
    const updated = busTimings.filter((item) => item.id !== id);
    setBusTimings(updated);
  };

  const handleEdit = (row) => {
    setFormData({
      busTime: "",
      active: row.status === "Active",
    });

    handleDelete(row.id);
  };

  const filteredData = busTimings.filter((item) => {
    return (
      item.busTime.toLowerCase().includes(search.toLowerCase()) ||
      item.status.toLowerCase().includes(search.toLowerCase()) ||
      item.createdBy.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="busTimingContainer">
            {/* Form Card */}

      <div className="timingCard">
        <div className="timingHeader">
          <span className="timingIcon">⏱</span>
          <span>Bus Timings</span>
        </div>

        <div className="timingBody">
          <div className="timingFormGrid">

            <div className="timingFormGroup">
              <label>
                Time <span>*</span>
              </label>

              <input
                type="time"
                name="busTime"
                value={formData.busTime}
                onChange={handleChange}
              />
            </div>

            <div className="timingActiveGroup">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />

              <label>IsActive?</label>
            </div>

            <div className="timingButtonRow">
              <button className="timingSaveButton" onClick={handleSave}>
                Save
              </button>

              <button className="timingClearButton" onClick={handleClear}>
                Clear
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Table Card */}

      <div className="timingCard timingTableCard">
        <div className="timingHeader">
          <span className="timingIcon">⏱</span>
          <span>Bus Timings</span>
        </div>

        <div className="timingTableBody">
          <div className="timingTableTop">

            <div className="timingShowEntries">
              <span>Show</span>

              <select>
                <option>100</option>
                <option>50</option>
                <option>25</option>
                <option>10</option>
              </select>

              <span>entries</span>
            </div>

            <div className="timingSearchBox">
              <label>Search:</label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

          </div>

          <div className="timingTableResponsive">
            <table className="busTimingTable">
              <thead>
                <tr>
                  <th>Bus Time</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.id}>
                      <td>{row.busTime}</td>
                      <td>{row.status}</td>
                      <td>{row.createdBy}</td>
                      <td>
                        <button
                          className="timingEditButton"
                          onClick={() => handleEdit(row)}
                        >
                          Edit
                        </button>

                        <button
                          className="timingDeleteButton"
                          onClick={() => handleDelete(row.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="timingNoData">
                      No Records Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
  );
}

export default BusTiming;