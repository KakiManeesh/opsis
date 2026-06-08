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

  if (pipeline.some((step) => step.type === 'sharpen')) {
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
    case 'threshold':
      return generateThresholdCode(step.params, isGray, 'cv2.THRESH_BINARY');
    case 'binaryInverseThreshold':
      return generateThresholdCode(step.params, isGray, 'cv2.THRESH_BINARY_INV');
    case 'canny':
      return generateCannyCode(step.params, isGray);
    case 'sharpen':
      return generateSharpenCode(isGray);
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
  const kernelSize = normalizeOddKernelSize(params.kernelSize ?? 5);

  return {
    lines: [`img = cv2.GaussianBlur(img, (${kernelSize}, ${kernelSize}), 0)`],
    isGray
  };
}

function generateThresholdCode(params = {}, isGray, thresholdType) {
  const lines = ensureGrayCode(isGray);
  const thresholdValue = clampByte(params.thresholdValue ?? 127);

  lines.push(`_, img = cv2.threshold(img, ${thresholdValue}, 255, ${thresholdType})`);

  return { lines, isGray: true };
}

function generateCannyCode(params = {}, isGray) {
  const lines = ensureGrayCode(isGray);
  const threshold1 = clampByte(params.threshold1 ?? 100);
  const threshold2 = clampByte(params.threshold2 ?? 200);

  lines.push(`img = cv2.Canny(img, ${threshold1}, ${threshold2})`);

  return { lines, isGray: true };
}

function generateSharpenCode(isGray) {
  return {
    lines: [
      'kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])',
      'img = cv2.filter2D(img, -1, kernel)'
    ],
    isGray
  };
}

function ensureGrayCode(isGray) {
  return isGray ? [] : ['img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)'];
}

function normalizeOddKernelSize(value) {
  const kernelSize = Number(value);

  if (!Number.isFinite(kernelSize) || kernelSize < 1) {
    return 5;
  }

  const roundedKernelSize = Math.round(kernelSize);
  return roundedKernelSize % 2 === 1 ? roundedKernelSize : roundedKernelSize + 1;
}

function clampByte(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.min(255, Math.max(0, Math.round(numberValue)));
}
