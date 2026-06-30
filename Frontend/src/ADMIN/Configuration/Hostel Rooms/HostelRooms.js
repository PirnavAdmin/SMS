import React, { useEffect, useMemo, useState } from "react";
import { 
  Search, 
  PlusCircle, 
  UserPlus, 
  Hotel, 
  Users, 
  PieChart, 
  Eye, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  ChevronLeft, 
  ChevronRight,
  User
} from "lucide-react";
import "./HostelRooms.css";

const HOSTEL_BLOCKS = [
  "Boys Hostel A",
  "Boys Hostel B",
  "Girls Hostel A",
  "Girls Hostel B",
];

const FLOORS = [1, 2, 3, 4, 5];
const CAPACITIES = [1, 2, 3, 4, 6, 8, 10];
const CLASSES = Array.from({ length: 12 }, (_, index) => String(index + 1));
const SECTIONS = ["A", "B", "C", "D"];
const GENDERS = ["Male", "Female", "Other"];
const BEDS = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"];
const PAGE_SIZE = 2;

const EMPTY_ROOM = {
  roomNo: "",
  block: "",
  floor: "",
  capacity: "",
};

const EMPTY_STUDENT = {
  admissionNo: "",
  studentName: "",
  className: "",
  section: "",
  gender: "",
  parentName: "",
  parentPhone: "",
  emergencyPhone: "",
  block: "",
  roomNo: "",
  bedNo: "",
};

const INITIAL_ROOMS = [
  {
    id: 1,
    roomNo: "101",
    block: "Boys Hostel A",
    floor: 1,
    capacity: 4,
    occupied: 2,
    status: "Available",
  },
  {
    id: 2,
    roomNo: "102",
    block: "Boys Hostel A",
    floor: 1,
    capacity: 4,
    occupied: 4,
    status: "Full",
  },
  {
    id: 3,
    roomNo: "201",
    block: "Girls Hostel A",
    floor: 2,
    capacity: 6,
    occupied: 3,
    status: "Available",
  },
];

const INITIAL_STUDENTS = [
  {
    id: 1,
    admissionNo: "ADM001",
    studentName: "Rahul Kumar",
    className: "10",
    section: "A",
    gender: "Male",
    parentName: "Raj Kumar",
    parentPhone: "9876543210",
    emergencyPhone: "9876543211",
    block: "Boys Hostel A",
    roomNo: "101",
    bedNo: "B1",
  },
  {
    id: 2,
    admissionNo: "ADM002",
    studentName: "Arjun Singh",
    className: "10",
    section: "B",
    gender: "Male",
    parentName: "Suresh Singh",
    parentPhone: "9876501234",
    emergencyPhone: "9876501235",
    block: "Boys Hostel A",
    roomNo: "101",
    bedNo: "B2",
  },
  {
    id: 3,
    admissionNo: "ADM003",
    studentName: "Priya Sharma",
    className: "9",
    section: "A",
    gender: "Female",
    parentName: "Rakesh Sharma",
    parentPhone: "9876549876",
    emergencyPhone: "9876549877",
    block: "Girls Hostel A",
    roomNo: "201",
    bedNo: "B1",
  },
  {
    id: 4,
    admissionNo: "ADM004",
    studentName: "Aman Verma",
    className: "9",
    section: "B",
    gender: "Male",
    parentName: "Vikram Verma",
    parentPhone: "9876511111",
    emergencyPhone: "9876511112",
    block: "Boys Hostel A",
    roomNo: "102",
    bedNo: "B1",
  },
  {
    id: 5,
    admissionNo: "ADM005",
    studentName: "Rohit Mehra",
    className: "8",
    section: "A",
    gender: "Male",
    parentName: "Deepak Mehra",
    parentPhone: "9876522222",
    emergencyPhone: "9876522223",
    block: "Boys Hostel A",
    roomNo: "102",
    bedNo: "B2",
  },
  {
    id: 6,
    admissionNo: "ADM006",
    studentName: "Karan Patel",
    className: "10",
    section: "C",
    gender: "Male",
    parentName: "Mahesh Patel",
    parentPhone: "9876533333",
    emergencyPhone: "9876533334",
    block: "Boys Hostel A",
    roomNo: "102",
    bedNo: "B3",
  },
  {
    id: 7,
    admissionNo: "ADM007",
    studentName: "Nikhil Jain",
    className: "7",
    section: "A",
    gender: "Male",
    parentName: "Ramesh Jain",
    parentPhone: "9876544444",
    emergencyPhone: "9876544445",
    block: "Boys Hostel A",
    roomNo: "102",
    bedNo: "B4",
  },
];

