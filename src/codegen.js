import { normalizeOperationParams } from './operationConfig.js';

/**
 * Returns the Python snippet that matches the current image-processing pipeline.
 */
export function generatePythonCode(pipeline = []) {
  if (!pipeline.length) {
    return '';
  }

  const imports = ['import cv2'];
  const lines = ['img = cv2.imread("image.jpg")'];
  let isGray = false;

  if (pipeline.some((step) => requiresNumPy(step.type))) {
    imports.push('import numpy as np');
  }

  for (const step of pipeline) {
    const result = generateStepCode(step, isGray);
    lines.push(...result.lines);
    isGray = result.isGray;
  }

  return [
    ...imports,
    '',
    ...lines,
    '',
    'cv2.imshow("output", img)',
    'cv2.waitKey(0)'
  ].join('\n');
}

function generateStepCode(step, isGray) {
  switch (step.type) {
    case 'grayscale':
      return generateGrayscaleCode(isGray);
    case 'gaussianBlur':
      return generateGaussianBlurCode(step.params, isGray);
    case 'medianBlur':
      return generateMedianBlurCode(step.params, isGray);
    case 'threshold':
      return generateThresholdCode(step.params, isGray, 'cv2.THRESH_BINARY');
    case 'binaryInverseThreshold':
      return generateThresholdCode(step.params, isGray, 'cv2.THRESH_BINARY_INV');
    case 'canny':
      return generateCannyCode(step.params, isGray);
    case 'erosion':
      return generateErosionCode(step.params, isGray);
    case 'dilation':
      return generateDilationCode(step.params, isGray);
    case 'opening':
      return generateOpeningCode(step.params, isGray);
    case 'closing':
      return generateClosingCode(step.params, isGray);
    case 'histogramEqualisation':
      return generateHistogramEqualisationCode(isGray);
    case 'rotateImage':
      return generateRotateImageCode(step.params, isGray);
    case 'brightnessContrast':
      return generateBrightnessContrastCode(step.params, isGray);
    case 'sharpen':
      return generateSharpenCode(step.params, isGray);
    default:
      return { lines: [`# Unsupported operation: ${step.type}`], isGray };
  }
}

function generateGrayscaleCode(isGray) {
  if (isGray) {
    return { lines: ['# Image is already grayscale'], isGray: true };
  }

  return {
    lines: ['img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)'],
    isGray: true
  };
}

function generateGaussianBlurCode(params = {}, isGray) {
  const normalizedParams = normalizeOperationParams('gaussianBlur', params) ?? { kernelSize: 5 };

  return {
    lines: [
      `img = cv2.GaussianBlur(img, (${normalizedParams.kernelSize}, ${normalizedParams.kernelSize}), 0)`
    ],
    isGray
  };
}

function generateMedianBlurCode(params = {}, isGray) {
  const normalizedParams = normalizeOperationParams('medianBlur', params) ?? { kernelSize: 3 };

  return {
    lines: [`img = cv2.medianBlur(img, ${normalizedParams.kernelSize})`],
    isGray
  };
}

function generateThresholdCode(params = {}, isGray, thresholdType) {
  const lines = ensureGrayCode(isGray);
  const normalizedParams =
    normalizeOperationParams(
      thresholdType === 'cv2.THRESH_BINARY' ? 'threshold' : 'binaryInverseThreshold',
      params
    ) ?? { thresholdValue: 127, maxValue: 255 };

  lines.push(
    `_, img = cv2.threshold(img, ${normalizedParams.thresholdValue}, ${normalizedParams.maxValue}, ${thresholdType})`
  );

  return { lines, isGray: true };
}

function generateCannyCode(params = {}, isGray) {
  const lines = ensureGrayCode(isGray);
  const normalizedParams = normalizeOperationParams('canny', params) ?? {
    lowThreshold: 100,
    highThreshold: 200
  };

  lines.push(`img = cv2.Canny(img, ${normalizedParams.lowThreshold}, ${normalizedParams.highThreshold})`);

  return { lines, isGray: true };
}

