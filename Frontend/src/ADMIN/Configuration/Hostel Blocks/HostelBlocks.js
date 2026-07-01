// import React, { useEffect, useMemo, useState } from 'react';
// import './HostelBlocks.css';

// const emptyForm = {
//   blockId: '',
//   name: '',
//   floors: '',
//   rooms: '',
//   capacity: '',
//   warden: '',
//   active: true,
// };


// function HostelBlocks() {
//   const [blocks, setBlocks] = useState([
//     {
//       id: "HB001",
//       name: "Boys Hostel A",
//       floors: 4,
//       roomsPerFloor: 20,
//       rooms: 80,
//       bedsPerRoom: 4,
//       capacity: 320,
//       warden: "Mr. Kumar",
//       status: "Active",
//     },
//     {
//       id: "HB002",
//       name: "Girls Hostel A",
//       floors: 3,
//       roomsPerFloor: 20,
//       rooms: 60,
//       bedsPerRoom: 4,
//       capacity: 240,
//       warden: "Mrs. Priya",
//       status: "Active",
//     },
//   ]);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentEditingId, setCurrentEditingId] = useState(null);
  
//   const [newBlock, setNewBlock] = useState({
//     name: "",
//     floors: "",
//     roomsPerFloor: "",
//     rooms: 0,
//     bedsPerRoom: "", 
//     capacity: 0,
//     warden: "",
//     status: "Active"
//   });

//   // Automatically calculate total rooms and total bed capacity on input changes
//   useEffect(() => {
//     const f = parseInt(newBlock.floors) || 0;
//     const rpf = parseInt(newBlock.roomsPerFloor) || 0;
//     const bpr = parseInt(newBlock.bedsPerRoom) || 0;
    
//     const totalRooms = f * rpf;
//     const totalCapacity = totalRooms * bpr;

//     setNewBlock((prev) => ({
//       ...prev,
//       rooms: totalRooms,
//       capacity: totalCapacity
//     }));
//   }, [newBlock.floors, newBlock.roomsPerFloor, newBlock.bedsPerRoom]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setNewBlock((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleOpenCreateModal = () => {
//     setCurrentEditingId(null);
//     setNewBlock({ name: "", floors: "", roomsPerFloor: "", rooms: 0, bedsPerRoom: "", capacity: 0, warden: "", status: "Active" });
//     setIsModalOpen(true);
//   };

//   const handleOpenEditModal = (block) => {
//     setCurrentEditingId(block.id);
//     setNewBlock({
//       name: block.name,
//       floors: block.floors || "",
//       roomsPerFloor: block.roomsPerFloor || "",
//       rooms: block.rooms || 0,
//       bedsPerRoom: block.bedsPerRoom || "",
//       capacity: block.capacity || 0,
//       warden: block.warden,
//       status: block.status
//     });
//     setIsModalOpen(true);
//   };

//   const handleFormSubmit = (e) => {
//     e.preventDefault();
//     if (!newBlock.name || !newBlock.warden) return;

//     if (currentEditingId) {
//       setBlocks(blocks.map(b => b.id === currentEditingId ? {
//         ...b,
//         name: newBlock.name,
//         floors: parseInt(newBlock.floors) || 0,
//         roomsPerFloor: parseInt(newBlock.roomsPerFloor) || 0,
//         rooms: newBlock.rooms,
//         bedsPerRoom: parseInt(newBlock.bedsPerRoom) || 0,
//         capacity: newBlock.capacity,
//         warden: newBlock.warden,
//         status: newBlock.status
//       } : b));
//     } else {
//       const nextIdNumber = blocks.length + 1;
//       const generatedId = `HB${String(nextIdNumber).padStart(3, '0')}`;

//       const blockToAdd = {
//         id: generatedId,
//         name: newBlock.name,
//         floors: parseInt(newBlock.floors) || 0,
//         roomsPerFloor: parseInt(newBlock.roomsPerFloor) || 0,
//         rooms: newBlock.rooms,
//         bedsPerRoom: parseInt(newBlock.bedsPerRoom) || 0,
//         capacity: newBlock.capacity,
//         warden: newBlock.warden,
//         status: newBlock.status
//       };
//       setBlocks([...blocks, blockToAdd]);
//     }

