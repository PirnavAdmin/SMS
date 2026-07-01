import React from "react";
import AcademicYear from "../Academic Year/AcademicYear";
import BankAccount from "../Bank Account Details";
import FeeMaster from "../Fee Master/FeeMaster";
import Medium from "../Medium/Medium";
import Section from "../Section";
import SyllabusTypes from "../Syllabus types";
import UniformFee from "../Uniform Fee/UniformFee";
import UniformSetting from "../Uniform settings/UniformSetting";
import Users from "../Users/Users";
import BookeFee from "./BookeFee";

function ConfigSubViewer({ category }) {
  switch (category) {
    case "Academic Year":
      return <AcademicYear />;
    case "Bank Account Details":
      return <BankAccount />;
    case "Books Fee":
      return <BookeFee />;
    case "Fee Master":
      return <FeeMaster />;
    case "Medium":
      return <Medium />;
    case "Section":
      return <Section />;
    case "Syllabus types":
      return <SyllabusTypes />;
    case "Uniform Fee":
      return <UniformFee />;
    case "Uniform settings":
      return <UniformSetting />;
    case "Users":
      return <Users />;
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
