import { useState } from 'react';
import { generatePythonCode } from '../codegen.js';

function FooterCode({ pipeline }) {
  const [expanded, setExpanded] = useState(false);
  const code = generatePythonCode(pipeline);

  return (
    <footer className="app-footer">
      <button 
        className="app-footer-toggle" 
        onClick={() => setExpanded(!expanded)}
      >
        <span>&lt;/&gt;</span> Python Code {expanded ? '▼' : '▲'}
      </button>
      {expanded && (
        <div className="app-footer-content">
          <pre className="code-block" style={{ height: '100%' }}>
            <code>{code || 'Add operations to show the Python OpenCV code.'}</code>
          </pre>
        </div>
      )}
    </footer>
  );
}

export default FooterCode;
