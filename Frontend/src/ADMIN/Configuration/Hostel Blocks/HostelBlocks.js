import React, { useState } from "react";
import "./HostelBlocks.css";

function HostelBlocks() {
  const [blocks] = useState([
    {
      id: "HB001",
      name: "Boys Hostel A",
      floors: 4,
      rooms: 80,
      capacity: 320,
      warden: "Mr. Kumar",
      status: "Active",
    },
    {
      id: "HB002",
      name: "Girls Hostel A",
      floors: 3,
      rooms: 60,
      capacity: 240,
      warden: "Mrs. Priya",
      status: "Active",
    },
  ]);

  return (
    <div className="hostel-blocks">
      <div className="header">
        <h2>Hostel Blocks</h2>
        <button>Add Block</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Block ID</th>
            <th>Block Name</th>
            <th>Floors</th>
            <th>Rooms</th>
            <th>Capacity</th>
            <th>Warden</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {blocks.map((block) => (
            <tr key={block.id}>
              <td>{block.id}</td>
              <td>{block.name}</td>
              <td>{block.floors}</td>
              <td>{block.rooms}</td>
              <td>{block.capacity}</td>
              <td>{block.warden}</td>
              <td>
                <span className="status">{block.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HostelBlocks;