import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Edit2, 
  Trash2, 
  X, 
  Save 
} from "lucide-react";
import "./HostelBlocks.css";

function HostelBlocks() {
  const [blocks, setBlocks] = useState([
    {
      id: "HB001",
      name: "Boys Hostel A",
      floors: 4,
      roomsPerFloor: 20,
      rooms: 80,
      bedsPerRoom: 4,
      capacity: 320,
      warden: "Mr. Kumar",
      status: "Active",
    },
    {
      id: "HB002",
      name: "Girls Hostel A",
      floors: 3,
      roomsPerFloor: 20,
      rooms: 60,
      bedsPerRoom: 4,
      capacity: 240,
      warden: "Mrs. Priya",
      status: "Active",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState(null);
  
  const [newBlock, setNewBlock] = useState({
    name: "",
    floors: "",
    roomsPerFloor: "",
    rooms: 0,
    bedsPerRoom: "", 
    capacity: 0,
    warden: "",
    status: "Active"
  });

  // Automatically calculate total rooms and total bed capacity on input changes
  useEffect(() => {
    const f = parseInt(newBlock.floors) || 0;
    const rpf = parseInt(newBlock.roomsPerFloor) || 0;
    const bpr = parseInt(newBlock.bedsPerRoom) || 0;
    
    const totalRooms = f * rpf;
    const totalCapacity = totalRooms * bpr;

    setNewBlock((prev) => ({
      ...prev,
      rooms: totalRooms,
      capacity: totalCapacity
    }));
  }, [newBlock.floors, newBlock.roomsPerFloor, newBlock.bedsPerRoom]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBlock((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateModal = () => {
    setCurrentEditingId(null);
    setNewBlock({ name: "", floors: "", roomsPerFloor: "", rooms: 0, bedsPerRoom: "", capacity: 0, warden: "", status: "Active" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (block) => {
    setCurrentEditingId(block.id);
    setNewBlock({
      name: block.name,
      floors: block.floors || "",
      roomsPerFloor: block.roomsPerFloor || "",
      rooms: block.rooms || 0,
      bedsPerRoom: block.bedsPerRoom || "",
      capacity: block.capacity || 0,
      warden: block.warden,
      status: block.status
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newBlock.name || !newBlock.warden) return;

    if (currentEditingId) {
      setBlocks(blocks.map(b => b.id === currentEditingId ? {
        ...b,
        name: newBlock.name,
        floors: parseInt(newBlock.floors) || 0,
        roomsPerFloor: parseInt(newBlock.roomsPerFloor) || 0,
        rooms: newBlock.rooms,
        bedsPerRoom: parseInt(newBlock.bedsPerRoom) || 0,
        capacity: newBlock.capacity,
        warden: newBlock.warden,
        status: newBlock.status
      } : b));
    } else {
      const nextIdNumber = blocks.length + 1;
      const generatedId = `HB${String(nextIdNumber).padStart(3, '0')}`;

      const blockToAdd = {
        id: generatedId,
        name: newBlock.name,
        floors: parseInt(newBlock.floors) || 0,
        roomsPerFloor: parseInt(newBlock.roomsPerFloor) || 0,
        rooms: newBlock.rooms,
        bedsPerRoom: parseInt(newBlock.bedsPerRoom) || 0,
        capacity: newBlock.capacity,
        warden: newBlock.warden,
        status: newBlock.status
      };
      setBlocks([...blocks, blockToAdd]);
    }

    setNewBlock({ name: "", floors: "", roomsPerFloor: "", rooms: 0, bedsPerRoom: "", capacity: 0, warden: "", status: "Active" });
    setIsModalOpen(false);
    setCurrentEditingId(null);
  };

  const handleDelete = (id) => {
    if(window.confirm(`Delete block ${id}?`)) {
      setBlocks(blocks.filter(block => block.id !== id));
    }
  };

  return (
    <div className="hostel-view-wrapper">
      {/* Minimal Header */}
      <div className="hostel-view-header">
        <div>
          <h2>Hostel Blocks</h2>
        </div>
        <button type="button" className="minimal-add-btn" onClick={handleOpenCreateModal}>
          <PlusCircle size={16} /> Add Block
        </button>
      </div>

      {/* Clean Modern Table Container */}
      <div className="hostel-table-card">
        <table className="minimal-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Block Name</th>
              <th>Floors</th>
              <th>Rooms</th>
              <th>Capacity</th>
              <th>Warden</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block.id}>
                <td className="text-secondary">{block.id}</td>
                <td className="text-main font-medium">{block.name}</td>
                <td>{block.floors} Floors</td>
                <td>{block.rooms} Rooms</td>
                <td><strong>{block.capacity}</strong> Beds</td>
                <td>{block.warden}</td>
                <td>
                  <span className={`pill-badge ${block.status.toLowerCase()}`}>
                    {block.status}
                  </span>
                </td>
                <td>
                  <div className="action-row-end">
                    <button type="button" className="row-action-btn edit" title="Edit Block" onClick={() => handleOpenEditModal(block)}>
                      <Edit2 size={16} />
                    </button>
                    <button type="button" className="row-action-btn delete" title="Delete Block" onClick={() => handleDelete(block.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Portal Layout Form Modal */}
      {isModalOpen && (
        <div className="fixed-modal-overlay">
          <div className="fixed-modal-body">
            <div className="modal-top-bar">
              <h3>{currentEditingId ? "Edit Hostel Block" : "New Hostel Block"}</h3>
              <button type="button" className="modal-close-cross" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="minimal-form">
              <div className="form-item">
                <label>Block Name *</label>
                <input type="text" name="name" value={newBlock.name} onChange={handleInputChange} placeholder="Enter block name" required />
              </div>
              
              <div className="form-split">
                <div className="form-item">
                  <label>Floors Count</label>
                  <input type="number" name="floors" min="0" value={newBlock.floors} onChange={handleInputChange} placeholder="Total floors" />
                </div>
                <div className="form-item">
                  <label>Rooms per Floor</label>
                  <input type="number" name="roomsPerFloor" min="0" value={newBlock.roomsPerFloor} onChange={handleInputChange} placeholder="Rooms per floor" />
                </div>
              </div>
              
              <div className="form-split">
                <div className="form-item">
                  <label>Beds per Room</label>
                  <input type="number" name="bedsPerRoom" min="0" value={newBlock.bedsPerRoom} onChange={handleInputChange} placeholder="Beds per room" />
                </div>
                <div className="form-item">
                  <label>Total Rooms (Auto)</label>
                  <input type="text" name="rooms" value={`${newBlock.rooms} Rooms`} readOnly style={{ backgroundColor: "#f1f5f9", fontWeight: "600", color: "#1e1b4b" }} />
                </div>
              </div>

              <div className="form-split">
                <div className="form-item">
                  <label>Total Capacity (Auto)</label>
                  <input type="text" name="capacity" value={`${newBlock.capacity} Beds`} readOnly style={{ backgroundColor: "#f1f5f9", fontWeight: "600", color: "#2563eb" }} />
                </div>
                <div className="form-item">
                  <label>Status</label>
                  <select name="status" value={newBlock.status} onChange={handleInputChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-item">
                <label>Warden *</label>
                <input type="text" name="warden" value={newBlock.warden} onChange={handleInputChange} placeholder="Enter warden name" required />
              </div>
              
              <div className="form-actions-end">
                <button type="button" className="btn-secondary-icon" title="Cancel" onClick={() => setIsModalOpen(false)}>
                  <X size={16} />
                </button>
                <button type="submit" className="btn-primary-icon" title="Save Block">
                  <Save size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostelBlocks;