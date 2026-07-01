import React, { useState } from 'react';
import './Student360.css';

function Student360() {
  const [rollNumber, setRollNumber] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleCancel = () => {
    setRollNumber('');
  };

  return (
    <div className="student360-page">
      <section className="student360-panel" aria-labelledby="student360-title">
        <div className="student360-panel__header">
          <span className="student360-panel__menu" aria-hidden="true">
            &#9776;
          </span>
          <h3 id="student360-title">Student Details</h3>
        </div>

        <form className="student360-form" onSubmit={handleSubmit}>
          <label className="student360-field" htmlFor="student360-rno">
            RNo
          </label>
          <input
            id="student360-rno"
            className="student360-input"
            type="text"
            value={rollNumber}
            onChange={(event) => setRollNumber(event.target.value)}
            placeholder="Select Here"
          />
          <button className="student360-fetch" type="submit">
            <span aria-hidden="true">&#10004;</span>
            Fetch Data
          </button>
          <button className="student360-cancel" type="button" onClick={handleCancel}>
            Cancel
          </button>
        </form>
      </section>
    </div>
  );
}

export default Student360;
