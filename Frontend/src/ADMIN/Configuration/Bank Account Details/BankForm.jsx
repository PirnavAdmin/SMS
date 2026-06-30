import React from "react";
import { BankLogoIcon, CancelIcon, ClearIcon, SaveIcon } from "./BankIcons";

const feeTypes = ["Tuition Fee", "Books Fee", "Uniform Fee", "Bus Fee", "Hostel Fee"];

function BankForm({ formData, isEditing, onChange, onCancel, onSubmit }) {
  return (
    <section className="bank-card bank-form-card">
      <div className="bank-hero-art" aria-hidden="true">
        <span className="bank-art-building" />
        <span className="bank-art-card bank-art-card-one" />
        <span className="bank-art-card bank-art-card-two" />
      </div>

      <div className="bank-section-title">
        <BankLogoIcon />
        <h3>Configuration / Bank</h3>
      </div>

      <form className="bank-form" onSubmit={onSubmit}>
        <label className="bank-field">
          <span>Bank Name *</span>
          <input
            name="bankName"
            value={formData.bankName}
            onChange={onChange}
            placeholder="Enter Bank Name"
            required
          />
        </label>

        <label className="bank-field">
          <span>Branch Name *</span>
          <input
            name="branchName"
            value={formData.branchName}
            onChange={onChange}
            placeholder="Enter Branch Name"
            required
          />
        </label>

        <label className="bank-field">
          <span>A/c Holder *</span>
          <input
            name="accountHolder"
            value={formData.accountHolder}
            onChange={onChange}
            placeholder="Enter Account Holder"
            required
          />
        </label>

        <label className="bank-field">
          <span>A/c Number *</span>
          <input
            name="accountNumber"
            value={formData.accountNumber}
            onChange={onChange}
            placeholder="Enter Account Number"
            required
          />
        </label>

        <label className="bank-field">
          <span>Institute Name *</span>
          <input
            name="instituteName"
            value={formData.instituteName}
            onChange={onChange}
            placeholder="Enter Institute Name"
            required
          />
        </label>

        <label className="bank-field">
          <span>IFSC Code *</span>
          <input
            name="ifscCode"
            value={formData.ifscCode}
            onChange={onChange}
            placeholder="Enter IFSC Code"
            required
          />
        </label>

        <label className="bank-field">
          <span>Fee Type *</span>
          <select
            name="feeType"
            value={formData.feeType}
            onChange={onChange}
            required
          >
            <option value="">Select Fee Type</option>
            {feeTypes.map((feeType) => (
              <option key={feeType} value={feeType}>
                {feeType}
              </option>
            ))}
          </select>
        </label>

        <div className="bank-form-actions">
          <button className="bank-save-button" type="submit">
            <SaveIcon />
            {isEditing ? "Update Bank" : "Save Bank"}
          </button>
          <button className="bank-clear-button" type="button" onClick={onCancel}>
            <ClearIcon />
            Clear
          </button>
          {isEditing && (
            <button className="bank-cancel-button" type="button" onClick={onCancel}>
              <CancelIcon />
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default BankForm;
