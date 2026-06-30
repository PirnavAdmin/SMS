import React, { useEffect, useState } from "react";
import { Eraser, Save, Shirt } from "lucide-react";

const emptyForm = { academicYear: "2024-2025", uniformName: "", size: "", gender: "Male", fee: "" };

export default function AddUniformFee({ onSave, editData, onCancelEdit }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(editData ? { academicYear: editData.academicYear, uniformName: editData.uniformName, size: editData.size, gender: editData.gender, fee: editData.fee } : emptyForm);
    setErrors({});
  }, [editData]);

  const update = (name, value) => { setForm((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: "" })); };
  const clear = () => { setForm(emptyForm); setErrors({}); onCancelEdit(); };
  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.academicYear) nextErrors.academicYear = "Academic Year is required";
    if (!form.uniformName) nextErrors.uniformName = "Uniform Name is required";
    if (!form.size) nextErrors.size = "Size / Quantity is required";
    if (!form.fee) nextErrors.fee = "Fee is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, createdBy: "admin@gmail.com" });
    setForm(emptyForm);
  };

  return <section className="uf-card uf-form-card">
    <div className="uf-watermark" aria-hidden="true"><Shirt /></div>
    <div className="uf-section-title"><span className="uf-heading-icon"><Shirt /></span><h3>Configuration / Uniform Fee</h3></div>
    <form className="uf-form" onSubmit={submit}>
      <label className="uf-field"><span>Academic Year *</span><select value={form.academicYear} onChange={(e) => update("academicYear", e.target.value)}><option>2024-2025</option><option>2025-2026</option></select>{errors.academicYear && <small>{errors.academicYear}</small>}</label>
      <label className="uf-field"><span>Uniform Name *</span><select value={form.uniformName} onChange={(e) => update("uniformName", e.target.value)}><option value="">Select Name</option><option>Boys Dongri</option><option>Girls Dongri</option></select>{errors.uniformName && <small>{errors.uniformName}</small>}</label>
      <label className="uf-field"><span>Size / Quantity *</span><select value={form.size} onChange={(e) => update("size", e.target.value)}><option value="">Select Size</option><option>10</option><option>12</option><option>14</option></select>{errors.size && <small>{errors.size}</small>}</label>
      <label className="uf-field"><span>Fee *</span><input type="number" min="0" value={form.fee} onChange={(e) => update("fee", e.target.value)} placeholder="Enter Fee" />{errors.fee && <small>{errors.fee}</small>}</label>
      <div className="uf-gender"><span>Gender</span><label><input type="radio" checked={form.gender === "Male"} onChange={() => update("gender", "Male")} /> Male</label><label><input type="radio" checked={form.gender === "Female"} onChange={() => update("gender", "Female")} /> Female</label></div>
      <div className="uf-form-actions"><button className="uf-save" type="submit"><Save />{editData ? "Update Fee" : "Save Fee"}</button><button className="uf-clear" type="button" onClick={clear}><Eraser />Clear</button></div>
    </form>
  </section>;
}
