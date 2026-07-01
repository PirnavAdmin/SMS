<<<<<<< HEAD
=======
import React from "react";
import AcademicYear from "./Academic Year/AcademicYear";
import BankAccount from "./Bank Account Details";
import BookeFee from "./Books Fee/BookeFee";
import Class from "./Class/Class";
import FeeMaster from "./Fee Master/FeeMaster";
import Medium from "./Medium/Medium";
import Section from "./Section";
import SyllabusTypes from "./Syllabus types";
import UniformFee from "./Uniform Fee/UniformFee";
<<<<<<< HEAD
import Medium from "./Medium/Medium";
import Class from "./Class/Class";
import "./ConfigSubViewer.css";
=======
import UniformSetting from "./Uniform settings/UniformSetting";
import HolidayManagement from "./Holiday/HolidayManagement";
import Orientation from "./Orientation/Orientation";
import Users from "./Users/Users";
import "./ConfigSubViewer.css";
=======
>>>>>>> 71a50bed41cae512be4cfa58636b4c1ac59f036f
import React from 'react';
import AcademicYear from './Academic Year/AcademicYear';
import BankAccount from './Bank Account Details';
import BookeFee from './Books Fee/BookeFee';
import Class from './Class/Class';
import FeeMaster from './Fee Master/FeeMaster';
import HolidayManagement from './Holiday/HolidayManagement';
import Medium from './Medium/Medium';
import Orientation from './Orientation/Orientation';
import Roles from './Roles/Roles';
import Section from './Section';
import SyllabusTypes from './Syllabus types';
import UniformFee from './Uniform Fee/UniformFee';
import UniformSetting from './Uniform settings/UniformSetting';
import Users from './Users/Users';
import './ConfigSubViewer.css';
<<<<<<< HEAD

const configurationComponents = {
  'Academic Year': AcademicYear,
  'Bank Account Details': BankAccount,
  'Books Fee': BookeFee,
  Class,
  'Fee Master': FeeMaster,
  Holiday: HolidayManagement,
  Medium,
  Orientation,
  Roles,
  Section,
  'Syllabus types': SyllabusTypes,
  'Uniform Fee': UniformFee,
  'Uniform settings': UniformSetting,
  Users,
};

function ConfigSubViewer({ category }) {
  const Component = configurationComponents[category];

  if (Component) {
    return <Component />;
=======
>>>>>>> 69b1a0c018e149e1a0b8b3dbfe2f1768b8d12bd0
>>>>>>> 76110ffdd0f08559b92a1416f9e25b0cd0633058

function ConfigSubViewer({ category }) {
  switch (category) {
    case "Academic Year":
      return <AcademicYear />;
    case "Bank Account Details":
      return <BankAccount />;
    case "Books Fee":
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
    case "Medium":
=======
<<<<<<< HEAD
    case "Fee Master":
      return <FeeMaster />;
    case "Medium":
      return <Medium />;
    case "Class":
      return <Class />;
    case "Section":
      return <Section />;
    case "Syllabus types":
      return <SyllabusTypes />;
    case "Uniform Fee":
      return <UniformFee />;
    case "Uniform settings":
=======
    case 'Fee Master':
      return <FeeMaster />;
    case 'Medium':
>>>>>>> 76110ffdd0f08559b92a1416f9e25b0cd0633058
      return <Medium />;
    case 'Class':
      return <Class />;
    case 'Uniform Fee':
      return <UniformFee />;
    case 'Uniform settings':
>>>>>>> 69b1a0c018e149e1a0b8b3dbfe2f1768b8d12bd0
      return <UniformSetting />;
<<<<<<< HEAD


=======
    case "Holiday":
      return <HolidayManagement />;
    case "Orientation":
      return <Orientation />;
    case "Users":
      return <Users />;
>>>>>>> 76110ffdd0f08559b92a1416f9e25b0cd0633058
    default:
      return (
        <div className="config-placeholder">
          <h3>Configuration: {category}</h3>
          <p>Configure settings and details for {category}.</p>
        </div>
      );
>>>>>>> 71a50bed41cae512be4cfa58636b4c1ac59f036f
  }

  return (
    <div className="config-placeholder">
      <h3>Configuration: {category}</h3>
      <p>Configure settings and details for {category}.</p>
    </div>
  );
}

export default ConfigSubViewer;
