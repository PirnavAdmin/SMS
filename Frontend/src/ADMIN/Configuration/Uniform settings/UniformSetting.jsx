import React, { useState } from "react";
import AddUniformSettings from "./AddUniformSettings";
import UniformSettingList from "./UniformSettingList";
import "./UniformSetting.css";

const UniformSetting = () => {
  const [uniformData, setUniformData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSave = (formData) => {
    if (editData) {
      const updatedData = uniformData.map((item) =>
        item.id === editData.id
          ? {
              ...formData,
              id: editData.id,
            }
          : item,
      );

      setUniformData(updatedData);
      setEditData(null);

      alert("Record Updated Successfully");
    } else {
      const newRecord = {
        id: Date.now(),
        ...formData,
      };

      setUniformData([...uniformData, newRecord]);

      alert("Record Saved Successfully");
    }
  };

  const handleEdit = (row) => {
    setEditData(row);
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?",
    );

    if (confirmDelete) {
      const filteredData = uniformData.filter((item) => item.id !== id);

      setUniformData(filteredData);

      if (editData && editData.id === id) {
        setEditData(null);
      }

      alert("Record Deleted Successfully");
    }
  };

  // Search Filter
  const filteredData = uniformData.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.academicYear.toLowerCase().includes(search) ||
      item.className.toLowerCase().includes(search) ||
      item.uniforms.some((uniform) => uniform.toLowerCase().includes(search))
    );
  });

  return (
    <div className="uniform-fee-page">
      <AddUniformSettings onSave={handleSave} editData={editData} />

      <UniformSettingList
        data={filteredData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default UniformSetting;
