/**
 * Renders a titled canvas used to show either the original or processed image.
 */
function ImagePreview({ canvasRef, title }) {
  return (
    <div className="canvas-panel">
      <h2 className="panel-heading">{title}</h2>
      <canvas className="image-canvas" ref={canvasRef} width="320" height="240" />
    </div>
  );
}

export default ImagePreview;
