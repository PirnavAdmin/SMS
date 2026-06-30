import React, { useEffect, useMemo, useState } from 'react';
import './BookeFee.css';

const academicYears = ['2024-2025', '2023-2024', '2022-2023'];
const classes = [
  'LKG',
  'UKG',
  '1st Class',
  '2nd Class',
  '3rd Class',
  '4th Class',
  '5th Class',
  '6th Class',
  '7th Class',
  '8th Class',
  '9th Class',
  '10th Class',
];

const initialRows = [
  {
    id: 1,
    academicYear: '2023-2024',
    className: '10th Class',
    price: '6000',
    additionalPrice: '0',
    createdBy: 'admin@gmail.com',
    createdOn: '22-Jun-2025',
  },
  {
    id: 2,
    academicYear: '2024-2025',
    className: 'LKG',
    price: '2858',
    additionalPrice: '0',
    createdBy: 'admin@gmail.com',
    createdOn: '22-Jun-2025',
  },
];

const blankForm = {
  academicYear: '2024-2025',
  className: '',
  price: '',
  additionalPrice: '',
};

function BooksFeeIcon({ name }) {
  const icons = {
    document: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5" />
        <path d="M10 12h6" />
        <path d="M10 16h6" />
      </>
    ),
    save: (
      <>
        <path d="M5 3h11l3 3v15H5z" />
        <path d="M8 3v6h8V3" />
        <path d="M8 21v-7h8v7" />
      </>
    ),
    clear: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4L19 9l-4-4L4 16z" />
        <path d="M13 7l4 4" />
      </>
    ),
    delete: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="M7 7l1 14h8l1-14" />
      </>
    ),
    filter: (
      <>
        <path d="M4 5h16l-6 7v6l-4 2v-8z" />
      </>
    ),
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevronLeft: <path d="M15 18l-6-6 6-6" />,
    chevronRight: <path d="M9 6l6 6-6 6" />,
  };

  return (
    <svg className="books-fee-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {icons[name]}
    </svg>
  );
}

function BooksFeeIllustration() {
  return (
    <div className="books-fee-illustration" aria-hidden="true">
      <div className="books-fee-orbit one" />
      <div className="books-fee-orbit two" />
      <div className="books-fee-book-stack">
        <span />
        <span />
        <span />
      </div>
      <div className="books-fee-clipboard">
        <div className="books-fee-clip" />
        <span />
        <span />
        <span />
      </div>
      <div className="books-fee-plant">
        <span />
        <span />
        <i />
      </div>
    </div>
  );
}

