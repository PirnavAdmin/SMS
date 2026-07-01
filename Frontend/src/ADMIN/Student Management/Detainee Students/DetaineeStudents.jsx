import React, { useMemo, useState } from 'react';
import './DetaineeStudents.css';
import { initialStudents } from '../StudentManagement';

const defaultDetaineeReasons = [
  { rollNo: 'STD-101', reason: 'Missing classes without permission' },
  { rollNo: 'STD-102', reason: 'Frequent lateness to school' },
  { rollNo: 'STD-103', reason: 'Violating school conduct policy' },
  { rollNo: 'STD-104', reason: 'Counselling scheduled for attendance issues' },
  { rollNo: 'STD-105', reason: 'Disciplinary review pending' },
];

function DetaineeStudents() {
  const [selectedRollNo, setSelectedRollNo] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [detaineeRecords, setDetaineeRecords] = useState(defaultDetaineeReasons);
  const [message, setMessage] = useState('');

  const selectedDetaineeRecord = useMemo(
    () => detaineeRecords.find((record) => record.rollNo === selectedRollNo),
    [detaineeRecords, selectedRollNo]
  );

  const handleGetStudent = () => {
    const student = initialStudents.find((item) => item.rollNo === selectedRollNo);
    setSelectedStudent(student || null);
    setSelectedReason(selectedDetaineeRecord?.reason || '');
    setMessage('');
  };

  const handleCancel = () => {
    setSelectedRollNo('');
    setSelectedStudent(null);
    setSelectedReason('');
    setMessage('');
  };

  const handleSaveReason = () => {
    if (!selectedStudent) {
      setMessage('Choose a student before updating the detainee reason.');
      return;
    }

    setDetaineeRecords((prev) => {
      const existing = prev.find((record) => record.rollNo === selectedRollNo);
      if (existing) {
        return prev.map((record) =>
          record.rollNo === selectedRollNo ? { ...record, reason: selectedReason } : record
        );
      }
      return [...prev, { rollNo: selectedRollNo, reason: selectedReason }];
    });

    setMessage('Detainee reason saved successfully.');
  };

  const handleDeleteReason = () => {
    if (!selectedDetaineeRecord) {
      setMessage('No detainee reason is available to delete for this student.');
      return;
    }

    setDetaineeRecords((prev) => prev.filter((record) => record.rollNo !== selectedRollNo));
    setSelectedReason('');
    setMessage('Detainee reason deleted.');
  };

  const handleEditRecord = (rollNo) => {
    setSelectedRollNo(rollNo);
    const student = initialStudents.find((item) => item.rollNo === rollNo);
    setSelectedStudent(student || null);
    setSelectedReason(detaineeRecords.find((record) => record.rollNo === rollNo)?.reason || '');
    setMessage('');
  };

  return (
    <section className="student-management-page detainee-students-page">
      <p className="student-management-page__eyebrow">Student Management</p>
      <h2>Detainee Students</h2>

      <div className="detainee-actions-card">
        <div className="detainee-row">
          <label htmlFor="detainee-rollno">RNo</label>
          <select
            id="detainee-rollno"
            value={selectedRollNo}
            onChange={(e) => setSelectedRollNo(e.target.value)}
            className="detainee-select"
          >
            <option value="">Select Here</option>
            {initialStudents.map((student) => (
              <option key={student.rollNo} value={student.rollNo}>
                {student.rollNo} - {student.name}
              </option>
            ))}
          </select>

          <div className="detainee-buttons">
            <button type="button" className="primary-button" disabled={!selectedRollNo} onClick={handleGetStudent}>
              Get Student
            </button>
            <button type="button" className="secondary-button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>

        {selectedStudent ? (
          <div className="detainee-details-card">
            <div className="detainee-detail-row">
              <span>Name</span>
              <strong>{selectedStudent.name}</strong>
            </div>
            <div className="detainee-detail-row">
              <span>Grade / Section</span>
              <strong>{selectedStudent.grade} / {selectedStudent.section}</strong>
            </div>
            <div className="detainee-detail-row">
              <span>Contact</span>
              <strong>{selectedStudent.contact}</strong>
            </div>
            <div className="detainee-detail-row">
              <span>Status</span>
              <strong>{selectedStudent.status}</strong>
            </div>
            <div className="detainee-detail-row detainee-detail-reason">
              <label htmlFor="reason-textarea">Detainee Reason</label>
              <textarea
                id="reason-textarea"
                className="detainee-textarea"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                placeholder="Enter or update the detainee reason"
              />
            </div>

            <div className="detainee-reason-actions">
              <button type="button" className="primary-button" onClick={handleSaveReason}>
                Save Reason
              </button>
              <button type="button" className="secondary-button" onClick={handleDeleteReason}>
                Delete Reason
              </button>
            </div>

            {message && <p className="detainee-feedback">{message}</p>}
          </div>
        ) : (
          <div className="student-management-page__empty">
            Select a student and click Get Student to view or edit detainee reason.
          </div>
        )}
      </div>

      <div className="detainee-records-card">
        <h3>Current Detainee Records</h3>
        {detaineeRecords.length === 0 ? (
          <div className="student-management-page__empty">No detainee records available.</div>
        ) : (
          <div className="detainee-table-wrapper">
            <table className="detainee-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {detaineeRecords.map((record) => {
                  const student = initialStudents.find((item) => item.rollNo === record.rollNo);
                  return (
                    <tr key={record.rollNo}>
                      <td>{record.rollNo}</td>
                      <td>{student?.name || 'Unknown'}</td>
                      <td>{record.reason}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-button table-action-button"
                          onClick={() => handleEditRecord(record.rollNo)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="secondary-button table-action-button"
                          onClick={() => {
                            setSelectedRollNo(record.rollNo);
                            setSelectedStudent(initialStudents.find((item) => item.rollNo === record.rollNo) || null);
                            setSelectedReason(record.reason);
                            setMessage('');
                          }}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          className="secondary-button table-action-button"
                          onClick={() => {
                            setDetaineeRecords((prev) => prev.filter((item) => item.rollNo !== record.rollNo));
                            if (selectedRollNo === record.rollNo) {
                              setSelectedReason('');
                            }
                            setMessage('Record removed from detainee list.');
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default DetaineeStudents;
