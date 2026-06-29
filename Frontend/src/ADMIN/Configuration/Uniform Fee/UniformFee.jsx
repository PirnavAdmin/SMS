import React, { useState } from "react";
import AddUniformFee from "./AddUniformFee";
import UniformFeeList from "./UniformFeeList";
import "./UniformFee.css";

const UniformFee = () => {
  const [feeData, setFeeData] = useState([]);
  const [editData, setEditData] = useState(null);

  const handleSave = (formData) => {
    if (editData) {
      setFeeData(
        feeData.map((item) =>
          item.id === editData.id ? { ...formData, id: editData.id } : item,
        ),
      );

      setEditData(null);
      alert("Updated Successfully");
    } else {
      setFeeData([
        ...feeData,
        {
          id: Date.now(),
          ...formData,
        },
      ]);

      alert("Saved Successfully");
    }
  };

  return (
    <div className="uniform-fee-page">
      <AddUniformFee onSave={handleSave} editData={editData} />

      <UniformFeeList
        data={feeData}
        onEdit={setEditData}
        onDelete={(id) => setFeeData(feeData.filter((x) => x.id !== id))}
      />
    </div>
  );
};

export default UniformFee;