function getRoomStatus(occupied, capacity) {
  return occupied >= capacity ? "Full" : "Available";
}

function matchesRoom(room, block, roomNo) {
  return room.block === block && room.roomNo === roomNo;
}

function getPageItems(items, page) {
  const startIndex = (page - 1) * PAGE_SIZE;
  return items.slice(startIndex, startIndex + PAGE_SIZE);
}

function Pagination({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        type="button"
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={16} />
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function HostelRooms() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);

  const [activeTab, setActiveTab] = useState("rooms");
  const [searchTerm, setSearchTerm] = useState("");

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);

  const [editingRoom, setEditingRoom] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [studentForm, setStudentForm] = useState(EMPTY_STUDENT);

  const [roomPage, setRoomPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [reportRoomPage, setReportRoomPage] = useState(1);
  const [reportBlockPage, setReportBlockPage] = useState(1);

  const searchValue = searchTerm.trim().toLowerCase();

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((room) => room.occupied > 0).length;
  const vacantRooms = rooms.filter((room) => room.occupied < room.capacity).length;
  const totalStudents = students.length;
  const totalBeds = rooms.reduce((total, room) => total + room.capacity, 0);
  const occupiedBeds = rooms.reduce((total, room) => total + room.occupied, 0);
  const vacantBeds = totalBeds - occupiedBeds;
  const overallOccupancy = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const hostelBlocks = useMemo(
    () => [...new Set([...HOSTEL_BLOCKS, ...rooms.map((room) => room.block)])],
    [rooms]
  );

  const blockReports = hostelBlocks.map((block) => {
    const blockRooms = rooms.filter((room) => room.block === block);
    const blockCapacity = blockRooms.reduce((total, room) => total + room.capacity, 0);
    const blockOccupied = blockRooms.reduce((total, room) => total + room.occupied, 0);
    const blockVacant = blockCapacity - blockOccupied;
    const occupancy = blockCapacity ? Math.round((blockOccupied / blockCapacity) * 100) : 0;

    return {
      block,
      rooms: blockRooms.length,
      capacity: blockCapacity,
      occupied: blockOccupied,
      vacant: blockVacant,
      occupancy,
    };
  });

  const filteredRooms = rooms.filter((room) => {
    return (
      room.roomNo.toLowerCase().includes(searchValue) ||
      room.block.toLowerCase().includes(searchValue)
    );
  });

  const filteredStudents = students.filter((student) => {
    return [
      student.studentName,
      student.admissionNo,
      student.parentName,
      student.parentPhone,
      student.roomNo,
      student.block,
    ].some((value) => value.toLowerCase().includes(searchValue));
  });

  const paginatedRooms = getPageItems(filteredRooms, roomPage);
  const paginatedStudents = getPageItems(filteredStudents, studentPage);
  const paginatedReportRooms = getPageItems(rooms, reportRoomPage);
  const paginatedBlockReports = getPageItems(blockReports, reportBlockPage);

  useEffect(() => {
    setRoomPage(1);
    setStudentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setRoomPage((page) => Math.min(page, Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE))));
    setStudentPage((page) =>
      Math.min(page, Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE)))
    );
    setReportRoomPage((page) => Math.min(page, Math.max(1, Math.ceil(rooms.length / PAGE_SIZE))));
    setReportBlockPage((page) =>
      Math.min(page, Math.max(1, Math.ceil(blockReports.length / PAGE_SIZE)))
    );
  }, [filteredRooms.length, filteredStudents.length, rooms.length, blockReports.length]);

  const resetRoomForm = () => {
    setRoomForm(EMPTY_ROOM);
    setEditingRoom(null);
  };

  const resetStudentForm = () => {
    setStudentForm(EMPTY_STUDENT);
    setEditingStudent(null);
  };

  const openRoomForm = () => {
    resetRoomForm();
    setShowRoomForm(true);
  };

  const openStudentForm = () => {
    resetStudentForm();
    setShowStudentForm(true);
  };

  const closeRoomForm = () => {
    resetRoomForm();
    setShowRoomForm(false);
  };

  const closeStudentForm = () => {
    resetStudentForm();
    setShowStudentForm(false);
  };

  const updateRoomForm = (field, value) => {
    setRoomForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const updateStudentForm = (field, value) => {
    setStudentForm((currentForm) => ({
      ...currentForm,
      [field]: value,
      ...(field === "block" ? { roomNo: "" } : {}),
    }));
  };

  const updateRoomOccupancy = (targetStudent, difference) => {
    setRooms((currentRooms) =>
      currentRooms.map((room) => {
        if (!matchesRoom(room, targetStudent.block, targetStudent.roomNo)) {
          return room;
        }

        const occupied = Math.max(room.occupied + difference, 0);

        return {
          ...room,
          occupied,
          status: getRoomStatus(occupied, room.capacity),
        };
      })
    );
  };

  const handleSaveRoom = () => {
    const roomNo = roomForm.roomNo.trim();
    const block = roomForm.block;
    const floor = Number(roomForm.floor);
    const capacity = Number(roomForm.capacity);

    if (!roomNo || !block || !floor || !capacity) {
      alert("Please fill all room details.");
      return;
    }

    if (capacity <= 0) {
      alert("Capacity should be greater than 0.");
      return;
    }

    const duplicateRoom = rooms.find(
      (room) =>
        room.roomNo.trim() === roomNo &&
        room.block === block &&
        room.id !== editingRoom?.id
    );

    if (duplicateRoom) {
      alert(`Room ${roomNo} already exists in ${block}.`);
      return;
    }

    if (editingRoom && capacity < editingRoom.occupied) {
      alert(`Capacity cannot be less than occupied students (${editingRoom.occupied}).`);
      return;
    }

    if (editingRoom) {
      setRooms((currentRooms) =>
        currentRooms.map((room) =>
          room.id === editingRoom.id
            ? {
                ...room,
                roomNo,
                block,
                floor,
                capacity,
                status: getRoomStatus(room.occupied, capacity),
              }
            : room
        )
      );
    } else {
      setRooms((currentRooms) => [
        ...currentRooms,
        {
          id: Date.now(),
          roomNo,
          block,
          floor,
          capacity,
          occupied: 0,
          status: "Available",
        },
      ]);
    }

    closeRoomForm();
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      roomNo: room.roomNo,
      block: room.block,
      floor: String(room.floor),
      capacity: String(room.capacity),
    });
    setShowRoomForm(true);
  };

  const handleDeleteRoom = (roomId) => {
    const room = rooms.find((currentRoom) => currentRoom.id === roomId);

    if (!room) return;

    const hasStudents = students.some((student) =>
      matchesRoom(room, student.block, student.roomNo)
    );

    if (hasStudents) {
      alert("Cannot delete room. Students are still allocated.");
      return;
    }

    if (!window.confirm("Delete this room permanently?")) return;

    setRooms((currentRooms) => currentRooms.filter((currentRoom) => currentRoom.id !== roomId));
  };

  const handleSaveStudent = () => {
    const studentData = {
      ...studentForm,
      admissionNo: studentForm.admissionNo.trim(),
      studentName: studentForm.studentName.trim(),
      parentName: studentForm.parentName.trim(),
      parentPhone: studentForm.parentPhone.trim(),
      emergencyPhone: studentForm.emergencyPhone.trim(),
    };

    if (
      !studentData.admissionNo ||
      !studentData.studentName ||
      !studentData.className ||
      !studentData.block ||
      !studentData.roomNo
    ) {
      alert("Please fill required fields.");
      return;
    }

    const duplicateAdmission = students.find(
      (student) =>
        student.admissionNo === studentData.admissionNo &&
        student.id !== editingStudent?.id
    );

    if (duplicateAdmission) {
      alert("Admission Number already exists.");
      return;
    }

    const selectedRoom = rooms.find((room) =>
      matchesRoom(room, studentData.block, studentData.roomNo)
    );

    if (!selectedRoom) {
      alert("Selected room not found.");
      return;
    }

    const roomChanged =
      editingStudent &&
      (editingStudent.roomNo !== studentData.roomNo || editingStudent.block !== studentData.block);

    if ((!editingStudent || roomChanged) && selectedRoom.occupied >= selectedRoom.capacity) {
      alert(editingStudent ? "Target room is full." : "Selected room is already full.");
      return;
    }

    if (editingStudent) {
      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === editingStudent.id ? { ...student, ...studentData } : student
        )
      );

      if (roomChanged) {
        updateRoomOccupancy(editingStudent, -1);
        updateRoomOccupancy(studentData, 1);
      }
    } else {
      setStudents((currentStudents) => [
        ...currentStudents,
        {
          id: Date.now(),
          ...studentData,
        },
      ]);
      updateRoomOccupancy(studentData, 1);
    }

    closeStudentForm();
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({
      admissionNo: student.admissionNo,
      studentName: student.studentName,
      className: student.className,
      section: student.section,
      gender: student.gender,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      emergencyPhone: student.emergencyPhone,
      block: student.block,
      roomNo: student.roomNo,
      bedNo: student.bedNo,
    });
    setShowStudentForm(true);
  };

  const handleDeleteStudent = (student) => {
    if (!window.confirm(`Remove ${student.studentName} from hostel?`)) return;

    setStudents((currentStudents) =>
      currentStudents.filter((currentStudent) => currentStudent.id !== student.id)
    );
    updateRoomOccupancy(student, -1);
  };

  const getStudentsByRoom = (room) => {
    return students.filter((student) => matchesRoom(room, student.block, student.roomNo));
  };

  const getTabIcon = (tabKey) => {
    switch (tabKey) {
      case "rooms": return <Hotel size={18} />;
      case "students": return <Users size={18} />;
      case "report": return <PieChart size={18} />;
      default: return null;
    }
  };

  return (
    <div className="hostel-container">
      <div className="hostel-header">
        <div className="hostel-title">
          <span className="hostel-title-icon"><Hotel size={19} /></span>
          <h2>Configuration / Hostel Rooms</h2>
        </div>

        <div className="header-actions">
          <div className="hostel-search-wrapper">
            <Search className="hostel-search-icon" size={18} />
            <input
              type="text"
              className="hostel-search-box"
              placeholder="Search..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <button className="primary-btn" type="button" onClick={openRoomForm}>
            <PlusCircle size={18} /> Add Room
          </button>

          <button className="primary-btn" type="button" onClick={openStudentForm}>
            <UserPlus size={18} /> Allocate Student
          </button>
        </div>
      </div>

      <div className="hostel-dashboard">
        <div className="dashboard-card">
          <h4>Total Rooms</h4>
          <h2>{totalRooms}</h2>
        </div>
        <div className="dashboard-card">
          <h4>Occupied Rooms</h4>
          <h2>{occupiedRooms}</h2>
        </div>
        <div className="dashboard-card">
          <h4>Vacant Rooms</h4>
          <h2>{vacantRooms}</h2>
        </div>
        <div className="dashboard-card">
          <h4>Total Students</h4>
          <h2>{totalStudents}</h2>
        </div>
      </div>

      <div className="tabs">
        {[
          ["rooms", "Room Management"],
          ["students", "Student Allocation"],
          ["report", "Occupancy Report"],
        ].map(([tabKey, label]) => (
          <button
            key={tabKey}
            className={activeTab === tabKey ? "tab active" : "tab"}
            type="button"
            onClick={() => setActiveTab(tabKey)}
          >
            {getTabIcon(tabKey)}
            {label}
          </button>
        ))}
      </div>

      {showRoomForm && (
        <div className="form-modal">
          <div className="form-card">
            <div className="form-title-wrapper">
              <h3>{editingRoom ? "Edit Room" : "Add New Room"}</h3>
              <button className="close-icon-btn" onClick={closeRoomForm}><X size={20} /></button>
            </div>

            <input
              type="text"
              placeholder="Room Number"
              value={roomForm.roomNo}
              onChange={(event) => updateRoomForm("roomNo", event.target.value)}
            />

            <select
              value={roomForm.block}
              onChange={(event) => updateRoomForm("block", event.target.value)}
            >
              <option value="">Select Block</option>
              {HOSTEL_BLOCKS.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>

            <select
              value={roomForm.floor}
              onChange={(event) => updateRoomForm("floor", event.target.value)}
            >
              <option value="">Select Floor</option>
              {FLOORS.map((floor) => (
                <option key={floor} value={floor}>
                  Floor {floor}
                </option>
              ))}
            </select>

            <select
              value={roomForm.capacity}
              onChange={(event) => updateRoomForm("capacity", event.target.value)}
            >
              <option value="">Select Capacity</option>
              {CAPACITIES.map((capacity) => (
                <option key={capacity} value={capacity}>
                  {capacity}
                </option>
              ))}
            </select>

            <div className="form-actions">
              <button className="save-btn" type="button" onClick={handleSaveRoom}>
                <Save size={18} /> 
              </button>
              <button className="cancel-btn" type="button" onClick={closeRoomForm}>
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showStudentForm && (
        <div className="form-modal">
          <div className="form-card large-form">
            <div className="form-title-wrapper">
              <h3>{editingStudent ? "Edit Student" : "Allocate Student"}</h3>
              <button className="close-icon-btn" onClick={closeStudentForm}><X size={20} /></button>
            </div>

            <input
              type="text"
              placeholder="Admission Number"
              value={studentForm.admissionNo}
              onChange={(event) => updateStudentForm("admissionNo", event.target.value)}
            />
            <input
              type="text"
              placeholder="Student Name"
              value={studentForm.studentName}
              onChange={(event) => updateStudentForm("studentName", event.target.value)}
            />

            <select
              value={studentForm.className}
              onChange={(event) => updateStudentForm("className", event.target.value)}
            >
              <option value="">Select Class</option>
              {CLASSES.map((className) => (
                <option key={className} value={className}>
                  Class {className}
                </option>
              ))}
            </select>

            <select
              value={studentForm.section}
              onChange={(event) => updateStudentForm("section", event.target.value)}
            >
              <option value="">Select Section</option>
              {SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>

            <select
              value={studentForm.gender}
              onChange={(event) => updateStudentForm("gender", event.target.value)}
            >
              <option value="">Select Gender</option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Parent Name"
              value={studentForm.parentName}
              onChange={(event) => updateStudentForm("parentName", event.target.value)}
            />
            <input
              type="text"
              placeholder="Parent Phone"
              value={studentForm.parentPhone}
              onChange={(event) => updateStudentForm("parentPhone", event.target.value)}
            />
            <input
              type="text"
              placeholder="Emergency Phone"
              value={studentForm.emergencyPhone}
              onChange={(event) => updateStudentForm("emergencyPhone", event.target.value)}
            />

            <select
              value={studentForm.block}
              onChange={(event) => updateStudentForm("block", event.target.value)}
            >
              <option value="">Select Hostel Block</option>
              {hostelBlocks.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>

            <select
              value={studentForm.roomNo}
              onChange={(event) => updateStudentForm("roomNo", event.target.value)}
            >
              <option value="">Select Room</option>
              {rooms
                .filter((room) => room.block === studentForm.block)
                .map((room) => (
                  <option key={room.id} value={room.roomNo}>
                    {room.roomNo} ({room.capacity - room.occupied} Beds Left)
                  </option>
                ))}
            </select>

            <select
              value={studentForm.bedNo}
              onChange={(event) => updateStudentForm("bedNo", event.target.value)}
            >
              <option value="">Select Bed</option>
              {BEDS.map((bed) => (
                <option key={bed} value={bed}>
                  {bed}
                </option>
              ))}
            </select>

            <div className="form-actions">
              <button className="save-btn" type="button" onClick={handleSaveStudent}>
                <Save size={18} /> 
              </button>
              <button className="cancel-btn" type="button" onClick={closeStudentForm}>
                <X size={18} /> 
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "rooms" && (
        <div className="table-container">
          <table className="hostel-table">
            <thead>
              <tr>
                <th>Room No</th>
                <th>Block</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Occupied</th>
                <th>Vacant</th>
                <th>Status</th>
                <th>Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRooms.map((room) => {
                return (
                  <tr key={room.id}>
                    <td>{room.roomNo}</td>
                    <td>{room.block}</td>
                    <td>{room.floor}</td>
                    <td>{room.capacity}</td>
                    <td>{room.occupied}</td>
                    <td>{room.capacity - room.occupied}</td>
                    <td>
                      <span className={room.status === "Full" ? "status-full" : "status-available"}>
                        {room.status}
                      </span>
                    </td>
                    <td>
                      {/* CHANGED: Removed dynamic parenthetical count from the label */}
                      <button
                        className="view-btn"
                        type="button"
                        onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
                      >
                        <Eye size={14} /> 
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn" type="button" onClick={() => handleEditRoom(room)}>
                          <Edit2 size={14} /> 
                        </button>
                        <button className="delete-btn" type="button" onClick={() => handleDeleteRoom(room.id)}>
                          <Trash2 size={14} /> 
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination
            currentPage={roomPage}
            totalItems={filteredRooms.length}
            onPageChange={setRoomPage}
          />

          {selectedRoom && (
            <div className="room-students-card">
              <h3>Students in Room {selectedRoom.roomNo}</h3>

              <table className="hostel-table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Parent</th>
                    <th>Phone</th>
                    <th>Bed</th>
                  </tr>
                </thead>
                <tbody>
                  {getStudentsByRoom(selectedRoom).map((student) => (
                    <tr key={student.id}>
                      <td>{student.admissionNo}</td>
                      <td>{student.studentName}</td>
                      <td>{student.className}</td>
                      <td>{student.parentName}</td>
                      <td>{student.parentPhone}</td>
                      <td>{student.bedNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "students" && (
        <div className="table-container">
          <table className="hostel-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Student Name</th>
                <th>Block</th>
                <th>Room</th>
                <th>Bed</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.admissionNo}</td>
                  <td>{student.studentName}</td>
                  <td>{student.block}</td>
                  <td>{student.roomNo}</td>
                  <td>{student.bedNo}</td>
                  <td>
                    <button
                      className="view-btn"
                      type="button"
                      onClick={() =>
                        setSelectedStudent(selectedStudent?.id === student.id ? null : student)
                      }
                    >
                      <Eye size={14} /> 
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        type="button"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit2 size={14} /> 
                      </button>
                      <button
                        className="delete-btn"
                        type="button"
                        onClick={() => handleDeleteStudent(student)}
                      >
                        <Trash2 size={14} /> 
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={studentPage}
            totalItems={filteredStudents.length}
            onPageChange={setStudentPage}
          />

          {selectedStudent && (
            <div className="student-profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  <User size={32} />
                </div>
                <div>
                  <h2>{selectedStudent.studentName}</h2>
                  <p>Admission No: {selectedStudent.admissionNo}</p>
                </div>
              </div>

              <div className="profile-grid">
                <div className="profile-section">
                  <h3>Student Information</h3>
                  <p>
                    <strong>Name:</strong> {selectedStudent.studentName}
                  </p>
                  <p>
                    <strong>Class:</strong> {selectedStudent.className}
                  </p>
                  <p>
                    <strong>Section:</strong> {selectedStudent.section}
                  </p>
                  <p>
                    <strong>Gender:</strong> {selectedStudent.gender}
                  </p>
                </div>

                <div className="profile-section">
                  <h3>Parent Information</h3>
                  <p>
                    <strong>Parent Name:</strong> {selectedStudent.parentName}
                  </p>
                  <p>
                    <strong>Parent Phone:</strong> {selectedStudent.parentPhone}
                  </p>
                  <p>
                    <strong>Emergency:</strong> {selectedStudent.emergencyPhone}
                  </p>
                </div>

                <div className="profile-section">
                  <h3>Hostel Information</h3>
                  <p>
                    <strong>Block:</strong> {selectedStudent.block}
                  </p>
                  <p>
                    <strong>Room No:</strong> {selectedStudent.roomNo}
                  </p>
                  <p>
                    <strong>Bed No:</strong> {selectedStudent.bedNo}
                  </p>
                </div>
              </div>

              <div className="profile-footer">
                <button className="close-btn" type="button" onClick={() => setSelectedStudent(null)}>
                  <X size={16} /> Close Profile
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "report" && (
        <div className="report-container">
          <div className="report-overview">
            <div>
              <p className="report-eyebrow">Occupancy Report</p>
              <h3>Hostel Capacity Overview</h3>
            </div>

            <div className="overall-meter">
              <span>{overallOccupancy}%</span>
              <small>Overall Occupancy</small>
              <div className="occupancy-track">
                <div
                  className="occupancy-fill"
                  style={{ width: `${overallOccupancy}%` }}
                />
              </div>
            </div>
          </div>

          <div className="report-metrics">
            <div className="metric-card">
              <span>Total Beds</span>
              <strong>{totalBeds}</strong>
            </div>
            <div className="metric-card">
              <span>Occupied Beds</span>
              <strong>{occupiedBeds}</strong>
            </div>
            <div className="metric-card">
              <span>Available Beds</span>
              <strong>{vacantBeds}</strong>
            </div>
            <div className="metric-card">
              <span>Total Students</span>
              <strong>{totalStudents}</strong>
            </div>
          </div>

          <div className="table-container report-table-card">
            <div className="section-heading">
              <div>
                <h3>Room Occupancy</h3>
              </div>
            </div>

            <table className="hostel-table report-table">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Room No</th>
                  <th>Capacity</th>
                  <th>Occupied</th>
                  <th>Vacant</th>
                  <th>Occupancy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReportRooms.map((room) => {
                  const occupancyPercentage = Math.round((room.occupied / room.capacity) * 100);

                  return (
                    <tr key={room.id}>
                      <td>{room.block}</td>
                      <td>{room.roomNo}</td>
                      <td>{room.capacity}</td>
                      <td>{room.occupied}</td>
                      <td>{room.capacity - room.occupied}</td>
                      <td>
                        <div className="table-meter">
                          <span>{occupancyPercentage}%</span>
                          <div className="occupancy-track">
                            <div
                              className="occupancy-fill"
                              style={{ width: `${occupancyPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={room.status === "Full" ? "status-full" : "status-available"}>
                          {room.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination
              currentPage={reportRoomPage}
              totalItems={rooms.length}
              onPageChange={setReportRoomPage}
            />
          </div>

          <div className="table-container report-table-card">
            <div className="section-heading">
              <div>
                <h3>Block Wise Summary</h3>
              </div>
            </div>

            <table className="hostel-table report-table">
              <thead>
                <tr>
                  <th>Block Name</th>
                  <th>Total Rooms</th>
                  <th>Total Beds</th>
                  <th>Occupied</th>
                  <th>Vacant</th>
                  <th>Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBlockReports.map((report) => (
                    <tr key={report.block}>
                      <td>{report.block}</td>
                      <td>{report.rooms}</td>
                      <td>{report.capacity}</td>
                      <td>{report.occupied}</td>
                      <td>{report.vacant}</td>
                      <td>
                        <div className="table-meter">
                          <span>{report.occupancy}%</span>
                          <div className="occupancy-track">
                            <div
                              className="occupancy-fill"
                              style={{ width: `${report.occupancy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={reportBlockPage}
              totalItems={blockReports.length}
              onPageChange={setReportBlockPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default HostelRooms;
