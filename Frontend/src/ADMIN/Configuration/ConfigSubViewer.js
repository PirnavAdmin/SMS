import React from 'react';
import AcademicYear from './Academic Year/AcademicYear';
import BankAccount from './Bank Account Details';
import BookeFee from './Books Fee/BookeFee';
import ClassComp from './Class/Class';
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

const configurationComponents = {
  'Academic Year': AcademicYear,
  'Bank Account Details': BankAccount,
  'Books Fee': BookeFee,
  Class: ClassComp,
  'Fee Master': FeeMaster,
  Holiday: HolidayManagement,
  Medium: Medium,
  Orientation: Orientation,
  Roles: Roles,
  Section: Section,
  'Syllabus types': SyllabusTypes,
  'Uniform Fee': UniformFee,
  'Uniform settings': UniformSetting,
  Users: Users,
};

function ConfigSubViewer({ category }) {
  const Component = configurationComponents[category];

  if (Component) return <Component />;

  return (
    <div className="config-placeholder">
      <h3>Configuration: {category}</h3>
      <p>Configure settings and details for {category}.</p>
    </div>
  );
}

export default ConfigSubViewer;
