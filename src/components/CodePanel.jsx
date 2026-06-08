/**
 * Renders the generated Python code for the current image-processing pipeline.
 */
function CodePanel({ code }) {
  return (
    <section className="code-panel">
      <h2 className="panel-heading">Generated Python Code</h2>
      <pre className="code-output">
        <code>{code || 'Add operations to show the Python OpenCV code.'}</code>
      </pre>
    </section>
  );
}

export default CodePanel;
