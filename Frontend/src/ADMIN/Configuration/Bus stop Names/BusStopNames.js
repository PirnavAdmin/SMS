import React, { useState } from "react";
import "./busStopNames.css";

function BusStopNames() {

  //=============================
  // Dropdown Data
  //=============================

  const routeList = [
    "ATMAKURU",
    "GUDUR",
    "KAVALI",
    "KOVUR",
    "NELLORE"
  ];

  const busList = [
    "AP15Y7409",
    "AP16AB1234",
    "AP16CD5678",
    "AP16EF9012"
  ];

  //=============================
  // Form State
  //=============================

  const [formData, setFormData] = useState({
    routeName: "",
    busRegNo: "",
    stopName: "",
    distance: "",
    active: true
  });

  //=============================
  // Search
  //=============================

  const [search, setSearch] = useState("");

  //=============================
  // Table Data
  //=============================

  const [busStops, setBusStops] = useState([
    {
      id: 1,
      routeName: "ATMAKURU",
      busRegNo: "AP15Y7409",
      stopName: "ATMAKURU",
      distance: "45.00",
      status: "Active",
      createdBy: "admin@gmail.com"
    }
  ]);

  //=============================
  // Handle Inputs
  //=============================

  const handleChange = (e) => {

    const { name, value, checked, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

  };

  //=============================
  // Save
  //=============================

  const handleSave = () => {

    if (
      formData.routeName === "" ||
      formData.busRegNo === "" ||
      formData.stopName === "" ||
      formData.distance === ""
    ) {
      alert("Please fill all mandatory fields.");
      return;
    }

    const newStop = {
      id: Date.now(),
      routeName: formData.routeName,
      busRegNo: formData.busRegNo,
      stopName: formData.stopName,
      distance: formData.distance,
      status: formData.active ? "Active" : "Inactive",
      createdBy: "admin@gmail.com"
    };

    setBusStops([...busStops, newStop]);

    setFormData({
      routeName: "",
      busRegNo: "",
      stopName: "",
      distance: "",
      active: true
    });

  };

  //=============================
  // Clear
  //=============================

  const handleClear = () => {

    setFormData({
      routeName: "",
      busRegNo: "",
      stopName: "",
      distance: "",
      active: true
    });

  };

  //=============================
  // Delete
  //=============================

  const handleDelete = (id) => {

    const updated = busStops.filter((item) => item.id !== id);

    setBusStops(updated);

  };

  //=============================
  // Edit
  //=============================

  const handleEdit = (row) => {

    setFormData({
      routeName: row.routeName,
      busRegNo: row.busRegNo,
      stopName: row.stopName,
      distance: row.distance,
      active: row.status === "Active"
    });

    handleDelete(row.id);

  };

  //=============================
  // Search Filter
  //=============================

  const filteredData = busStops.filter((item) => {

    return (

      item.routeName.toLowerCase().includes(search.toLowerCase()) ||

      item.busRegNo.toLowerCase().includes(search.toLowerCase()) ||

      item.stopName.toLowerCase().includes(search.toLowerCase())

    );

  });

  //=============================
  // JSX STARTS
  //=============================

  return (

    <div className="busStopContainer">

      <div className="pageCard">

        <div className="pageHeader">

          <span className="headerIcon">
            🚌
          </span>

          <span>
            Bus Stop Names
          </span>

        </div>

        <div className="pageBody">

          <div className="formGrid">

            {/* Route Name */}

            <div className="formGroup">

              <label>
                Route Name <span>*</span>
              </label>

              <select
                name="routeName"
                value={formData.routeName}
                onChange={handleChange}
              >

                <option value="">
                  --Select--
                </option>

                {routeList.map((item, index) => (

                  <option
                    key={index}
                    value={item}
                  >
                    {item}
                  </option>

                ))}

              </select>

            </div>

            {/* Bus Reg */}

            <div className="formGroup">

              <label>
                Bus Reg. No <span>*</span>
              </label>

              <select
                name="busRegNo"
                value={formData.busRegNo}
                onChange={handleChange}
              >

                <option value="">
                  --Select--
                </option>

                {busList.map((item, index) => (

                  <option
                    key={index}
                    value={item}
                  >
                    {item}
                  </option>

                ))}

              </select>

            </div>

            {/* Stop Name */}

            <div className="formGroup">

              <label>
                Stop Name <span>*</span>
              </label>

              <input
                type="text"
                name="stopName"
                value={formData.stopName}
                onChange={handleChange}
              />

            </div>
                        {/* Distance */}

            <div className="formGroup">
              <label>
                Distance <span>*</span>
              </label>

              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
              />
            </div>

            {/* Is Active */}

            <div className="activeGroup">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />

              <label>Is Active?</label>
            </div>

            {/* Buttons */}

            <div className="buttonRow">
              <button className="saveButton" onClick={handleSave}>
                Save
              </button>

              <button className="clearButton" onClick={handleClear}>
                Clear
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Table Card */}

      <div className="pageCard tableCard">

        <div className="pageHeader">
          <span className="headerIcon">🚌</span>
          <span>Bus Stop Names</span>
        </div>

        <div className="tableBody">

          <div className="tableTop">

            <div className="showEntries">
              <span>Show</span>

              <select>
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>

              <span>entries</span>
            </div>

            <div className="searchBox">
              <label>Search:</label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

          </div>
                    <div className="tableResponsive">

            <table className="busStopTable">

              <thead>

                <tr>
                  <th>Route Name</th>
                  <th>Bus Reg. No</th>
                  <th>Stop Name</th>
                  <th>Distance</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {filteredData.length > 0 ? (

                  filteredData.map((row) => (

                    <tr key={row.id}>

                      <td>{row.routeName}</td>

                      <td>{row.busRegNo}</td>

                      <td>{row.stopName}</td>

                      <td>{row.distance}</td>

                      <td>

                        <span
                          className={
                            row.status === "Active"
                              ? "statusActive"
                              : "statusInactive"
                          }
                        >
                          {row.status}
                        </span>

                      </td>

                      <td>{row.createdBy}</td>

                      <td>

                        <button
                          className="editButton"
                          onClick={() => handleEdit(row)}
                        >
                          Edit
                        </button>

                        <button
                          className="deleteButton"
                          onClick={() => handleDelete(row.id)}
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="7"
                      className="noData"
                    >
                      No Records Found
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          <div className="tableFooter">

            <span>
              Showing {filteredData.length} of {busStops.length} entries
            </span>

          </div>

        </div>

      </div>

    </div>

  );

}

export default BusStopNames;