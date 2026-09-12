import { useEffect, useRef, useState } from 'react';
import { applyPipelineToCanvas } from '../processor.js';

/**
 * Renders the workspace grid with Original, pinned inspection nodes, and Final Output cards.
 */
function ImagePreview({
  originalCanvasRef,
  processedCanvasRef,
  pipeline,
  activeInspectNodes,
  canRenderPinnedNodes,
  onRemoveInspectNode
}) {
  const [hoverProbe, setHoverProbe] = useState(null);
  const inspectRefs = useRef({});

  const handleCanvasPointerMove = (event) => {
    const canvas = event.currentTarget;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = Math.floor((event.clientX - rect.left) * scaleX);
    const canvasY = Math.floor((event.clientY - rect.top) * scaleY);

    if (
      canvasX < 0 ||
      canvasY < 0 ||
      canvasX >= canvas.width ||
      canvasY >= canvas.height
    ) {
      setHoverProbe(null);
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      setHoverProbe(null);
      return;
    }

    const [r, g, b, a] = context.getImageData(canvasX, canvasY, 1, 1).data;
    setHoverProbe({
      x: canvasX,
      y: canvasY,
      rgba: [r, g, b, a],
      clientX: event.clientX,
      clientY: event.clientY
    });
  };

  const handleCanvasPointerLeave = () => {
    setHoverProbe(null);
  };

  // Render pinned inspect node canvases
  useEffect(() => {
    if (!canRenderPinnedNodes || !originalCanvasRef.current) {
      return;
    }

    activeInspectNodes.forEach((stepIndex) => {
      const targetCanvas = inspectRefs.current[stepIndex];
      if (!targetCanvas) {
        return;
      }

      applyPipelineToCanvas(
        originalCanvasRef.current,
        targetCanvas,
        pipeline.slice(0, stepIndex + 1)
      );
    });
  }, [canRenderPinnedNodes, originalCanvasRef, pipeline, activeInspectNodes]);

  return (
    <div className="workspace-stage">
      {/* Fixed Original Image card */}
      <div className="canvas-card">
        <div className="canvas-header">Original Image</div>
        <div className="canvas-wrapper">
          <canvas
            ref={originalCanvasRef}
            width="320"
            height="240"
            onPointerMove={handleCanvasPointerMove}
            onPointerLeave={handleCanvasPointerLeave}
          />
        </div>
      </div>

      {/* Dynamic inspection node cards */}
      {activeInspectNodes.map((stepIndex) => (
        <div className="canvas-card" key={`inspect-${stepIndex}`}>
          <div className="canvas-header">
            <span>After Step {stepIndex + 1}</span>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={() => onRemoveInspectNode(stepIndex)}
              aria-label={`Remove pinned step ${stepIndex + 1}`}
            >
              ×
            </button>
          </div>
          <div className="canvas-wrapper">
            <canvas
              ref={(el) => (inspectRefs.current[stepIndex] = el)}
              width="320"
              height="240"
              onPointerMove={handleCanvasPointerMove}
              onPointerLeave={handleCanvasPointerLeave}
            />
          </div>
        </div>
      ))}

      {/* Fixed Final Output card */}
      <div className="canvas-card">
        <div className="canvas-header">Final Output</div>
        <div className="canvas-wrapper">
          <canvas
            ref={processedCanvasRef}
            width="320"
            height="240"
            onPointerMove={handleCanvasPointerMove}
            onPointerLeave={handleCanvasPointerLeave}
          />
        </div>
      </div>

      {/* Pixel probe tooltip */}
      {hoverProbe ? (
        <div
          className="pixel-probe-tooltip"
          style={{ left: hoverProbe.clientX + 12, top: hoverProbe.clientY + 12 }}
        >
          X: {hoverProbe.x} Y: {hoverProbe.y}
          <br />
          RGBA: {hoverProbe.rgba.join(', ')}
        </div>
      ) : null}
    </div>
  );
}

export default ImagePreview;
