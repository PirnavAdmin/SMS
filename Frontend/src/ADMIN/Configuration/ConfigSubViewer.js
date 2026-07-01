
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

import "./ConfigSubViewer.css";

function ConfigSubViewer({ category }) {
  switch (category) {
    case 'Academic Year':
      return <AcademicYear />;
    case 'Bank Account Details':
      return <BankAccount />;
    case 'Books Fee':
      return <BookeFee />;
    case "Syllabus types":
      return <SyllabusTypes />;
    case "Section":
      return <Section />;
    case "Users":
      return <Users />;
    case "Fee Master":
      return <FeeMaster />;
    case "Medium":
      return <Medium />;
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
    case "Uniform settings":
      return <UniformSetting />;
    case "Uniform Fee":
      return <UniformFee />;


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
