import React from "react";
import AcademicYear from "./Academic Year/AcademicYear";
import BankAccount from "./Bank Account Details";
import BookeFee from "./Books Fee/BookeFee";
import Section from "./Section";
import SyllabusTypes from "./Syllabus types";
import Users from './Users/Users';
import FeeMaster from './Fee Master/FeeMaster';
<<<<<<< HEAD
import Medium from './Medium/Medium';
import UniformFee from './Uniform Fee/UniformFee';
import UniformSetting from './Uniform settings/UniformSetting';
=======
<<<<<<< HEAD
import UniformSetting from "./Uniform settings/UniformSetting";
import UniformFee from "./Uniform Fee/UniformFee";
=======
>>>>>>> 533e33d867e6f976bd129cbff0b1be4bdf45030e
import "./ConfigSubViewer.css";
>>>>>>> 0dcab9e0d081e5de380c972e5251bdb8124d7e38

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
    case 'Users':
      return <Users />;
    case 'Fee Master':
      return <FeeMaster />;
<<<<<<< HEAD
    case 'Medium':
      return <Medium />;
    case 'Uniform Fee':
      return <UniformFee />;
    case 'Uniform settings':
      return <UniformSetting />;
=======
<<<<<<< HEAD
    case "Uniform settings":
      return <UniformSetting />;
    case "Uniform Fee":
      return <UniformFee />;
    default:
      return (
        <div style={{ padding: "20px" }}>
          <h3>{category}</h3>
          <p>No module created yet.</p>
=======
>>>>>>> 533e33d867e6f976bd129cbff0b1be4bdf45030e
    default:
      return (
        <div className="config-placeholder">
          <h3>Configuration: {category}</h3>
          <p>Configure settings and details for {category}.</p>
>>>>>>> 0dcab9e0d081e5de380c972e5251bdb8124d7e38
        </div>
      );
  }
}

<<<<<<< HEAD
export default ConfigSubViewer;
=======
export default ConfigSubViewer;
>>>>>>> 0dcab9e0d081e5de380c972e5251bdb8124d7e38