function generateErosionCode(params = {}, isGray) {
  const normalizedParams = normalizeOperationParams('erosion', params) ?? {
    kernelSize: 3,
    iterations: 1
  };

  return {
    lines: [
      `kernel = np.ones((${normalizedParams.kernelSize}, ${normalizedParams.kernelSize}), np.uint8)`,
      `img = cv2.erode(img, kernel, iterations=${normalizedParams.iterations})`
    ],
    isGray
  };
}

function generateDilationCode(params = {}, isGray) {
  const normalizedParams = normalizeOperationParams('dilation', params) ?? {
    kernelSize: 3,
    iterations: 1
  };

  return {
    lines: [
      `kernel = np.ones((${normalizedParams.kernelSize}, ${normalizedParams.kernelSize}), np.uint8)`,
      `img = cv2.dilate(img, kernel, iterations=${normalizedParams.iterations})`
    ],
    isGray
  };
}

function generateOpeningCode(params = {}, isGray) {
  const normalizedParams = normalizeOperationParams('opening', params) ?? {
    kernelSize: 3,
    iterations: 1
  };

  return {
    lines: [
      `kernel = np.ones((${normalizedParams.kernelSize}, ${normalizedParams.kernelSize}), np.uint8)`,
      `img = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel, iterations=${normalizedParams.iterations})`
    ],
    isGray
  };
}

function generateClosingCode(params = {}, isGray) {
  const normalizedParams = normalizeOperationParams('closing', params) ?? {
    kernelSize: 3,
    iterations: 1
  };

  return {
    lines: [
      `kernel = np.ones((${normalizedParams.kernelSize}, ${normalizedParams.kernelSize}), np.uint8)`,
      `img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel, iterations=${normalizedParams.iterations})`
    ],
    isGray
  };
}

function generateHistogramEqualisationCode(isGray) {
  const lines = isGray ? [] : ensureGrayCode(false);

  lines.push('img = cv2.equalizeHist(img)');

  return { lines, isGray: true };
}

function generateRotateImageCode(params = {}, isGray) {
  const normalizedParams = normalizeOperationParams('rotateImage', params) ?? {
    rotationCode: 0
  };

  const rotationConstant =
    normalizedParams.rotationCode === 0
      ? 'cv2.ROTATE_90_CLOCKWISE'
      : normalizedParams.rotationCode === 1
        ? 'cv2.ROTATE_180'
        : 'cv2.ROTATE_90_COUNTERCLOCKWISE';

  return {
    lines: [`img = cv2.rotate(img, ${rotationConstant})`],
    isGray
  };
}

function generateBrightnessContrastCode(params = {}, isGray) {
  const normalizedParams = normalizeOperationParams('brightnessContrast', params) ?? {
    alpha: 1,
    beta: 0
  };
  const alpha = normalizedParams.alpha.toFixed(1);

  return {
    lines: [
      `img = cv2.convertScaleAbs(img, alpha=${alpha}, beta=${normalizedParams.beta})`
    ],
    isGray
  };
}

function generateSharpenCode(params = {}, isGray) {
  const normalizedParams = normalizeOperationParams('sharpen', params) ?? { intensity: 1 };
  const intensity = normalizedParams.intensity.toFixed(1);

  return {
    lines: [
      `kernel = np.array([[0, -${intensity}, 0], [-${intensity}, ${1 + 4 * intensity}, -${intensity}], [0, -${intensity}, 0]])`,
      'img = cv2.filter2D(img, -1, kernel)'
    ],
    isGray
  };
}

function ensureGrayCode(isGray) {
  return isGray ? [] : ['img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)'];
}

function requiresNumPy(operationType) {
  return (
    operationType === 'sharpen' ||
    operationType === 'erosion' ||
    operationType === 'dilation' ||
    operationType === 'opening' ||
    operationType === 'closing'
  );
}
