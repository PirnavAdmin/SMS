<<<<<<< HEAD
import React from "react";
import AcademicYear from "./Academic Year/AcademicYear";
import BankAccount from "./Bank Account Details";
import BookeFee from "./Books Fee/BookeFee";
import Section from "./Section";
import SyllabusTypes from "./Syllabus types";
import Users from "./Users/Users";
import FeeMaster from "./Fee Master/FeeMaster";
import UniformSetting from "./Uniform settings/UniformSetting";
import UniformFee from "./Uniform Fee/UniformFee";
import "./ConfigSubViewer.css";
=======
import React from 'react';
import AcademicYear from './Academic Year/AcademicYear';
import BankAccount from './Bank Account Details';
import BookeFee from './Books Fee/BookeFee';
import Class from './Class/Class';
import FeeMaster from './Fee Master/FeeMaster';
import Medium from './Medium/Medium';
import Section from './Section';
import SyllabusTypes from './Syllabus types';
import UniformFee from './Uniform Fee/UniformFee';
import UniformSetting from './Uniform settings/UniformSetting';
import HolidayManagement from './Holiday/HolidayManagement';
import Orientation from './Orientation/Orientation';
import Users from './Users/Users';
import './ConfigSubViewer.css';
>>>>>>> 2cb885d2efb89518fb994b27bee4de8d30b78538

function ConfigSubViewer({ category }) {
  switch (category) {
    case 'Academic Year':
      return <AcademicYear />;
    case 'Bank Account Details':
      return <BankAccount />;
    case 'Books Fee':
      return <BookeFee />;
<<<<<<< HEAD
    case "Syllabus types":
      return <SyllabusTypes />;
    case "Section":
      return <Section />;
    case "Users":
      return <Users />;
    case "Fee Master":
      return <FeeMaster />;
    case "Uniform settings":
      return <UniformSetting />;
    case "Uniform Fee":
      return <UniformFee />;
=======
    case 'Fee Master':
      return <FeeMaster />;
    case 'Medium':
      return <Medium />;
    case 'Class':
      return <Class />;
    case 'Section':
      return <Section />;
    case 'Syllabus types':
      return <SyllabusTypes />;
    case 'Uniform Fee':
      return <UniformFee />;
    case 'Uniform settings':
      return <UniformSetting />;
    case 'Holiday':
      return <HolidayManagement />;
    case 'Orientation':
      return <Orientation />;
    case 'Users':
      return <Users />;
>>>>>>> 2cb885d2efb89518fb994b27bee4de8d30b78538
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
