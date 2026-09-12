import { describe, it, expect } from 'vitest';
import { generatePythonCode, generateStepSnippet } from '../codegen.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const step = (type, params = {}) => ({ id: `step-${type}`, type, params });

// ---------------------------------------------------------------------------
// generatePythonCode — empty pipeline
// ---------------------------------------------------------------------------
describe('generatePythonCode — empty pipeline', () => {
  it('returns an empty string for an empty pipeline', () => {
    expect(generatePythonCode([])).toBe('');
  });

  it('returns an empty string when called with no arguments', () => {
    expect(generatePythonCode()).toBe('');
  });
});

// ---------------------------------------------------------------------------
// generatePythonCode — structure
// ---------------------------------------------------------------------------
describe('generatePythonCode — output structure', () => {
  it('always starts with "import cv2"', () => {
    const code = generatePythonCode([step('grayscale')]);
    expect(code.startsWith('import cv2')).toBe(true);
  });

  it('always includes imread and imshow', () => {
    const code = generatePythonCode([step('grayscale')]);
    expect(code).toContain('cv2.imread');
    expect(code).toContain('cv2.imshow');
    expect(code).toContain('cv2.waitKey(0)');
  });

  it('does NOT import numpy when no numpy-requiring ops are present', () => {
    const code = generatePythonCode([step('gaussianBlur', { kernelSize: 5 })]);
    expect(code).not.toContain('import numpy');
  });

  it('imports numpy when sharpen is in the pipeline', () => {
    const code = generatePythonCode([step('sharpen', { intensity: 1.0 })]);
    expect(code).toContain('import numpy as np');
  });

  it('imports numpy when erosion is in the pipeline', () => {
    const code = generatePythonCode([step('erosion', { kernelSize: 3, iterations: 1 })]);
    expect(code).toContain('import numpy as np');
  });
});

// ---------------------------------------------------------------------------
// generatePythonCode — individual operations
// ---------------------------------------------------------------------------
describe('generatePythonCode — grayscale', () => {
  it('emits cvtColor to gray', () => {
    const code = generatePythonCode([step('grayscale')]);
    expect(code).toContain('cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)');
  });

  it('does not emit cvtColor twice when grayscale appears twice', () => {
    const code = generatePythonCode([step('grayscale'), step('grayscale')]);
    const count = (code.match(/cvtColor/g) ?? []).length;
    // Second grayscale should emit a comment, not another conversion
    expect(count).toBe(1);
    expect(code).toContain('already grayscale');
  });
});

describe('generatePythonCode — gaussianBlur', () => {
  it('emits GaussianBlur with correct kernel', () => {
    const code = generatePythonCode([step('gaussianBlur', { kernelSize: 7 })]);
    expect(code).toContain('cv2.GaussianBlur(img, (7, 7), 0)');
  });
});

describe('generatePythonCode — medianBlur', () => {
  it('emits medianBlur with correct kernel', () => {
    const code = generatePythonCode([step('medianBlur', { kernelSize: 5 })]);
    expect(code).toContain('cv2.medianBlur(img, 5)');
  });
});

describe('generatePythonCode — canny', () => {
  it('inserts cvtColor before Canny when image is not yet gray', () => {
    const code = generatePythonCode([step('canny', { lowThreshold: 50, highThreshold: 150 })]);
    expect(code).toContain('cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)');
    expect(code).toContain('cv2.Canny(img, 50, 150)');
    // cvtColor must appear before Canny
    expect(code.indexOf('cvtColor')).toBeLessThan(code.indexOf('Canny'));
  });

  it('does NOT insert cvtColor before Canny when image is already gray', () => {
    const code = generatePythonCode([
      step('grayscale'),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ]);
    const count = (code.match(/cvtColor/g) ?? []).length;
    expect(count).toBe(1); // only the grayscale step, not a second one
    expect(code).toContain('cv2.Canny(img, 100, 200)');
  });
});

describe('generatePythonCode — threshold', () => {
  it('emits THRESH_BINARY and auto-converts to gray', () => {
    const code = generatePythonCode([step('threshold', { thresholdValue: 127, maxValue: 255 })]);
    expect(code).toContain('cv2.THRESH_BINARY');
    expect(code).toContain('cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)');
  });
});

describe('generatePythonCode — binaryInverseThreshold', () => {
  it('emits THRESH_BINARY_INV', () => {
    const code = generatePythonCode([step('binaryInverseThreshold', { thresholdValue: 100, maxValue: 255 })]);
    expect(code).toContain('cv2.THRESH_BINARY_INV');
  });
});

describe('generatePythonCode — sharpen', () => {
  it('emits filter2D and uses the intensity in the kernel', () => {
    const code = generatePythonCode([step('sharpen', { intensity: 1.0 })]);
    expect(code).toContain('cv2.filter2D(img, -1, kernel)');
    expect(code).toContain('np.array');
  });
});