//     setNewBlock({ name: "", floors: "", roomsPerFloor: "", rooms: 0, bedsPerRoom: "", capacity: 0, warden: "", status: "Active" });
//     setIsModalOpen(false);
//     setCurrentEditingId(null);
//   };

//   const handleDelete = (id) => {
//     if(window.confirm(`Delete block ${id}?`)) {
//       setBlocks(blocks.filter(block => block.id !== id));
//     }
//   };

//   return (
//     <div className="hostel-view-wrapper">
//       {/* Minimal Header */}
//       <div className="hostel-view-header">
//         <div>
//           <h2>Hostel Blocks</h2>
//         </div>
//         <button type="button" className="minimal-add-btn" onClick={handleOpenCreateModal}>
//           <PlusCircle size={16} /> Add Block
//         </button>
//       </div>

//       {/* Clean Modern Table Container */}
//       <div className="hostel-table-card">
//         <table className="minimal-table">
//           <thead>
//             <tr>
//               <th>ID</th>
//               <th>Block Name</th>
//               <th>Floors</th>
//               <th>Rooms</th>
//               <th>Capacity</th>
//               <th>Warden</th>
//               <th>Status</th>
//               <th style={{ textAlign: "right" }}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {blocks.map((block) => (
//               <tr key={block.id}>
//                 <td className="text-secondary">{block.id}</td>
//                 <td className="text-main font-medium">{block.name}</td>
//                 <td>{block.floors} Floors</td>
//                 <td>{block.rooms} Rooms</td>
//                 <td><strong>{block.capacity}</strong> Beds</td>
//                 <td>{block.warden}</td>
//                 <td>
//                   <span className={`pill-badge ${block.status.toLowerCase()}`}>
//                     {block.status}
//                   </span>
//                 </td>
//                 <td>
//                   <div className="action-row-end">
//                     <button type="button" className="row-action-btn edit" title="Edit Block" onClick={() => handleOpenEditModal(block)}>
//                       <Edit2 size={16} />
//                     </button>
//                     <button type="button" className="row-action-btn delete" title="Delete Block" onClick={() => handleDelete(block.id)}>
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Portal Layout Form Modal */}
//       {isModalOpen && (
//         <div className="fixed-modal-overlay">
//           <div className="fixed-modal-body">
//             <div className="modal-top-bar">
//               <h3>{currentEditingId ? "Edit Hostel Block" : "New Hostel Block"}</h3>
//               <button type="button" className="modal-close-cross" onClick={() => setIsModalOpen(false)}>
//                 <X size={18} />
//               </button>
//             </div>
            
//             <form onSubmit={handleFormSubmit} className="minimal-form">
//               <div className="form-item">
//                 <label>Block Name *</label>
//                 <input type="text" name="name" value={newBlock.name} onChange={handleInputChange} placeholder="Enter block name" required />
//               </div>
              
//               <div className="form-split">
//                 <div className="form-item">
//                   <label>Floors Count</label>
//                   <input type="number" name="floors" min="0" value={newBlock.floors} onChange={handleInputChange} placeholder="Total floors" />
//                 </div>
//                 <div className="form-item">
//                   <label>Rooms per Floor</label>
//                   <input type="number" name="roomsPerFloor" min="0" value={newBlock.roomsPerFloor} onChange={handleInputChange} placeholder="Rooms per floor" />
//                 </div>
//               </div>
              
//               <div className="form-split">
//                 <div className="form-item">
//                   <label>Beds per Room</label>
//                   <input type="number" name="bedsPerRoom" min="0" value={newBlock.bedsPerRoom} onChange={handleInputChange} placeholder="Beds per room" />
//                 </div>
//                 <div className="form-item">
//                   <label>Total Rooms (Auto)</label>
//                   <input type="text" name="rooms" value={`${newBlock.rooms} Rooms`} readOnly style={{ backgroundColor: "#f1f5f9", fontWeight: "600", color: "#1e1b4b" }} />
//                 </div>
//               </div>

