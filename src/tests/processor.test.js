/**
 * processor.test.js
 *
 * processor.js is entirely browser-dependent: it calls window.cv, document,
 * canvas.getContext, URL.createObjectURL, etc. None of those exist in Node.
 *
 * Strategy: inject a realistic fake of the OpenCV API into globalThis.cv
 * before each test, then import the processor functions under test. The fake
 * tracks every Mat that was created and whether it was deleted, letting us
 * assert that every code path cleans up correctly.
 *
 * We do NOT test loadOpenCv (it needs a real browser script loader) or
 * drawImageFileToCanvas (it needs a real Image element and object URL).
 * Those are integration concerns; trying to fake them would produce tests
 * that only prove the mock works.
 *
 * We DO test:
 *   - applyPipelineToCanvas: successful execution, correct op dispatch,
 *     Mat cleanup on the happy path, Mat cleanup when a step throws.
 *   - applyGrayscaleToCanvas: delegates to applyPipelineToCanvas correctly.
 *   - prepareCanvasPair / clearCanvas: pure DOM-canvas helpers.
 *   - convertToGrayscale paths: already-gray mat (1 channel) vs RGBA mat.
 *   - bilateralFilter RGBA→RGB workaround path.
 *   - applyPipelineToCanvas with an empty pipeline: copies source to target.
 *   - Unknown operation type throws with a descriptive message.
 *   - matToDisplayMat: 1-channel output is converted to RGBA for imshow.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyPipelineToCanvas,
  applyGrayscaleToCanvas,
  prepareCanvasPair,
  clearCanvas
} from '../processor.js';

// ---------------------------------------------------------------------------
// Minimal canvas stub (no real drawing needed)
// ---------------------------------------------------------------------------
function makeCanvas(width = 4, height = 4) {
  const canvas = {
    width,
    height,
    _cleared: false,
    getContext() {
      return {
        clearRect: () => { canvas._cleared = true; },
        drawImage: () => {}
      };
    }
  };
  return canvas;
}

// ---------------------------------------------------------------------------
// Realistic cv.Mat stub
// ---------------------------------------------------------------------------
let matRegistry = [];

function makeMat(channels = 4) {
  const mat = {
    _channels: channels,
    _deleted: false,
    channels() { return this._channels; },
    copyTo(dst) { dst._channels = this._channels; },
    delete() {
      if (this._deleted) throw new Error('Mat.delete() called twice on the same Mat');
      this._deleted = true;
    }
  };
  matRegistry.push(mat);
  return mat;
}

// ---------------------------------------------------------------------------
// cv mock factory
// ---------------------------------------------------------------------------
function makeCvMock({ bilateralShouldThrow = false, stepShouldThrow = false } = {}) {
  // Tracks every cv API call so tests can assert on what was actually called.
  const calls = [];
  const record = (name, ...args) => calls.push({ name, args });

  const cv = {
    // Constants
    COLOR_RGBA2GRAY: 'COLOR_RGBA2GRAY',
    COLOR_GRAY2RGBA: 'COLOR_GRAY2RGBA',
    COLOR_RGBA2RGB:  'COLOR_RGBA2RGB',
    COLOR_RGB2RGBA:  'COLOR_RGB2RGBA',
    THRESH_BINARY:     0,
    THRESH_BINARY_INV: 1,
    MORPH_RECT:  'MORPH_RECT',
    MORPH_OPEN:  'MORPH_OPEN',
    MORPH_CLOSE: 'MORPH_CLOSE',
    BORDER_DEFAULT: 'BORDER_DEFAULT',
    CV_32F: 5,

    // --- Mat construction ---
    Mat() { return makeMat(4); },
    matFromArray(_rows, _cols, _type, _data) { return makeMat(4); },
    Size: function Size(w, h) { this.width = w; this.height = h; },
    Point: function Point(x, y) { this.x = x; this.y = y; },

    // --- imread: returns a 4-channel Mat representing the source canvas ---
    imread(_canvas) {
      record('imread');
      return makeMat(4);
    },

    // --- imshow: records the call but does nothing to the canvas ---
    imshow(_canvas, _mat) {
      record('imshow');
    },

    // --- colour conversion ---
    cvtColor(src, dst, code) {
      record('cvtColor', code);
      // Gray output for RGBA→GRAY; RGBA output otherwise
      if (code === cv.COLOR_RGBA2GRAY) {
        dst._channels = 1;
      } else if (code === cv.COLOR_GRAY2RGBA) {
        dst._channels = 4;
      } else if (code === cv.COLOR_RGBA2RGB) {
        dst._channels = 3;
      } else if (code === cv.COLOR_RGB2RGBA) {
        dst._channels = 4;
      }
    },

    // --- spatial filters ---
    GaussianBlur(src, dst, _size, _sigmaX, _sigmaY, _border) {
      record('GaussianBlur');
      dst._channels = src._channels;
    },
    medianBlur(src, dst, _k) {
      record('medianBlur');
      dst._channels = src._channels;
    },
    bilateralFilter(src, dst, _d, _sc, _ss) {
      record('bilateralFilter');
      if (bilateralShouldThrow) throw new Error('bilateralFilter failed');
      dst._channels = src._channels;
    },

    // --- thresholding ---
    threshold(src, dst, _thresh, _max, _type) {
      record('threshold');
      dst._channels = 1;
    },
    Canny(src, dst, _low, _high) {
      record('Canny');
      dst._channels = 1;
    },

    // --- morphology ---
    getStructuringElement(_shape, _size) {
      return makeMat(1);
    },
    erode(src, dst, _kernel, _point, _iter) {
      record('erode');
      if (stepShouldThrow) throw new Error('erode failed');
      dst._channels = src._channels;
    },
    dilate(src, dst, _kernel, _point, _iter) {
      record('dilate');
      dst._channels = src._channels;
    },
    morphologyEx(src, dst, op, _kernel, _point, _iter) {
      record('morphologyEx', op);
      dst._channels = src._channels;
    },
    equalizeHist(src, dst) {
      record('equalizeHist');
      dst._channels = 1;
    },

    // --- misc ---
    rotate(src, dst, _code) {
      record('rotate');
      dst._channels = src._channels;
    },
    convertScaleAbs(src, dst, _alpha, _beta) {
      record('convertScaleAbs');
      dst._channels = src._channels;
    },
    filter2D(src, dst, _ddepth, _kernel) {
      record('filter2D');
      dst._channels = src._channels;
    },

    // --- inspection helper exposed to tests ---
    _calls: calls,
    _called: (name) => calls.some((c) => c.name === name)
  };

  // Make `new cv.Mat()` work as well as `cv.Mat()`
  cv.Mat = function Mat() { return makeMat(4); };

  return cv;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  matRegistry = [];
  // Reset the module-level openCvReadyPromise cache so loadOpenCv tests
  // don't interfere with each other (processor.js caches it at module scope).
  // We install cv directly on globalThis so getOpenCvInstance() is satisfied.
  globalThis.window = globalThis;
});

afterEach(() => {
  delete globalThis.cv;
});

// ---------------------------------------------------------------------------
// prepareCanvasPair
// ---------------------------------------------------------------------------
describe('prepareCanvasPair', () => {
  it('sets the target canvas dimensions to match the source', () => {
    const src = makeCanvas(100, 80);
    const dst = makeCanvas(10, 10);
    prepareCanvasPair(src, dst);
    expect(dst.width).toBe(100);
    expect(dst.height).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// clearCanvas
// ---------------------------------------------------------------------------
describe('clearCanvas', () => {
  it('calls clearRect on the canvas context', () => {
    const canvas = makeCanvas(50, 50);
    clearCanvas(canvas);
    expect(canvas._cleared).toBe(true);
  });

  it('throws when getContext returns null', () => {
    const canvas = { getContext: () => null };
    expect(() => clearCanvas(canvas)).toThrow(/context/i);
  });
});

// ---------------------------------------------------------------------------
// applyPipelineToCanvas — empty pipeline
// ---------------------------------------------------------------------------
describe('applyPipelineToCanvas — empty pipeline', () => {
  it('reads from source, calls imshow on target, deletes all mats', () => {
    globalThis.cv = makeCvMock();
    const src = makeCanvas();
    const dst = makeCanvas();

    applyPipelineToCanvas(src, dst, []);

    expect(globalThis.cv._called('imread')).toBe(true);
    expect(globalThis.cv._called('imshow')).toBe(true);
    // Every mat created should be deleted
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// applyPipelineToCanvas — individual operations dispatch
// ---------------------------------------------------------------------------
describe('applyPipelineToCanvas — operation dispatch', () => {
  const ops = [
    { type: 'gaussianBlur',           params: { kernelSize: 5 },                    cv: 'GaussianBlur'    },
    { type: 'medianBlur',             params: { kernelSize: 3 },                    cv: 'medianBlur'      },
    { type: 'threshold',              params: { thresholdValue: 127, maxValue: 255 }, cv: 'threshold'     },
    { type: 'binaryInverseThreshold', params: { thresholdValue: 127, maxValue: 255 }, cv: 'threshold'     },
    { type: 'canny',                  params: { lowThreshold: 100, highThreshold: 200 }, cv: 'Canny'      },
    { type: 'erosion',                params: { kernelSize: 3, iterations: 1 },     cv: 'erode'           },
    { type: 'dilation',               params: { kernelSize: 3, iterations: 1 },     cv: 'dilate'          },
    { type: 'opening',                params: { kernelSize: 3, iterations: 1 },     cv: 'morphologyEx'    },
    { type: 'closing',                params: { kernelSize: 3, iterations: 1 },     cv: 'morphologyEx'    },
    { type: 'histogramEqualisation',  params: {},                                   cv: 'equalizeHist'    },
    { type: 'rotateImage',            params: { rotationCode: 0 },                  cv: 'rotate'          },
    { type: 'brightnessContrast',     params: { alpha: 1.0, beta: 0 },              cv: 'convertScaleAbs' },
    { type: 'sharpen',                params: { intensity: 1.0 },                   cv: 'filter2D'        },
  ];

  for (const { type, params, cv: expectedCall } of ops) {
    it(`dispatches ${type} and calls cv.${expectedCall}`, () => {
      globalThis.cv = makeCvMock();
      const src = makeCanvas();
      const dst = makeCanvas();

      applyPipelineToCanvas(src, dst, [{ type, params }]);

      expect(globalThis.cv._called(expectedCall)).toBe(true);
    });
  }

  it('dispatches grayscale and calls cvtColor with COLOR_RGBA2GRAY', () => {
    globalThis.cv = makeCvMock();
    const src = makeCanvas();
    const dst = makeCanvas();

    applyPipelineToCanvas(src, dst, [{ type: 'grayscale', params: {} }]);

    const grayCalls = globalThis.cv._calls.filter(
      (c) => c.name === 'cvtColor' && c.args[0] === 'COLOR_RGBA2GRAY'
    );
    expect(grayCalls.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// applyPipelineToCanvas — Mat cleanup (happy path)
// ---------------------------------------------------------------------------
describe('applyPipelineToCanvas — Mat cleanup on success', () => {
  it('deletes every Mat after a single-step pipeline', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'gaussianBlur', params: { kernelSize: 5 } }
    ]);
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });

  it('deletes every Mat after a multi-step pipeline', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'gaussianBlur',  params: { kernelSize: 5 } },
      { type: 'grayscale',     params: {} },
      { type: 'canny',         params: { lowThreshold: 50, highThreshold: 150 } },
      { type: 'erosion',       params: { kernelSize: 3, iterations: 1 } }
    ]);
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });

  it('deletes every Mat after threshold (which creates an internal gray Mat)', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'threshold', params: { thresholdValue: 127, maxValue: 255 } }
    ]);
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });

  it('deletes every Mat after canny (which creates an internal gray Mat)', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'canny', params: { lowThreshold: 100, highThreshold: 200 } }
    ]);
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });

  it('deletes every Mat after histogramEqualisation (gray + equalized)', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'histogramEqualisation', params: {} }
    ]);
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });

  it('deletes every Mat after antiAliasBinary (gray + blur + threshold)', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'antiAliasBinary', params: { blurKernel: 5, thresholdValue: 127 } }
    ]);
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });

  it('deletes every Mat after erosion (kernel + eroded)', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'erosion', params: { kernelSize: 3, iterations: 1 } }
    ]);
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// applyPipelineToCanvas — Mat cleanup on error
// ---------------------------------------------------------------------------
describe('applyPipelineToCanvas — Mat cleanup on error', () => {
  it('throws for an unknown operation type', () => {
    globalThis.cv = makeCvMock();
    expect(() =>
      applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
        { type: 'notARealOp', params: {} }
      ])
    ).toThrow(/notARealOp/);
  });

  it('still deletes all Mats when a step throws', () => {
    globalThis.cv = makeCvMock({ stepShouldThrow: true });
    expect(() =>
      applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
        { type: 'erosion', params: { kernelSize: 3, iterations: 1 } }
      ])
    ).toThrow();

    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });

  it('throws when OpenCV is not installed on window.cv', () => {
    delete globalThis.cv;
    expect(() =>
      applyPipelineToCanvas(makeCanvas(), makeCanvas(), [])
    ).toThrow(/not ready/i);
  });

  it('throws when window.cv exists but lacks required APIs', () => {
    globalThis.cv = { Mat: null };
    expect(() =>
      applyPipelineToCanvas(makeCanvas(), makeCanvas(), [])
    ).toThrow(/not ready/i);
  });
});

// ---------------------------------------------------------------------------
// bilateralFilter — RGBA→RGB workaround
// ---------------------------------------------------------------------------
describe('bilateralFilter — RGBA→RGB channel workaround', () => {
  it('converts RGBA→RGB before filtering and back to RGBA after', () => {
    globalThis.cv = makeCvMock();
    const src = makeCanvas();
    const dst = makeCanvas();

    // imread returns a 4-channel (RGBA) mat, which is the workaround path
    applyPipelineToCanvas(src, dst, [
      { type: 'bilateralFilter', params: { diameter: 9, sigmaColor: 75, sigmaSpace: 75 } }
    ]);

    const colorConversions = globalThis.cv._calls
      .filter((c) => c.name === 'cvtColor')
      .map((c) => c.args[0]);

    expect(colorConversions).toContain('COLOR_RGBA2RGB');
    expect(colorConversions).toContain('COLOR_RGB2RGBA');
    expect(globalThis.cv._called('bilateralFilter')).toBe(true);
  });

  it('cleans up all intermediate Mats in the bilateral filter path', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'bilateralFilter', params: { diameter: 9, sigmaColor: 75, sigmaSpace: 75 } }
    ]);
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });

  it('cleans up all intermediate Mats even when bilateralFilter throws', () => {
    globalThis.cv = makeCvMock({ bilateralShouldThrow: true });
    expect(() =>
      applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
        { type: 'bilateralFilter', params: { diameter: 9, sigmaColor: 75, sigmaSpace: 75 } }
      ])
    ).toThrow('bilateralFilter failed');

    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// matToDisplayMat — 1-channel output converted to RGBA for imshow
// ---------------------------------------------------------------------------
describe('matToDisplayMat — single-channel to RGBA conversion', () => {
  it('calls cvtColor(GRAY2RGBA) when the final mat is 1-channel (e.g. after grayscale)', () => {
    globalThis.cv = makeCvMock();

    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [{ type: 'grayscale', params: {} }]);

    const gray2rgbaCalls = globalThis.cv._calls.filter(
      (c) => c.name === 'cvtColor' && c.args[0] === 'COLOR_GRAY2RGBA'
    );
    expect(gray2rgbaCalls.length).toBeGreaterThan(0);
  });

  it('does NOT call cvtColor(GRAY2RGBA) when the final mat is already 4-channel', () => {
    globalThis.cv = makeCvMock();

    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'gaussianBlur', params: { kernelSize: 5 } }
    ]);

    const gray2rgbaCalls = globalThis.cv._calls.filter(
      (c) => c.name === 'cvtColor' && c.args[0] === 'COLOR_GRAY2RGBA'
    );
    expect(gray2rgbaCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// convertToGrayscale — already-gray fast path
// ---------------------------------------------------------------------------
describe('convertToGrayscale — already-gray input', () => {
  it('does not call cvtColor when canny receives an already-gray mat (prior grayscale step)', () => {
    globalThis.cv = makeCvMock();

    // After grayscale, the mat is 1-channel. Canny's internal convertToGrayscale
    // should use copyTo instead of cvtColor.
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'grayscale', params: {} },
      { type: 'canny', params: { lowThreshold: 100, highThreshold: 200 } }
    ]);

    // cvtColor calls: exactly one RGBA2GRAY (the grayscale step) and one
    // GRAY2RGBA (matToDisplayMat). The canny step must NOT add another one.
    const rgba2grayCalls = globalThis.cv._calls.filter(
      (c) => c.name === 'cvtColor' && c.args[0] === 'COLOR_RGBA2GRAY'
    );
    expect(rgba2grayCalls).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// applyGrayscaleToCanvas
// ---------------------------------------------------------------------------
describe('applyGrayscaleToCanvas', () => {
  it('calls cvtColor to gray and imshow', () => {
    globalThis.cv = makeCvMock();
    applyGrayscaleToCanvas(makeCanvas(), makeCanvas());
    expect(globalThis.cv._called('imshow')).toBe(true);
    const grayCalls = globalThis.cv._calls.filter(
      (c) => c.name === 'cvtColor' && c.args[0] === 'COLOR_RGBA2GRAY'
    );
    expect(grayCalls.length).toBeGreaterThan(0);
  });

  it('deletes all Mats', () => {
    globalThis.cv = makeCvMock();
    applyGrayscaleToCanvas(makeCanvas(), makeCanvas());
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Multi-step pipeline — ordering and interactions
// ---------------------------------------------------------------------------
describe('applyPipelineToCanvas — multi-step ordering', () => {
  it('applies steps in order: sharpen then canny calls both filter2D and Canny', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'sharpen', params: { intensity: 1.0 } },
      { type: 'canny',   params: { lowThreshold: 50, highThreshold: 150 } }
    ]);
    const names = globalThis.cv._calls.map((c) => c.name);
    const filter2dIdx = names.indexOf('filter2D');
    const cannyIdx = names.indexOf('Canny');
    expect(filter2dIdx).toBeGreaterThanOrEqual(0);
    expect(cannyIdx).toBeGreaterThan(filter2dIdx);
  });

  it('applies steps in order: blur then threshold', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'gaussianBlur', params: { kernelSize: 5 } },
      { type: 'threshold',    params: { thresholdValue: 127, maxValue: 255 } }
    ]);
    const names = globalThis.cv._calls.map((c) => c.name);
    expect(names.indexOf('GaussianBlur')).toBeLessThan(names.indexOf('threshold'));
  });

  it('passes correct number of pipeline steps — each op called exactly once', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'gaussianBlur', params: { kernelSize: 5 } },
      { type: 'medianBlur',   params: { kernelSize: 3 } },
      { type: 'rotateImage',  params: { rotationCode: 0 } }
    ]);
    expect(globalThis.cv._calls.filter((c) => c.name === 'GaussianBlur')).toHaveLength(1);
    expect(globalThis.cv._calls.filter((c) => c.name === 'medianBlur')).toHaveLength(1);
  });

  it('cleans up all Mats for a long heterogeneous pipeline', () => {
    globalThis.cv = makeCvMock();
    applyPipelineToCanvas(makeCanvas(), makeCanvas(), [
      { type: 'bilateralFilter',     params: { diameter: 9, sigmaColor: 75, sigmaSpace: 75 } },
      { type: 'gaussianBlur',        params: { kernelSize: 5 } },
      { type: 'grayscale',           params: {} },
      { type: 'threshold',           params: { thresholdValue: 127, maxValue: 255 } },
      { type: 'erosion',             params: { kernelSize: 3, iterations: 1 } },
      { type: 'dilation',            params: { kernelSize: 3, iterations: 2 } },
      { type: 'histogramEqualisation', params: {} }
    ]);
    const leaked = matRegistry.filter((m) => !m._deleted);
    expect(leaked).toHaveLength(0);
  });
});
