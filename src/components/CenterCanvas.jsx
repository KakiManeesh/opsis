import { useCallback, useEffect, useRef, useState } from 'react';

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
 *   'split'    — draggable before/after divider (original left, processed right)
 */
function CenterCanvas({
  originalCanvasRef,
  processedCanvasRef,
  hasImage,
  onFileSelect,
  renderTick
}) {
  const [viewMode, setViewMode] = useState('final');

  // Split-slider position as a fraction [0, 1] of the container width.
  const [sliderFraction, setSliderFraction] = useState(0.5);
  const isDragging = useRef(false);
  const containerRef = useRef(null);

  // Display canvases — written to by this component, never by App.
  const displayLeftRef  = useRef(null);  // original
  const displayRightRef = useRef(null);  // processed / final

  // ── Canvas copy helper ─────────────────────────────────────────────────
  function copyCanvas(src, dst) {
    if (!src || !dst) return;
    dst.width  = src.width;
    dst.height = src.height;
    const ctx = dst.getContext('2d');
    ctx.clearRect(0, 0, dst.width, dst.height);
    ctx.drawImage(src, 0, 0);
  }

  // ── Repaint display canvases when source pixels change ─────────────────
  useEffect(() => {
    if (!hasImage) return;
    const orig = originalCanvasRef.current;
    const proc = processedCanvasRef.current;

    if (viewMode === 'original') {
      copyCanvas(orig, displayLeftRef.current);
    } else if (viewMode === 'final') {
      copyCanvas(proc, displayRightRef.current);
    } else {
      // split — both sides always need to be populated
      copyCanvas(orig, displayLeftRef.current);
      copyCanvas(proc, displayRightRef.current);
    }
  }, [hasImage, viewMode, renderTick, originalCanvasRef, processedCanvasRef]);

  // ── Slider drag logic ──────────────────────────────────────────────────
  const getFractionFromEvent = useCallback((e) => {
    const container = containerRef.current;
    if (!container) return 0.5;
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    // Capture so we get events even outside the element
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setSliderFraction(getFractionFromEvent(e));
  }, [getFractionFromEvent]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    setSliderFraction(getFractionFromEvent(e));
  }, [getFractionFromEvent]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Drag / drop for file upload ────────────────────────────────────────
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFileSelect(file);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <main className="center-canvas" onDragOver={handleDragOver} onDrop={handleDrop}>

      {/* ── Empty-state prompt ── */}
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
          <label className="btn btn-primary"
            style={{ width: 'auto', padding: '0 var(--space-4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            Choose Image
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files[0]) onFileSelect(e.target.files[0]); }} />
          </label>
        </div>
      )}

      {/* ── Canvas view area ── */}
      <div className="canvas-container" style={{ display: hasImage ? undefined : 'none' }}>

        {viewMode === 'split' ? (
          /* ── Before/After slider ── */
          <div
            ref={containerRef}
            className="before-after-container"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Processed layer — full width underneath */}
            <canvas ref={displayRightRef} className="before-after-canvas" />

            {/* Original layer — clipped to the left of the divider */}
            <div
              className="before-after-clip"
              style={{ width: `${sliderFraction * 100}%` }}
            >
              <canvas ref={displayLeftRef} className="before-after-canvas" />
            </div>

            {/* Divider line + handle */}
            <div
              className="before-after-divider"
              style={{ left: `${sliderFraction * 100}%` }}
              onPointerDown={handlePointerDown}
            >
              <div className="before-after-handle">
                {/* Left arrow */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M6 1L2 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                {/* Right arrow */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M4 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            </div>

            {/* Labels */}
            <span className="before-after-label before-after-label-left">Original</span>
            <span className="before-after-label before-after-label-right">Processed</span>
          </div>

        ) : viewMode === 'original' ? (
          <canvas ref={displayLeftRef}  className="canvas-image" />
        ) : (
          <canvas ref={displayRightRef} className="canvas-image" />
        )}

        {/* ── View toggle ── */}
        <div className="floating-bar floating-bar-top">
          {[
            { mode: 'original', label: 'Original' },
            { mode: 'final',    label: 'Final' },
            { mode: 'split',    label: '⇔ Compare' }
          ].map(({ mode, label }) => (
            <button
              key={mode}
              className="btn btn-ghost"
              onClick={() => setViewMode(mode)}
              style={viewMode === mode ? activeTabStyle : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Bottom-left status ── */}
        <div className="floating-bar floating-bar-bottom-left">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {viewMode === 'original' ? 'Viewing Original'
              : viewMode === 'split'  ? 'Drag to compare'
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

export default CenterCanvas;
