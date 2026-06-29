import React from "react";
import AcademicYear from "./Academic Year/AcademicYear";
import BankAccount from "./Bank Account Details";
import Section from "./Section";
import SyllabusTypes from "./Syllabus types";
import Users from './Users/Users';
import FeeMaster from './Fee Master/FeeMaster';
import "./ConfigSubViewer.css";

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
    case 'Users':
      return <Users />;
    case 'Fee Master':
      return <FeeMaster />;
    default:
      return (
        <div className="config-placeholder">
          <h3>Configuration: {category}</h3>
          <p>Configure settings and details for {category}.</p>
        </div>
      );
  }
}

export default ConfigSubViewer;
