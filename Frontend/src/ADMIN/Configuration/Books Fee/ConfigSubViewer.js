<<<<<<< HEAD:Frontend/src/ADMIN/Configuration/Books Fee/ConfigSubViewer.js
import React from 'react';
import BookeFee from './BookeFee';
import Medium from '../Medium/Medium';

function ConfigSubViewer({ category }) {
  if (category === 'Books Fee') {
    return <BookeFee />;
  }

  if (category === 'Medium') {
    return <Medium />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3>Configuration: {category}</h3>
      <p>Configure settings and details for {category}.</p>
    </div>
  );
=======
<<<<<<< HEAD
/* import React from 'react';
=======
import React from "react";
import AcademicYear from "./Academic Year/AcademicYear";
import BankAccount from "./Bank Account Details";
import Section from "./Section";
import SyllabusTypes from "./Syllabus types";
import Users from './Users/Users';
import FeeMaster from './Fee Master/FeeMaster'
>>>>>>> 23dadab8849419e060ffbefdc53872d340eaf440

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
        <div style={{ padding: "20px" }}>
          <h3>Configuration: {category}</h3>
          <p>Configure settings and details for {category}.</p>
        </div>
      );
  }
}

<<<<<<< HEAD
export default ConfigSubViewer;
 */

/* import React from "react";

import UniformFee from "./Uniform Fee/UniformFee";

function ConfigSubViewer({ category }) {
  switch (category) {
    case "Uniform Fee":
      return <UniformFee />;

    default:
      return (
        <div style={{ padding: "20px" }}>
          <h3>Configuration: {category}</h3>
          <p>Configure settings and details for {category}.</p>
        </div>
      );
  }
}

export default ConfigSubViewer; */

import React from "react";
import UniformSetting from "./Uniform settings/UniformSetting";
import UniformFee from "./Uniform Fee/UniformFee";

function ConfigSubViewer({ category }) {
  switch (category) {
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
>>>>>>> a96ae42a08361434b5989b5444782fd539a5aa7a:Frontend/src/ADMIN/Configuration/ConfigSubViewer.js
}

export default ConfigSubViewer;
=======
export default ConfigSubViewer;
>>>>>>> 23dadab8849419e060ffbefdc53872d340eaf440