//               <div className="form-split">
//                 <div className="form-item">
//                   <label>Total Capacity (Auto)</label>
//                   <input type="text" name="capacity" value={`${newBlock.capacity} Beds`} readOnly style={{ backgroundColor: "#f1f5f9", fontWeight: "600", color: "#2563eb" }} />
//                 </div>
//                 <div className="form-item">
//                   <label>Status</label>
//                   <select name="status" value={newBlock.status} onChange={handleInputChange}>
//                     <option value="Active">Active</option>
//                     <option value="Inactive">Inactive</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="form-item">
//                 <label>Warden *</label>
//                 <input type="text" name="warden" value={newBlock.warden} onChange={handleInputChange} placeholder="Enter warden name" required />
//               </div>
              
//               <div className="form-actions-end">
//                 <button type="button" className="btn-secondary-icon" title="Cancel" onClick={() => setIsModalOpen(false)}>
//                   <X size={16} />
//                 </button>
//                 <button type="submit" className="btn-primary-icon" title="Save Block">
//                   <Save size={16} />
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


//               <div className="form-actions-end">
//                 <button type="button" className="btn-secondary-icon" title="Cancel" onClick={() => setIsModalOpen(false)}>
//                   <X size={16} />
//                 </button>
//                 <button type="submit" className="btn-primary-icon" title="Save Block">
//                   <Save size={16} />
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );

// export default HostelBlocks;


import React, { useEffect, useMemo, useState } from "react";
import "./HostelBlocks.css";

const emptyForm = { blockId: "", name: "", floors: "", rooms: "", capacity: "", warden: "", active: true };
const initialBlocks = [
  {
    id: 1,
    blockId: 'HB001',
    name: 'Boys Hostel A',
    floors: '4',
    rooms: '80',
    capacity: '320',
    warden: 'Mr. Kumar',
    status: 'Active',
  },
  {
    id: 2,
    blockId: 'HB002',
    name: 'Girls Hostel A',
    floors: '3',
    rooms: '60',
    capacity: '240',
    warden: 'Mrs. Priya',
    status: 'Active',
  },
];

