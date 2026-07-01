import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

function RuntimeError({ error }) {
  const message = error?.message || String(error || 'Unknown runtime error');

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '32px',
        background: '#f8fafc',
        color: '#172033',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '24px',
          border: '1px solid #d7dee8',
          borderRadius: '8px',
          background: '#ffffff',
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
        }}
      >
        <p style={{ margin: '0 0 8px', color: '#b42318', fontWeight: 700 }}>
          React failed to start
        </p>
        <h1 style={{ margin: '0 0 16px', fontSize: '24px' }}>
          The app hit a browser runtime error.
        </h1>
        <pre
          style={{
            margin: 0,
            padding: '16px',
            overflow: 'auto',
            borderRadius: '6px',
            background: '#111827',
            color: '#f8fafc',
            whiteSpace: 'pre-wrap',
          }}
        >
          {message}
        </pre>
      </section>
    </main>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <RuntimeError error={this.state.error} />;
    }

    return this.props.children;
  }
}

const renderApp = (App) => {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

import('./App')
  .then(({ default: App }) => renderApp(App))
  .catch((error) => {
    root.render(<RuntimeError error={error} />);
  });

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
