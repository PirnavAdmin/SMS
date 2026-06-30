import React, { useEffect, useMemo, useState } from 'react';
import './Medium.css';
import mediumReferenceImage from './medium-reference.svg';

const initialMediums = [
  {
    id: 1,
    name: 'English',
    code: 'ENG',
    description: 'English medium',
    status: 'Active',
    createdBy: 'admin@gmail.com',
    createdOn: '22-Jun-2025',
  },
  {
    id: 2,
    name: 'Telugu',
    code: 'TEL',
    description: 'Telugu medium',
    status: 'Active',
    createdBy: 'admin@gmail.com',
    createdOn: '22-Jun-2025',
  },
];

const blankForm = {
  name: '',
  code: '',
  description: '',
  isActive: true,
};

function MediumIcon({ name }) {
  const icons = {
    language: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9M12 3c-3 3-4 6-4 9s1 6 4 9" />
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
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevronLeft: <path d="M15 18l-6-6 6-6" />,
    chevronRight: <path d="M9 6l6 6-6 6" />,
  };

  return (
    <svg className="medium-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {icons[name]}
    </svg>
  );
}

function MediumIllustration() {
  return (
    <div className="medium-illustration" aria-hidden="true">
      <img src={mediumReferenceImage} alt="" />
    </div>
  );
}

function Medium() {
  const [formData, setFormData] = useState(blankForm);
  const [mediums, setMediums] = useState(initialMediums);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesCount, setEntriesCount] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredMediums = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return mediums;
    }

    return mediums.filter((medium) =>
      [
        medium.name,
        medium.code,
        medium.description,
        medium.status,
        medium.createdBy,
        medium.createdOn,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [mediums, searchTerm]);

  const entriesPerPage = Number(entriesCount);
  const totalPages = Math.max(1, Math.ceil(filteredMediums.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleMediums = filteredMediums.slice(startIndex, startIndex + entriesPerPage);
  const firstEntry = filteredMediums.length ? startIndex + 1 : 0;
  const lastEntry = Math.min(startIndex + entriesPerPage, filteredMediums.length);
  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleClear = () => {
    setEditingId(null);
    setFormData(blankForm);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.code.trim() || !formData.description.trim()) {
      return;
    }

    const nextMedium = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      status: formData.isActive ? 'Active' : 'Inactive',
    };

    if (editingId) {
      setMediums((current) =>
        current.map((medium) =>
          medium.id === editingId ? { ...medium, ...nextMedium } : medium
        )
      );
    } else {
      setMediums((current) => [
        ...current,
        {
          id: Date.now(),
          ...nextMedium,
          createdBy: 'admin@gmail.com',
          createdOn: '22-Jun-2025',
        },
      ]);
    }

    handleClear();
  };

  const handleEdit = (medium) => {
    setEditingId(medium.id);
    setFormData({
      name: medium.name,
      code: medium.code,
      description: medium.description,
      isActive: medium.status === 'Active',
    });
  };

  const handleDelete = (id) => {
    setMediums((current) => current.filter((medium) => medium.id !== id));

    if (editingId === id) {
      handleClear();
    }
  };

  return (
    <div className="medium-page">
      <section className="medium-card medium-form-card" aria-labelledby="medium-form-title">
        <MediumIllustration />
        <div className="medium-section-title">
          <span className="medium-title-icon">
            <MediumIcon name="language" />
          </span>
          <h3 id="medium-form-title">Configuration / Medium</h3>
        </div>

        <div className="medium-form-layout">
          <form className="medium-form" onSubmit={handleSubmit}>
            <label className="medium-field">
              <span>Name <strong>*</strong></span>
              <input
                name="name"
                placeholder="Enter medium name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="medium-field">
              <span>Code <strong>*</strong></span>
              <input
                name="code"
                placeholder="Enter code"
                value={formData.code}
                onChange={handleChange}
                required
              />
            </label>

            <label className="medium-field medium-description-field">
              <span>Description <strong>*</strong></span>
              <textarea
                name="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </label>

            <label className="medium-check-field">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span>Is Active?</span>
            </label>

            <div className="medium-actions">
              <button type="submit" className="medium-save">
                <MediumIcon name="save" />
                {editingId ? 'Update' : 'Save'}
              </button>
              <button type="button" className="medium-clear" onClick={handleClear}>
                <MediumIcon name="clear" />
                Clear
              </button>
            </div>
          </form>

        </div>
      </section>

      <section className="medium-card medium-details-card" aria-labelledby="medium-details-title">
        <div className="medium-section-title">
          <span className="medium-title-icon">
            <MediumIcon name="language" />
          </span>
          <h3 id="medium-details-title">Medium Details</h3>
        </div>

        <div className="medium-toolbar">
          <label className="medium-show">
            <span>Show</span>
            <select value={entriesCount} onChange={(event) => { setEntriesCount(event.target.value); setCurrentPage(1); }}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span>entries</span>
          </label>

          <div className="medium-table-tools"><span className="medium-search-icon"><MediumIcon name="search" /></span>
            <input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="medium-table-wrap">
          <table className="medium-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name <span></span></th>
                <th>Code <span></span></th>
                <th>Status <span></span></th>
                <th>Created By <span></span></th>
                <th>Created On <span></span></th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleMediums.length > 0 ? (
                visibleMediums.map((medium, index) => (
                  <tr key={medium.id}>
                    <td>{startIndex + index + 1}</td>
                    <td>{medium.name}</td>
                    <td>{medium.code}</td>
                    <td>
                      <span className={`medium-status ${medium.status.toLowerCase()}`}>
                        {medium.status}
                      </span>
                    </td>
                    <td>{medium.createdBy}</td>
                    <td>{medium.createdOn}</td>
                    <td>
                      <div className="medium-row-actions">
                        <button
                          type="button"
                          className="medium-edit"
                          aria-label={`Edit ${medium.name}`}
                          onClick={() => handleEdit(medium)}
                        >
                          <MediumIcon name="edit" />
                        </button>
                        <button
                          type="button"
                          className="medium-delete"
                          aria-label={`Delete ${medium.name}`}
                          onClick={() => handleDelete(medium.id)}
                        >
                          <MediumIcon name="delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="medium-empty" colSpan="7">
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="medium-table-footer">
          <span>
            Showing {firstEntry} to {lastEntry} of {filteredMediums.length} entries
          </span>
          <div className="medium-pagination">
            <button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>
              <MediumIcon name="chevronLeft" />
            </button>
            <button type="button" className="active">{currentPage}</button>
            <button type="button" aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>
              <MediumIcon name="chevronRight" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Medium;