function BookeFee() {
  const [formData, setFormData] = useState(blankForm);
  const [rows, setRows] = useState(initialRows);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesCount, setEntriesCount] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.academicYear,
        row.className,
        row.price,
        row.additionalPrice,
        row.createdBy,
        row.createdOn,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [rows, searchTerm]);

  const entriesPerPage = Number(entriesCount);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleRows = filteredRows.slice(startIndex, startIndex + entriesPerPage);
  const firstEntry = filteredRows.length ? startIndex + 1 : 0;
  const lastEntry = Math.min(startIndex + entriesPerPage, filteredRows.length);

  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleClear = () => {
    setEditingId(null);
    setFormData(blankForm);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.academicYear || !formData.className || !formData.price) {
      return;
    }

    const nextRow = {
      academicYear: formData.academicYear,
      className: formData.className,
      price: formData.price,
      additionalPrice: formData.additionalPrice || '0',
    };

    if (editingId) {
      setRows((current) =>
        current.map((row) => (row.id === editingId ? { ...row, ...nextRow } : row))
      );
    } else {
      setRows((current) => [
        ...current,
        {
          id: Date.now(),
          ...nextRow,
          createdBy: 'admin@gmail.com',
          createdOn: '22-Jun-2025',
        },
      ]);
    }

    handleClear();
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setFormData({
      academicYear: row.academicYear,
      className: row.className,
      price: row.price,
      additionalPrice: row.additionalPrice,
    });
  };

  const handleDelete = (id) => {
    setRows((current) => current.filter((row) => row.id !== id));

    if (editingId === id) {
      handleClear();
    }
  };

  return (
    <div className="books-fee-page">
      <section className="books-fee-card books-fee-form-card" aria-labelledby="books-fee-form-title">
        <BooksFeeIllustration />
        <div className="books-fee-section-title">
          <span className="books-fee-title-icon">
            <BooksFeeIcon name="document" />
          </span>
          <h3 id="books-fee-form-title">Configuration / Books Fee</h3>
        </div>

        <div className="books-fee-form-layout">
          <form className="books-fee-form" onSubmit={handleSubmit}>
            <label className="books-fee-field">
              <span>Academic Year <strong>*</strong></span>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                required
              >
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="books-fee-field">
              <span>Class <strong>*</strong></span>
              <select
                name="className"
                value={formData.className}
                onChange={handleChange}
                required
              >
                <option value="">Select Class</option>
                {classes.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </label>

            <label className="books-fee-field">
              <span>Books Price <strong>*</strong></span>
              <input
                name="price"
                type="number"
                min="0"
                placeholder="Enter books price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </label>

            <label className="books-fee-field">
              <span>Additional Books Price</span>
              <input
                name="additionalPrice"
                type="number"
                min="0"
                placeholder="Enter additional price"
                value={formData.additionalPrice}
                onChange={handleChange}
              />
            </label>

            <div className="books-fee-actions">
              <button type="submit" className="books-fee-save">
                <BooksFeeIcon name="save" />
                {editingId ? 'Update' : 'Save'}
              </button>
              <button type="button" className="books-fee-clear" onClick={handleClear}>
                <BooksFeeIcon name="clear" />
                Clear
              </button>
            </div>
          </form>

        </div>
      </section>

      <section className="books-fee-card books-fee-details-card" aria-labelledby="books-fee-details-title">
        <div className="books-fee-section-title">
          <span className="books-fee-title-icon">
            <BooksFeeIcon name="document" />
          </span>
          <h3 id="books-fee-details-title">Books Fee Details</h3>
        </div>

        <div className="books-fee-table-toolbar">
          <label className="books-fee-show">
            <span>Show</span>
            <select value={entriesCount} onChange={(event) => { setEntriesCount(event.target.value); setCurrentPage(1); }}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span>entries</span>
          </label>

          <div className="books-fee-table-tools">
  <div className="books-fee-search">
    <BooksFeeIcon name="search" className="books-fee-search-icon" />
    <input
      type="search"
      placeholder="Search..."
      value={searchTerm}
      onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }}
    />
  </div>

          </div>
        </div>

        <div className="books-fee-table-wrap">
          <table className="books-fee-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Academic Year <span></span></th>
                <th>Class <span></span></th>
                <th>Price <span></span></th>
                <th>Additional Price <span></span></th>
                <th>Created By <span></span></th>
                <th>Created On <span></span></th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length > 0 ? (
                visibleRows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{startIndex + index + 1}</td>
                    <td>{row.academicYear}</td>
                    <td>{row.className}</td>
                    <td>{row.price}</td>
                    <td>{row.additionalPrice}</td>
                    <td>{row.createdBy}</td>
                    <td>{row.createdOn}</td>
                    <td>
                      <div className="books-fee-row-actions">
                        <button
                          type="button"
                          className="books-fee-edit"
                          aria-label={`Edit ${row.className} books fee`}
                          onClick={() => handleEdit(row)}
                        >
                          <BooksFeeIcon name="edit" />
                        </button>
                        <button
                          type="button"
                          className="books-fee-delete"
                          aria-label={`Delete ${row.className} books fee`}
                          onClick={() => handleDelete(row.id)}
                        >
                          <BooksFeeIcon name="delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="books-fee-empty" colSpan="8">
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="books-fee-table-footer">
          <span>
            Showing {firstEntry} to {lastEntry} of {filteredRows.length} entries
          </span>
          <div className="books-fee-pagination">
            <button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>
              <BooksFeeIcon name="chevronLeft" />
            </button>
            <button type="button" className="active">{currentPage}</button>
            <button type="button" aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>
              <BooksFeeIcon name="chevronRight" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BookeFee;
