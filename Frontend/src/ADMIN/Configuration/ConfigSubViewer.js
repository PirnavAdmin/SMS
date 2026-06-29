import React from "react";
import AcademicYear from "./Academic Year/AcademicYear";
import BankAccount from "./Bank Account Details";
import Section from "./Section";
import SyllabusTypes from "./Syllabus types";

function ConfigSubViewer({ category }) {
  switch (category) {
    case "Academic Year":
      return <AcademicYear />;
    case "Bank Account Details":
      return <BankAccount />;
    case "Syllabus types":
      return <SyllabusTypes />;
    case "Section":
      return <Section />;
    default:
      return (
        <div style={{ padding: "20px" }}>
          <h3>Configuration: {category}</h3>
          <p>Configure settings and details for {category}.</p>
        </div>
      );
  }
}

export default ConfigSubViewer;
