import { useState, useEffect } from "react";
import { FaTrash, FaSearch,FaSave,FaTimes,FaCalendarAlt,FaTag,FaClipboard,FaCalendarTimes,FaEdit} from "react-icons/fa";
import "./HolidayManagement.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function HolidayManagement() {
  const [holidayDate, setHolidayDate] = useState(null);
  const [holidayName, setHolidayName] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
const [entriesPerPage,setEntriesPerPage] = useState(5);

 const [holidays, setHolidays] = useState(() => {
  const saved = localStorage.getItem("holidays");
  return saved ? JSON.parse(saved) : defaultHolidays;
});

  const [errors, setErrors] = useState({
  holidayDate: "",
  holidayName: "",
  description: "",
  academicYear: "",
});

  const defaultHolidays = [
    {
      id: 1,
      date: "2026-01-01",
      name: "New Year",
      description: "New Year Holiday",
    },
    {
      id: 2,
      date: "2026-01-26",
      name: "Republic Day",
      description: "National Holiday",
    },
    {
      id: 3,
      date: "2026-05-01",
      name: "May Day",
      description: "Labour Day",
    },
    {
      id: 4,
      date: "2026-08-15",
      name: "Independence Day",
      description: "National Holiday",
    },
    {
      id: 5,
      date: "2026-12-25",
      name: "Christmas",
      description: "Festival Holiday",
    },
  ];
 

  useEffect(() => {
  localStorage.setItem("holidays", JSON.stringify(holidays));
}, [holidays]);

  const filteredHolidays = holidays.filter((holiday) => {
    const search = searchTerm.toLowerCase();

    return (
      holiday.name.toLowerCase().includes(search) ||
      holiday.description.toLowerCase().includes(search) ||
      holiday.date.includes(search) ||
      new Date(holiday.date)
        .toLocaleDateString("en-GB")
        .includes(search)
    );
  });
  const indexOfLastHoliday = currentPage * entriesPerPage;
const indexOfFirstHoliday = indexOfLastHoliday - entriesPerPage;

const currentHolidays = filteredHolidays.slice(
  indexOfFirstHoliday,
  indexOfLastHoliday
);

