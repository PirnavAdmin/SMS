import React from "react";
import AcademicYear from "./Academic Year/AcademicYear";
import BankAccount from "./Bank Account Details";
import Section from "./Section";
import SyllabusTypes from "./Syllabus types";
import Users from './Users/Users';
import FeeMaster from './Fee Master/FeeMaster';
import UniformSetting from "./Uniform settings/UniformSetting";
import UniformFee from "./Uniform Fee/UniformFee";

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
    case "Uniform settings":
      return <UniformSetting />;
    case "Uniform Fee":
      return <UniformFee />;
    default:
      return (
        <div style={{ padding: "20px" }}>
          <h3>{category}</h3>
          <p>No module created yet.</p>
        </div>
      );
  }
}

export default ConfigSubViewer;