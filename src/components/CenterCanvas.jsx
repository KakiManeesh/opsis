import { useEffect, useRef, useState } from 'react';

/**
 * CenterCanvas
 *
 * originalCanvasRef / processedCanvasRef are owned by App.jsx and are
 * always mounted there (off-screen). This component never mounts or
 * unmounts those canvases — it only reads from them to paint two
 * separate *display* canvases for the view modes.
 *
 * View modes:
 *   'final'    — mirror the processed output  (default)
 *   'original' — mirror the unmodified source
 *   'split'    — side-by-side original | processed
 */
function CenterCanvas({
  originalCanvasRef,
  processedCanvasRef,
  hasImage,
  onFileSelect,
  // Signals from App that new pixels are ready so we can repaint.
  renderTick
}) {
  const [viewMode, setViewMode] = useState('final');

  // Display canvases — written to by this component, never by App.
  const displayLeftRef = useRef(null);   // original side
  const displayRightRef = useRef(null);  // processed side (also used for final view)

  // Copy pixels from source → display canvas
  function copyCanvas(src, dst) {
    if (!src || !dst) return;
    dst.width = src.width;
    dst.height = src.height;
    const ctx = dst.getContext('2d');
    ctx.clearRect(0, 0, dst.width, dst.height);
    ctx.drawImage(src, 0, 0);
  }

  useEffect(() => {
    if (!hasImage) return;
    const orig = originalCanvasRef.current;
    const proc = processedCanvasRef.current;

    if (viewMode === 'original') {
      copyCanvas(orig, displayLeftRef.current);
    } else if (viewMode === 'final') {
      copyCanvas(proc, displayRightRef.current);
    } else {
      // split
      copyCanvas(orig, displayLeftRef.current);
      copyCanvas(proc, displayRightRef.current);
    }
  // renderTick changes whenever App finishes a pipeline render pass
  }, [hasImage, viewMode, renderTick, originalCanvasRef, processedCanvasRef]);

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFileSelect(file);
  };

  return (
    <main className="center-canvas" onDragOver={handleDragOver} onDrop={handleDrop}>

      {/* ── Empty-state prompt (shown until first image is loaded) ── */}
      {!hasImage && (
        <div className="canvas-empty">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-md)', color: 'var(--text-tertiary)' }}>Upload an image to start</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
              JPG, PNG, WebP up to 10MB
            </div>
          </div>
          <label
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0 var(--space-4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            Choose Image
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files[0]) onFileSelect(e.target.files[0]); }}
            />
          </label>
        </div>
      )}

      {/* ── Canvas view area (always mounted, hidden until image loaded) ── */}
      <div className="canvas-container" style={{ display: hasImage ? undefined : 'none' }}>

        {viewMode === 'split' ? (
          /* Split: left = original, right = processed */
          <div style={{ display: 'flex', width: '100%', height: '100%', gap: 2, overflow: 'hidden' }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <canvas ref={displayLeftRef} className="canvas-image" />
              <span style={labelStyle}>Original</span>
            </div>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <canvas ref={displayRightRef} className="canvas-image" />
              <span style={labelStyle}>Processed</span>
            </div>
          </div>
        ) : viewMode === 'original' ? (
          /* Original only */
          <canvas ref={displayLeftRef} className="canvas-image" />
        ) : (
          /* Final (processed) only — default */
          <canvas ref={displayRightRef} className="canvas-image" />
        )}

        {/* ── View toggle ── */}
        <div className="floating-bar floating-bar-top">
          {['original', 'final', 'split'].map((mode) => (
            <button
              key={mode}
              className="btn btn-ghost"
              onClick={() => setViewMode(mode)}
              style={viewMode === mode ? activeTabStyle : {}}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Bottom-left status ── */}
        <div className="floating-bar floating-bar-bottom-left">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {viewMode === 'original' ? 'Viewing Original'
              : viewMode === 'split' ? 'Split View'
              : 'Previewing Output'}
          </span>
        </div>

        {/* ── Bottom-right zoom (cosmetic) ── */}
        <div className="floating-bar floating-bar-bottom-right">
          <button className="btn-icon">-</button>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', padding: '0 var(--space-2)' }}>100%</span>
          <button className="btn-icon">+</button>
        </div>
      </div>
    </main>
  );
}

const activeTabStyle = {
  background: 'var(--bg-panel-active)',
  color: 'var(--text-primary)',
  borderBottom: '2px solid var(--accent-primary)'
};

const labelStyle = {
  position: 'absolute',
  bottom: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
  background: 'var(--bg-canvas-overlay)',
  padding: '2px 8px',
  borderRadius: 4,
  pointerEvents: 'none'
};

export default CenterCanvas;
