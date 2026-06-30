import React from "react";
import AcademicYear from "./Academic Year/AcademicYear";
import BankAccount from "./Bank Account Details";
import BookeFee from "./Books Fee/BookeFee";
import Section from "./Section";
import SyllabusTypes from "./Syllabus types";
<<<<<<< HEAD
import Users from "./Users/Users";
import FeeMaster from "./Fee Master/FeeMaster";
import UniformSetting from "./Uniform settings/UniformSetting";
import UniformFee from "./Uniform Fee/UniformFee";
import Medium from "./Medium/Medium";
=======
import Users from './Users/Users';
import FeeMaster from './Fee Master/FeeMaster';
import Medium from './Medium/Medium';
import UniformFee from './Uniform Fee/UniformFee';
import UniformSetting from './Uniform settings/UniformSetting';
>>>>>>> 75b375507e78de8a260fcc8a240557e3976b85b1
import "./ConfigSubViewer.css";

function ConfigSubViewer({ category }) {
  switch (category) {
    case "Academic Year":
      return <AcademicYear />;
    case "Bank Account Details":
      return <BankAccount />;
    case "Books Fee":
      return <BookeFee />;
    case "Syllabus types":
      return <SyllabusTypes />;
    case "Section":
      return <Section />;
    case "Users":
      return <Users />;
    case "Fee Master":
      return <FeeMaster />;
<<<<<<< HEAD
    case "Medium":
      return <Medium />;
=======
    case 'Medium':
      return <Medium />;
    case 'Uniform Fee':
      return <UniformFee />;
    case 'Uniform settings':
      return <UniformSetting />;
>>>>>>> 75b375507e78de8a260fcc8a240557e3976b85b1
    case "Uniform settings":
      return <UniformSetting />;
    case "Uniform Fee":
      return <UniformFee />;
<<<<<<< HEAD
=======

>>>>>>> 75b375507e78de8a260fcc8a240557e3976b85b1
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
