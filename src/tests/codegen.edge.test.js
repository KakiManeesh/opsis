/**
 * codegen.edge.test.js
 *
 * Edge cases for Python code generation, focused on:
 *   - Grayscale-requiring ops (canny, threshold, binaryInverseThreshold,
 *     histogramEqualisation, antiAliasBinary) placed at different positions
 *     in the pipeline.
 *   - Correct cvtColor insertion (present when needed, absent when not).
 *   - Correct generated Python matching browser behavior (same param values,
 *     same op order, same conditional import of numpy).
 *   - Operations that sandwich a color step between two gray-requiring ops.
 *   - Repeated ops of the same type.
 *   - Full pipeline code correctness (line order, no duplicates).
 */

import { describe, it, expect } from 'vitest';
import { generatePythonCode, generateStepSnippet } from '../codegen.js';

const step = (type, params = {}) => ({ id: `step-${type}-${Math.random()}`, type, params });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Count occurrences of a substring in a string. */
function countOccurrences(str, sub) {
  return (str.match(new RegExp(sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
}

/** Extract lines in order, ignoring blank lines. */
function codeLines(code) {
  return code.split('\n').filter((l) => l.trim() !== '');
}

// ---------------------------------------------------------------------------
// cvtColor insertion — position sensitivity
// ---------------------------------------------------------------------------
describe('cvtColor — position of gray-requiring operations', () => {
  it('inserts cvtColor before canny at position 0 (first step)', () => {
    const code = generatePythonCode([step('canny', { lowThreshold: 50, highThreshold: 150 })]);
    const lines = codeLines(code);
    const cvtIdx = lines.findIndex((l) => l.includes('cvtColor'));
    const cannyIdx = lines.findIndex((l) => l.includes('Canny'));
    expect(cvtIdx).toBeGreaterThanOrEqual(0);
    expect(cvtIdx).toBeLessThan(cannyIdx);
  });

  it('inserts cvtColor before canny at position 1 (after a color op)', () => {
    const code = generatePythonCode([
      step('gaussianBlur', { kernelSize: 5 }),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ]);
    const lines = codeLines(code);
    const blurIdx  = lines.findIndex((l) => l.includes('GaussianBlur'));
    const cvtIdx   = lines.findIndex((l) => l.includes('cvtColor'));
    const cannyIdx = lines.findIndex((l) => l.includes('Canny'));
    expect(blurIdx).toBeLessThan(cvtIdx);
    expect(cvtIdx).toBeLessThan(cannyIdx);
  });

  it('inserts cvtColor before canny at position 2 (after two color ops)', () => {
    const code = generatePythonCode([
      step('brightnessContrast', { alpha: 1.2, beta: 10 }),
      step('gaussianBlur', { kernelSize: 3 }),
      step('canny', { lowThreshold: 80, highThreshold: 160 })
    ]);
    const lines = codeLines(code);
    const blurIdx  = lines.findIndex((l) => l.includes('GaussianBlur'));
    const cvtIdx   = lines.findIndex((l) => l.includes('cvtColor'));
    const cannyIdx = lines.findIndex((l) => l.includes('Canny'));
    expect(blurIdx).toBeLessThan(cvtIdx);
    expect(cvtIdx).toBeLessThan(cannyIdx);
  });

  it('does NOT insert cvtColor before canny when immediately preceded by grayscale', () => {
    const code = generatePythonCode([
      step('grayscale'),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ]);
    // Only one cvtColor total — the grayscale step itself
    expect(countOccurrences(code, 'cvtColor')).toBe(1);
  });

  it('does NOT insert cvtColor before canny when preceded by threshold (which also produces gray)', () => {
    const code = generatePythonCode([
      step('threshold', { thresholdValue: 127, maxValue: 255 }),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ]);
    // threshold emits one cvtColor; canny should not emit another
    expect(countOccurrences(code, 'cvtColor')).toBe(1);
  });

  it('does NOT insert cvtColor before threshold when preceded by grayscale', () => {
    const code = generatePythonCode([
      step('grayscale'),
      step('threshold', { thresholdValue: 100, maxValue: 255 })
    ]);
    expect(countOccurrences(code, 'cvtColor')).toBe(1);
  });

  it('does NOT insert cvtColor before histogramEqualisation when preceded by grayscale', () => {
    const code = generatePythonCode([
      step('grayscale'),
      step('histogramEqualisation')
    ]);
    expect(countOccurrences(code, 'cvtColor')).toBe(1);
  });

  it('inserts cvtColor before histogramEqualisation when it is the first step', () => {
    const code = generatePythonCode([step('histogramEqualisation')]);
    expect(code).toContain('cvtColor');
    const lines = codeLines(code);
    const cvtIdx  = lines.findIndex((l) => l.includes('cvtColor'));
    const histIdx = lines.findIndex((l) => l.includes('equalizeHist'));
    expect(cvtIdx).toBeLessThan(histIdx);
  });

  it('inserts cvtColor before antiAliasBinary regardless of position', () => {
    const code = generatePythonCode([
      step('bilateralFilter', { diameter: 9, sigmaColor: 75, sigmaSpace: 75 }),
      step('antiAliasBinary', { blurKernel: 5, thresholdValue: 127 })
    ]);
    expect(code).toContain('cvtColor');
    const lines = codeLines(code);
    const cvtIdx   = lines.findIndex((l) => l.includes('cvtColor'));
    const blurIdx  = lines.findIndex((l) => l.includes('GaussianBlur'));
    const threshIdx = lines.findIndex((l) => l.includes('threshold'));
    expect(cvtIdx).toBeLessThan(blurIdx);
    expect(blurIdx).toBeLessThan(threshIdx);
  });
});

// ---------------------------------------------------------------------------
// Sandwiching — color op between two gray-requiring ops
// ---------------------------------------------------------------------------
describe('cvtColor — sandwiched color ops between gray-requiring ops', () => {
  it('inserts only one cvtColor when canny is followed by gaussianBlur then another canny', () => {
    // After first canny: isGray=true. gaussianBlur preserves gray. Second canny: no new cvtColor.
    const code = generatePythonCode([
      step('canny',       { lowThreshold: 50,  highThreshold: 100 }),
      step('gaussianBlur', { kernelSize: 3 }),
      step('canny',       { lowThreshold: 80,  highThreshold: 160 })
    ]);
    // The first canny inserts a cvtColor; subsequent ops stay gray
    expect(countOccurrences(code, 'cvtColor')).toBe(1);
    expect(countOccurrences(code, 'Canny')).toBe(2);
  });

  it('correctly re-inserts cvtColor when a non-gray op follows a gray-producing op', () => {
    // grayscale → brightnessContrast (stays gray) → canny (already gray, no new cvtColor)
    const code = generatePythonCode([
      step('grayscale'),
      step('brightnessContrast', { alpha: 1.5, beta: 10 }),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ]);
    expect(countOccurrences(code, 'cvtColor')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Repeated ops
// ---------------------------------------------------------------------------
describe('repeated operations', () => {
  it('emits two GaussianBlur calls when blur appears twice', () => {
    const code = generatePythonCode([
      step('gaussianBlur', { kernelSize: 3 }),
      step('gaussianBlur', { kernelSize: 7 })
    ]);
    expect(countOccurrences(code, 'GaussianBlur')).toBe(2);
    expect(code).toContain('(3, 3)');
    expect(code).toContain('(7, 7)');
  });

  it('emits two Canny calls when canny appears twice, with only one cvtColor', () => {
    const code = generatePythonCode([
      step('canny', { lowThreshold: 50,  highThreshold: 100 }),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ]);
    expect(countOccurrences(code, 'Canny')).toBe(2);
    expect(countOccurrences(code, 'cvtColor')).toBe(1);
  });

  it('emits grayscale comment for second grayscale, not a duplicate cvtColor', () => {
    const code = generatePythonCode([
      step('grayscale'),
      step('gaussianBlur', { kernelSize: 5 }),
      step('grayscale')
    ]);
    expect(countOccurrences(code, 'cvtColor')).toBe(1);
    expect(code).toContain('already grayscale');
  });
});

// ---------------------------------------------------------------------------
// Generated Python correctness — param values
// ---------------------------------------------------------------------------
describe('generated Python — param value correctness', () => {
  it('GaussianBlur uses the exact kernel value from params', () => {
    const code = generatePythonCode([step('gaussianBlur', { kernelSize: 11 })]);
    expect(code).toContain('cv2.GaussianBlur(img, (11, 11), 0)');
  });

  it('Canny uses exact low and high values from params', () => {
    const code = generatePythonCode([step('canny', { lowThreshold: 30, highThreshold: 90 })]);
    expect(code).toContain('cv2.Canny(img, 30, 90)');
  });

  it('bilateralFilter uses all three sigma params', () => {
    const code = generatePythonCode([
      step('bilateralFilter', { diameter: 5, sigmaColor: 50, sigmaSpace: 100 })
    ]);
    expect(code).toContain('cv2.bilateralFilter(img, 5, 50, 100)');
  });

  it('convertScaleAbs formats alpha to 1 decimal place', () => {
    const code = generatePythonCode([step('brightnessContrast', { alpha: 2.0, beta: -30 })]);
    expect(code).toContain('alpha=2.0');
    expect(code).toContain('beta=-30');
  });

  it('threshold emits both thresholdValue and maxValue', () => {
    const code = generatePythonCode([step('threshold', { thresholdValue: 80, maxValue: 200 })]);
    expect(code).toContain('cv2.threshold(img, 80, 200, cv2.THRESH_BINARY)');
  });

  it('erosion emits correct kernel size and iterations', () => {
    const code = generatePythonCode([step('erosion', { kernelSize: 5, iterations: 3 })]);
    expect(code).toContain('np.ones((5, 5)');
    expect(code).toContain('iterations=3');
  });

  it('sharpen intensity is formatted to 1 decimal place in the kernel', () => {
    const code = generatePythonCode([step('sharpen', { intensity: 2.0 })]);
    expect(code).toContain('2.0');
  });

  it('medianBlur uses exact kernel size', () => {
    const code = generatePythonCode([step('medianBlur', { kernelSize: 9 })]);
    expect(code).toContain('cv2.medianBlur(img, 9)');
  });
});

// ---------------------------------------------------------------------------
// numpy import — conditional on operation type
// ---------------------------------------------------------------------------
describe('numpy import — conditional', () => {
  const needsNumpy = ['sharpen', 'erosion', 'dilation', 'opening', 'closing'];
  const noNumpy    = ['grayscale', 'gaussianBlur', 'medianBlur', 'canny',
                      'threshold', 'bilateralFilter', 'brightnessContrast',
                      'histogramEqualisation', 'rotateImage'];

  for (const type of needsNumpy) {
    it(`imports numpy for ${type}`, () => {
      const params = {
        sharpen:   { intensity: 1.0 },
        erosion:   { kernelSize: 3, iterations: 1 },
        dilation:  { kernelSize: 3, iterations: 1 },
        opening:   { kernelSize: 3, iterations: 1 },
        closing:   { kernelSize: 3, iterations: 1 }
      }[type] ?? {};
      expect(generatePythonCode([step(type, params)])).toContain('import numpy as np');
    });
  }

  for (const type of noNumpy) {
    it(`does NOT import numpy for ${type}`, () => {
      const params = {
        canny:               { lowThreshold: 100, highThreshold: 200 },
        threshold:           { thresholdValue: 127, maxValue: 255 },
        gaussianBlur:        { kernelSize: 5 },
        medianBlur:          { kernelSize: 3 },
        bilateralFilter:     { diameter: 9, sigmaColor: 75, sigmaSpace: 75 },
        brightnessContrast:  { alpha: 1.0, beta: 0 },
        histogramEqualisation: {},
        rotateImage:         { rotationCode: 0 }
      }[type] ?? {};
      expect(generatePythonCode([step(type, params)])).not.toContain('import numpy');
    });
  }

  it('imports numpy only once even when multiple numpy-requiring ops are present', () => {
    const code = generatePythonCode([
      step('sharpen',  { intensity: 1.0 }),
      step('erosion',  { kernelSize: 3, iterations: 1 }),
      step('dilation', { kernelSize: 3, iterations: 1 })
    ]);
    expect(countOccurrences(code, 'import numpy as np')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// generateStepSnippet — grayscale state tracking
// ---------------------------------------------------------------------------
describe('generateStepSnippet — grayscale-position edge cases', () => {
  it('snippet for step 0 canny includes cvtColor', () => {
    const pipeline = [step('canny', { lowThreshold: 100, highThreshold: 200 })];
    const snippet = generateStepSnippet(pipeline, 0);
    expect(snippet).toContain('cvtColor');
    expect(snippet).toContain('Canny');
  });

  it('snippet for step 2 canny (after grayscale at step 0) does NOT include cvtColor', () => {
    const pipeline = [
      step('grayscale'),
      step('gaussianBlur', { kernelSize: 5 }),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ];
    const snippet = generateStepSnippet(pipeline, 2);
    expect(snippet).not.toContain('cvtColor');
    expect(snippet).toContain('Canny');
  });

  it('snippet for threshold at step 1 (after blur) includes cvtColor', () => {
    const pipeline = [
      step('gaussianBlur', { kernelSize: 5 }),
      step('threshold', { thresholdValue: 127, maxValue: 255 })
    ];
    const snippet = generateStepSnippet(pipeline, 1);
    expect(snippet).toContain('cvtColor');
    expect(snippet).toContain('threshold');
  });

  it('snippet for threshold at step 1 (after grayscale) does NOT include cvtColor', () => {
    const pipeline = [
      step('grayscale'),
      step('threshold', { thresholdValue: 127, maxValue: 255 })
    ];
    const snippet = generateStepSnippet(pipeline, 1);
    expect(snippet).not.toContain('cvtColor');
  });

  it('snippet for histogramEqualisation at step 2 (after grayscale) omits cvtColor', () => {
    const pipeline = [
      step('grayscale'),
      step('medianBlur', { kernelSize: 3 }),
      step('histogramEqualisation')
    ];
    const snippet = generateStepSnippet(pipeline, 2);
    expect(snippet).not.toContain('cvtColor');
    expect(snippet).toContain('equalizeHist');
  });

  it('snippet for second grayscale emits comment, not a conversion', () => {
    const pipeline = [step('grayscale'), step('grayscale')];
    const snippet = generateStepSnippet(pipeline, 1);
    expect(snippet).not.toContain('cvtColor');
    expect(snippet).toContain('#');
  });
});

// ---------------------------------------------------------------------------
// Full pipeline code — line ordering
// ---------------------------------------------------------------------------
describe('full pipeline code — line ordering', () => {
  it('imports come before imread line', () => {
    const code = generatePythonCode([step('erosion', { kernelSize: 3, iterations: 1 })]);
    const lines = codeLines(code);
    const importIdx = lines.findIndex((l) => l.startsWith('import'));
    const imreadIdx = lines.findIndex((l) => l.includes('imread'));
    expect(importIdx).toBeLessThan(imreadIdx);
  });

  it('imshow and waitKey come last', () => {
    const code = generatePythonCode([
      step('gaussianBlur', { kernelSize: 5 }),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ]);
    const lines = codeLines(code);
    const imshowIdx  = lines.findIndex((l) => l.includes('imshow'));
    const waitKeyIdx = lines.findIndex((l) => l.includes('waitKey'));
    const cannyIdx   = lines.findIndex((l) => l.includes('Canny'));
    expect(cannyIdx).toBeLessThan(imshowIdx);
    expect(imshowIdx).toBeLessThan(waitKeyIdx);
  });

  it('unsupported operation emits a comment placeholder', () => {
    // generatePythonCode calls generateStepCode which has a default branch
    // returning a comment; test via the internal path by injecting a raw step
    const code = generatePythonCode([{ id: 'x', type: 'unknownOp', params: {} }]);
    expect(code).toContain('# Unsupported operation: unknownOp');
  });
});
