import React from 'react';

function ConfigSubViewer({ category }) {
  return (
    <div style={{ padding: '20px' }}>
      <h3>Configuration: {category}</h3>
      <p>Configure settings and details for {category}.</p>
    </div>
  );
}

export default ConfigSubViewer;