describe('generatePythonCode — brightnessContrast', () => {
  it('emits convertScaleAbs with alpha and beta', () => {
    const code = generatePythonCode([step('brightnessContrast', { alpha: 1.5, beta: 20 })]);
    expect(code).toContain('cv2.convertScaleAbs(img, alpha=1.5, beta=20)');
  });
});

describe('generatePythonCode — rotateImage', () => {
  it('emits ROTATE_90_CLOCKWISE for code 0', () => {
    const code = generatePythonCode([step('rotateImage', { rotationCode: 0 })]);
    expect(code).toContain('cv2.ROTATE_90_CLOCKWISE');
  });

  it('emits ROTATE_180 for code 1', () => {
    const code = generatePythonCode([step('rotateImage', { rotationCode: 1 })]);
    expect(code).toContain('cv2.ROTATE_180');
  });

  it('emits ROTATE_90_COUNTERCLOCKWISE for code 2', () => {
    const code = generatePythonCode([step('rotateImage', { rotationCode: 2 })]);
    expect(code).toContain('cv2.ROTATE_90_COUNTERCLOCKWISE');
  });
});

describe('generatePythonCode — bilateralFilter', () => {
  it('emits bilateralFilter with correct params', () => {
    const code = generatePythonCode([step('bilateralFilter', { diameter: 9, sigmaColor: 75, sigmaSpace: 75 })]);
    expect(code).toContain('cv2.bilateralFilter(img, 9, 75, 75)');
  });
});

describe('generatePythonCode — morphology ops', () => {
  it('erosion emits cv2.erode with np kernel', () => {
    const code = generatePythonCode([step('erosion', { kernelSize: 3, iterations: 2 })]);
    expect(code).toContain('cv2.erode(img, kernel, iterations=2)');
    expect(code).toContain('np.ones((3, 3)');
  });

  it('dilation emits cv2.dilate', () => {
    const code = generatePythonCode([step('dilation', { kernelSize: 5, iterations: 1 })]);
    expect(code).toContain('cv2.dilate(img, kernel, iterations=1)');
  });

  it('opening emits MORPH_OPEN', () => {
    const code = generatePythonCode([step('opening', { kernelSize: 3, iterations: 1 })]);
    expect(code).toContain('cv2.MORPH_OPEN');
  });

  it('closing emits MORPH_CLOSE', () => {
    const code = generatePythonCode([step('closing', { kernelSize: 3, iterations: 1 })]);
    expect(code).toContain('cv2.MORPH_CLOSE');
  });
});

describe('generatePythonCode — histogramEqualisation', () => {
  it('emits equalizeHist and auto-converts to gray', () => {
    const code = generatePythonCode([step('histogramEqualisation')]);
    expect(code).toContain('cv2.equalizeHist(img)');
    expect(code).toContain('cvtColor');
  });
});

// ---------------------------------------------------------------------------
// generatePythonCode — multi-step grayscale state tracking
// ---------------------------------------------------------------------------
describe('generatePythonCode — grayscale state tracking across steps', () => {
  it('inserts only one cvtColor when canny follows gaussianBlur', () => {
    const pipeline = [
      step('gaussianBlur', { kernelSize: 5 }),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ];
    const code = generatePythonCode(pipeline);
    const count = (code.match(/cvtColor/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('inserts no cvtColor when canny follows grayscale', () => {
    const pipeline = [
      step('grayscale'),
      step('canny', { lowThreshold: 100, highThreshold: 200 })
    ];
    const code = generatePythonCode(pipeline);
    const count = (code.match(/cvtColor/g) ?? []).length;
    expect(count).toBe(1); // only the grayscale step itself
  });
});

// ---------------------------------------------------------------------------
// generateStepSnippet
// ---------------------------------------------------------------------------
describe('generateStepSnippet', () => {
  const pipeline = [
    step('gaussianBlur', { kernelSize: 5 }),
    step('canny', { lowThreshold: 100, highThreshold: 200 })
  ];

  it('returns the blur line for step 0', () => {
    const snippet = generateStepSnippet(pipeline, 0);
    expect(snippet).toContain('GaussianBlur');
  });

  it('includes cvtColor in the canny snippet (step 1) because step 0 is not gray', () => {
    const snippet = generateStepSnippet(pipeline, 1);
    expect(snippet).toContain('cvtColor');
    expect(snippet).toContain('Canny');
  });

  it('returns fallback comment for out-of-range index', () => {
    expect(generateStepSnippet(pipeline, -1)).toContain('#');
    expect(generateStepSnippet(pipeline, 99)).toContain('#');
  });

  it('does NOT include cvtColor in canny snippet when prior step is grayscale', () => {
    const grayFirst = [step('grayscale'), step('canny', { lowThreshold: 50, highThreshold: 150 })];
    const snippet = generateStepSnippet(grayFirst, 1);
    expect(snippet).not.toContain('cvtColor');
    expect(snippet).toContain('Canny');
  });
});
