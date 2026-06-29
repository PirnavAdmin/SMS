/* import React from 'react';

function ConfigSubViewer({ category }) {
  return (
    <div style={{ padding: '20px' }}>
      <h3>Configuration: {category}</h3>
      <p>Configure settings and details for {category}.</p>
    </div>
  );
}

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
}

export default ConfigSubViewer;