const totalPages = Math.ceil(
  filteredHolidays.length / entriesPerPage
);

  const addHoliday = () => {
    let newErrors = {};

  if (!holidayDate) {
    newErrors.holidayDate = "Holiday Date is required";
  }

  if (!holidayName.trim()) {
    newErrors.holidayName = "Holiday Name is required";
  }

  if (!description.trim()) {
    newErrors.description = "Description is required";
  }

  if (!academicYear.trim()) {
    newErrors.academicYear = "Academic Year is required";
  }

  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    return;
  }


    const newHoliday = {
      id: Date.now(),
      date: holidayDate.toISOString().split("T")[0],
      name: holidayName,
      description,
      academicYear,
    };

    const updatedHolidays = [...holidays, newHoliday];

    updatedHolidays.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    setHolidays(updatedHolidays);
    setCurrentPage(1);
    setHolidayDate(null);
    setHolidayName("");
    setDescription("");
    setAcademicYear("");

    setErrors({
  holidayDate: "",
  holidayName: "",
  description: "",
  academicYear: "",
});
  };

  const editHoliday = (holiday) => {
  setHolidayDate(new Date(holiday.date));
  setHolidayName(holiday.name);
  setDescription(holiday.description);

  // Remove the old record so that saving updates it
  setHolidays(
    holidays.filter((h) => h.id !== holiday.id)
  );
};

  const removeHoliday = (id) => {
    setHolidays(
      holidays.filter((holiday) => holiday.id !== id)
    );
  };

  return (
    <div className="holiday-page">
      <div className="section-header">
        <h3>📅 Configuration / Holiday</h3>
      </div>

      <div className="holiday-form-card">
        <div className="form-row">
          <div className="form-group">
    
            <label><FaCalendarAlt/> Holiday Date<span className="required">*</span></label>
                <div className="input-box">

                    <DatePicker
                    selected={holidayDate}
                    onChange={(date) => {
                    setHolidayDate(date);
                    setErrors({ ...errors, holidayDate: "" });
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                    className="date-input"
                    />
                </div>
        
  <div className="error-text">
    {errors.holidayDate}
  </div>
</div>
          <div className="form-group">
            <label> <FaTag/> Holiday Name <span className="required">*</span></label>
                <div className="input-box">
            <input
              type="text"
              placeholder="Enter Holiday Name"
              value={holidayName}
              onChange={(e) =>{
                setHolidayName(e.target.value);
                setErrors({
                 ...errors,
                 holidayName: "",
                });
              }}
            />
          </div>
        
        <div className="error-text">
        {errors.holidayName}
        </div>
    </div>
</div>
        <div className="form-row">
          <div
            className="form-group"
            style={{ flex: 2 }}
          >
            <label> <FaClipboard/> Description <span className="required">*</span> </label>

            <textarea
              value={description}
              onChange={(e) =>{
                setDescription(e.target.value);
                setErrors({...errors,description: "", });
              }}
            />
        
  <div className="error-text">
    {errors.description}
  </div>
</div>

          <div
            className="form-group"
            style={{ flex: 1 }}
          >
            <label> <FaCalendarTimes/> Academic Year <span className="required">*</span></label>

            <select
              value={academicYear}
              onChange={(e) =>{
                setAcademicYear(e.target.value);
                setErrors({...errors,academicYear:"",});
              }}
            >
              <option value="">Select Academic Year</option>
              <option value="2026-2027">2026-2027</option>
              <option value="2027-2028">2027-2028</option>
            </select>

            
  <div className="error-text">
    {errors.academicYear}
  </div>
          </div>
        </div>

        <div className="button-group">
          <button
            className="save-btn"
            onClick={addHoliday}
          >
            <FaSave/>
            <span>Save </span>
          </button>

          <button
            className="cancel-btn"
            onClick={() => {
              setHolidayDate("");
              setHolidayName("");
              setDescription("");
            }}
          >
            <FaTimes/>
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="section-header">
        <h3>📋 Holiday Details</h3>
      </div>

      <div className="table-card">
        <div className="table-top">
          <div className="entries-section">
            <span>Show</span>

            <select className="entries"
            value={entriesPerPage}
            onChange={(e)=>{
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);}}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>

            <span>Entries</span>
          </div>
          <div className="search-wrapper">
        <div className="search-container">
            <FaSearch className="search-icon"/>
          <input
            type="text"
            placeholder="Search "
            className="search-box"
            value={searchTerm}
            onChange={(e) =>{
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Month</th>
              <th>Name</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredHolidays.length > 0 ? (
              currentHolidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td>
                    {new Date(
                      holiday.date
                    ).toLocaleDateString(
                      "en-GB"
                    )}
                  </td>

                  <td>
                    {new Date(
                      holiday.date
                    ).toLocaleString(
                      "default",
                      {
                        month: "long",
                      }
                    )}
                  </td>

                  <td>{holiday.name}</td>
                  <td>{holiday.description}</td>
                  <td className="action-cell">
                    <div className="action-buttons">
                    <button
                        className="icon-edit"
                        onClick={() => editHoliday(holiday)}
                        title="Edit"
                    >
                        <FaEdit />
                    </button>
                    <button
                      className="icon-delete"
                      onClick={() => removeHoliday(holiday.id)}
                      title="Delete"
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
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No holidays found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">

  <span>
    Showing {indexOfFirstHoliday + 1} to {indexOfFirstHoliday + currentHolidays.length} of {filteredHolidays.length} entries
  </span>


    
   <div className="pagination">

  <button
    className="arrow-btn"
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(currentPage - 1)}
  >
    ◀
  </button>

  <span className="page-indicator">
    Page {currentPage} of {totalPages}
  </span>

  <button
    className="arrow-btn"
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage(currentPage + 1)}
  >
    ▶
  </button>

</div> 
</div>
</div>
</div>

  );
}

export default HolidayManagement;