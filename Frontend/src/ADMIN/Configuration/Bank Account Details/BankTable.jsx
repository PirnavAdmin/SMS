import React from "react";
import { BankDetailsIcon, DeleteIcon, EditIcon } from "./BankIcons";

function BankTable({
  banks,
  entries,
  search,
  currentPage,
  entriesPerPage,
  totalEntries,
  totalPages,
  onEntriesChange,
  onSearchChange,
  onPageChange,
  onEdit,
  onDelete,
}) {
  const firstEntry = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const lastEntry = Math.min(currentPage * entriesPerPage, totalEntries);
  const isPreviousDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <section className="bank-card bank-details-card">
      <div className="bank-section-title">
        <BankDetailsIcon />
        <h3>Bank Details</h3>
      </div>

      <div className="bank-table-tools">
        <label className="bank-show-control">
          <span>Show</span>
          <select value={entries} onChange={(event) => onEntriesChange(event.target.value)}>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span>entries</span>
        </label>

        <label className="bank-search-control">
          <span>Search:</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} />
        </label>
      </div>

      <div className="bank-table-wrap">
        <table className="bank-table">
          <thead>
            <tr>
              <th>Bank Name</th>
              <th>Branch Name</th>
              <th>A/c Holder</th>
              <th>A/c No</th>
              <th>Institute Name</th>
              <th>IFSC Code</th>
              <th>Fee Type</th>
              <th className="bank-action-column">Action</th>
            </tr>
          </thead>
          <tbody>
            {banks.length > 0 ? (
              banks.map((bank) => (
                <tr key={bank.id}>
                  <td>{bank.bankName}</td>
                  <td>{bank.branchName}</td>
                  <td>{bank.accountHolder}</td>
                  <td>{bank.accountNumber}</td>
                  <td>{bank.instituteName}</td>
                  <td>{bank.ifscCode}</td>
                  <td>{bank.feeType}</td>
                  <td className="bank-action-column">
                    <div className="bank-action-buttons">
                      <button
                        className="bank-edit-button"
                        type="button"
                        onClick={() => onEdit(bank)}
                      >
                        <EditIcon />
                        Edit
                      </button>
                      <button
                        className="bank-delete-button"
                        type="button"
                        onClick={() => onDelete(bank.id)}
                      >
                        <DeleteIcon />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="bank-empty" colSpan="8">
                  No bank details added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bank-pagination-bar">
        <p>
          Showing {firstEntry} to {lastEntry} of {totalEntries} entries
        </p>

        <div className="bank-pagination-actions" aria-label="Bank details pagination">
          <button
            className="bank-page-button"
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isPreviousDisabled}
          >
            Prev
          </button>
          <button className="bank-page-button bank-page-current" type="button">
            {currentPage}
          </button>
          <button
            className="bank-page-button"
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isNextDisabled}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default BankTable;
