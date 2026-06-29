import React from "react";
import BankAccount from "./Bank Account Details";
import Section from "./Section";
import SyllabusTypes from "./Syllabus types";

function ConfigSubViewer({ category }) {
  switch (category) {
    case "Bank Account Details":
      return <BankAccount />;

    case "Syllabus types":
      return <SyllabusTypes />;

    case "Section":
      return <Section />;

    default:
      return (
        <div>
          <h2>{category}</h2>
          <p>Module Coming Soon...</p>
        </div>
      );
  }
}

export default ConfigSubViewer;
