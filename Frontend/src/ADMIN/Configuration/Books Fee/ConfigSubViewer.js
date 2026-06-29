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
}

export default ConfigSubViewer;