function HostelIcon({ type }) {
  const paths = {
    building: (
      <>
        <path d="M4 21V5l8-3 8 3v16M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" />
      </>
    ),
    rooms: (
      <>
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h2v2H9zM15 10h2v2h-2zM9 15h2v2H9zM15 15h2v2h-2z" />
      </>
    ),
    save: (
      <>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M17 21v-8H7v8M7 3v5h8" />
      </>
    ),
    clear: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
      </>
    ),
    delete: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
      </>
    ),
  };

  return (
    <svg
      className={`hb-icon hb-icon-${type}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
}

function HostelBlocks() {
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBlocks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return blocks;
    }

    return blocks.filter((block) =>
      `${block.blockId} ${block.name} ${block.floors} ${block.rooms} ${block.capacity} ${block.warden} ${block.status}`
        .toLowerCase()
        .includes(query)
    );
  }, [blocks, search]);

  const entriesPerPage = Number(entries);
  const totalPages = Math.max(1, Math.ceil(filteredBlocks.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleBlocks = filteredBlocks.slice(startIndex, startIndex + entriesPerPage);
  const firstEntry = filteredBlocks.length ? startIndex + 1 : 0;
  const lastEntry = Math.min(startIndex + entriesPerPage, filteredBlocks.length);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const values = {
      blockId: formData.blockId.trim().toUpperCase(),
      name: formData.name.trim(),
      floors: formData.floors,
      rooms: formData.rooms,
      capacity: formData.capacity,
      warden: formData.warden.trim(),
      status: formData.active ? 'Active' : 'Inactive',
    };

    if (editingId !== null) {
      setBlocks((current) =>
        current.map((block) => (block.id === editingId ? { ...block, ...values } : block))
      );
    } else {
      setBlocks((current) => [...current, { id: Date.now(), ...values }]);
    }

    resetForm();
  };

  const handleEdit = (block) => {
    setFormData({
      blockId: block.blockId,
      name: block.name,
      floors: block.floors,
      rooms: block.rooms,
      capacity: block.capacity,
      warden: block.warden,
      active: block.status === 'Active',
    });
    setEditingId(block.id);
  };

  const handleDelete = (id) => {
    setBlocks((current) => current.filter((block) => block.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  return (
    <div className="hb-page">
      <section className="hb-card hb-form-card">
        <div className="hb-watermark" aria-hidden="true">
          <span className="hb-watermark-building">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="hb-watermark-bed">
            <i />
          </span>
        </div>
        <div className="hb-section-title">
          <span className="hb-heading-icon">
            <HostelIcon type="building" />
          </span>
          <h3>Configuration / Hostel Blocks</h3>
        </div>
        <form className="hb-form" onSubmit={handleSubmit}>
          <label className="hb-field">
            <span>Block ID <b className="hb-required">*</b></span>
            <input
              name="blockId"
              value={formData.blockId}
              onChange={handleChange}
              placeholder="e.g., HB003"
              required
            />
          </label>
          <label className="hb-field">
            <span>Block Name <b className="hb-required">*</b></span>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Block Name"
              required
            />
          </label>
          <label className="hb-field">
            <span>Number of Floors <b className="hb-required">*</b></span>
            <input
              type="number"
              min="1"
              name="floors"
              value={formData.floors}
              onChange={handleChange}
              placeholder="Enter Floors"
              required
            />
          </label>
          <label className="hb-field">
            <span>Number of Rooms <b className="hb-required">*</b></span>
            <input
              type="number"
              min="1"
              name="rooms"
              value={formData.rooms}
              onChange={handleChange}
              placeholder="Enter Rooms"
              required
            />
          </label>
          <label className="hb-field">
            <span>Total Capacity <b className="hb-required">*</b></span>
            <input
              type="number"
              min="1"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              placeholder="Enter Capacity"
              required
            />
          </label>
          <label className="hb-field">
            <span>Warden Name <b className="hb-required">*</b></span>
            <input
              name="warden"
              value={formData.warden}
              onChange={handleChange}
              placeholder="Enter Warden Name"
              required
            />
          </label>
          <label className="hb-checkbox-field">
            <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
            <span>Is Active?</span>
          </label>
          <div className="hb-form-actions">
            <button className="hb-save-button" type="submit">
              <HostelIcon type="save" />
              {editingId !== null ? 'Update Block' : 'Save Block'}
            </button>
            <button className="hb-clear-button" type="button" onClick={resetForm}>
              <HostelIcon type="clear" />
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="hb-card hb-details-card">
        <div className="hb-section-title">
          <span className="hb-heading-icon">
            <HostelIcon type="rooms" />
          </span>
          <h3>Hostel Block Details</h3>
        </div>
        <div className="hb-table-tools">
          <label className="hb-show-control">
            Show
            <select
              value={entries}
              onChange={(event) => {
                setEntries(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            entries
          </label>
          <label className="hb-search-control">
            Search:
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
        </div>
        <div className="hb-table-wrap">
          <table className="hb-table">
            <thead>
              <tr>
                <th>Block ID</th>
                <th>Block Name</th>
                <th>Floors</th>
                <th>Rooms</th>
                <th>Capacity</th>
                <th>Warden</th>
                <th>Status</th>
                <th className="hb-action-column">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleBlocks.length ? (
                visibleBlocks.map((block) => (
                  <tr key={block.id}>
                    <td>{block.blockId}</td>
                    <td>{block.name}</td>
                    <td>{block.floors}</td>
                    <td>{block.rooms}</td>
                    <td>{block.capacity}</td>
                    <td>{block.warden}</td>
                    <td>
                      <span className={block.status === 'Active' ? 'hb-status-active' : 'hb-status-inactive'}>
                        {block.status}
                      </span>
                    </td>
                    <td>
                      <div className="hb-action-buttons">
                        <button className="hb-edit-button" type="button" onClick={() => handleEdit(block)}>
                          <HostelIcon type="edit" />
                          Edit
                        </button>
                        <button className="hb-delete-button" type="button" onClick={() => handleDelete(block.id)}>
                          <HostelIcon type="delete" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="hb-empty" colSpan="8">
                    No hostel blocks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="hb-pagination-bar">
          <p>
            Showing {firstEntry} to {lastEntry} of {filteredBlocks.length} entries
          </p>
          <div className="hb-pagination-actions">
            <button
              className="hb-page-button"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              Prev
            </button>
            <button className="hb-page-button hb-page-current" type="button">
              {currentPage}
            </button>
            <button
              className="hb-page-button"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HostelBlocks;

