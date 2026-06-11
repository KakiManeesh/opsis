const OPERATION_DEFINITIONS = {
  grayscale: {
    label: 'Grayscale',
    defaults: {},
    fields: []
  },
  rotateImage: {
    label: 'Rotate Image',
    defaults: { rotationCode: 0 },
    fields: [
      {
        name: 'rotationCode',
        label: 'Rotation',
        kind: 'select',
        options: [
          { label: '90° CW', value: 0 },
          { label: '180°', value: 1 },
          { label: '90° CCW', value: 2 }
        ]
      }
    ]
  },
  gaussianBlur: {
    label: 'Blur',
    defaults: { kernelSize: 5 },
    fields: [{ name: 'kernelSize', label: 'Kernel Size', kind: 'kernelOdd', min: 1, max: 31, step: 1 }]
  },
  threshold: {
    label: 'Threshold',
    defaults: { thresholdValue: 127, maxValue: 255 },
    fields: [
      { name: 'thresholdValue', label: 'Threshold Value', kind: 'int', min: 0, max: 255, step: 1 },
      { name: 'maxValue', label: 'Max Value', kind: 'int', min: 0, max: 255, step: 1 }
    ]
  },
  binaryInverseThreshold: {
    label: 'Binary Inverse Threshold',
    defaults: { thresholdValue: 127, maxValue: 255 },
    fields: [
      { name: 'thresholdValue', label: 'Threshold Value', kind: 'int', min: 0, max: 255, step: 1 },
      { name: 'maxValue', label: 'Max Value', kind: 'int', min: 0, max: 255, step: 1 }
    ]
  },
  canny: {
    label: 'Canny Edge Detection',
    defaults: { lowThreshold: 100, highThreshold: 200 },
    fields: [
      { name: 'lowThreshold', label: 'Low Threshold', kind: 'int', min: 0, max: 255, step: 1 },
      { name: 'highThreshold', label: 'High Threshold', kind: 'int', min: 0, max: 255, step: 1 }
    ]
  },
  sharpen: {
    label: 'Sharpen',
    defaults: { intensity: 1.0 },
    fields: [{ name: 'intensity', label: 'Intensity', kind: 'float', min: 0.5, max: 3.0, step: 0.1 }]
  },
  medianBlur: {
    label: 'Median Blur',
    defaults: { kernelSize: 3 },
    fields: [{ name: 'kernelSize', label: 'Kernel Size', kind: 'kernelOdd', min: 1, max: 31, step: 1 }]
  },
  erosion: {
    label: 'Erosion',
    defaults: { kernelSize: 3, iterations: 1 },
    fields: [
      { name: 'kernelSize', label: 'Kernel Size', kind: 'int', min: 1, max: 15, step: 1 },
      { name: 'iterations', label: 'Iterations', kind: 'int', min: 1, max: 10, step: 1 }
    ]
  },
  dilation: {
    label: 'Dilation',
    defaults: { kernelSize: 3, iterations: 1 },
    fields: [
      { name: 'kernelSize', label: 'Kernel Size', kind: 'int', min: 1, max: 15, step: 1 },
      { name: 'iterations', label: 'Iterations', kind: 'int', min: 1, max: 10, step: 1 }
    ]
  },
  opening: {
    label: 'Opening',
    defaults: { kernelSize: 3, iterations: 1 },
    fields: [
      { name: 'kernelSize', label: 'Kernel Size', kind: 'int', min: 1, max: 15, step: 1 },
      { name: 'iterations', label: 'Iterations', kind: 'int', min: 1, max: 10, step: 1 }
    ]
  },
  closing: {
    label: 'Closing',
    defaults: { kernelSize: 3, iterations: 1 },
    fields: [
      { name: 'kernelSize', label: 'Kernel Size', kind: 'int', min: 1, max: 15, step: 1 },
      { name: 'iterations', label: 'Iterations', kind: 'int', min: 1, max: 10, step: 1 }
    ]
  },
  histogramEqualisation: {
    label: 'Histogram Equalization',
    defaults: {},
    fields: []
  },
  brightnessContrast: {
    label: 'Brightness/Contrast',
    defaults: { alpha: 1.0, beta: 0 },
    fields: [
      { name: 'alpha', label: 'Alpha', kind: 'float', min: 0.5, max: 3.0, step: 0.1 },
      { name: 'beta', label: 'Beta', kind: 'int', min: -100, max: 100, step: 1 }
    ]
  }
};

const OPERATION_ORDER = [
  'grayscale',
  'rotateImage',
  'gaussianBlur',
  'medianBlur',
  'threshold',
  'binaryInverseThreshold',
  'canny',
  'sharpen',
  'brightnessContrast',
  'erosion',
  'dilation',
  'opening',
  'closing',
  'histogramEqualisation'
];

export const OPERATION_OPTIONS = OPERATION_ORDER.map((type) => ({
  type,
  label: OPERATION_DEFINITIONS[type].label
}));

export function isKnownOperationType(type) {
  return Object.prototype.hasOwnProperty.call(OPERATION_DEFINITIONS, type);
}

export function getOperationDefinition(type) {
  return OPERATION_DEFINITIONS[type] ?? null;
}

export function createDefaultParams(type) {
  const definition = getOperationDefinition(type);
  return definition ? { ...definition.defaults } : {};
}

export function createOperationParamsMap() {
  return OPERATION_ORDER.reduce((accumulator, type) => {
    accumulator[type] = createDefaultParams(type);
    return accumulator;
  }, {});
}

export function normalizeOperationParams(type, rawParams = {}) {
  if (!isKnownOperationType(type)) {
    return null;
  }

  const params = isPlainObject(rawParams) ? rawParams : {};

  switch (type) {
    case 'grayscale':
    case 'histogramEqualisation':
      return {};
    case 'rotateImage':
      return {
        rotationCode: normalizeInteger(params.rotationCode, 0, 2, getDefault(type, 'rotationCode'))
      };
    case 'gaussianBlur':
    case 'medianBlur':
      return {
        kernelSize: normalizeOddKernelSize(params.kernelSize, getDefault(type, 'kernelSize'))
      };
    case 'threshold':
    case 'binaryInverseThreshold':
      return {
        thresholdValue: normalizeInteger(params.thresholdValue, 0, 255, getDefault(type, 'thresholdValue')),
        maxValue: normalizeInteger(params.maxValue, 0, 255, getDefault(type, 'maxValue'))
      };
    case 'canny': {
      const lowThreshold = normalizeInteger(
        params.lowThreshold ?? params.threshold1,
        0,
        255,
        getDefault(type, 'lowThreshold')
      );
      const highThreshold = normalizeInteger(
        params.highThreshold ?? params.threshold2,
        0,
        255,
        getDefault(type, 'highThreshold')
      );

      return lowThreshold <= highThreshold
        ? { lowThreshold, highThreshold }
        : { lowThreshold: highThreshold, highThreshold: lowThreshold };
    }
    case 'sharpen':
      return {
        intensity: normalizeFloat(params.intensity, 0.5, 3.0, getDefault(type, 'intensity'))
      };
    case 'brightnessContrast':
      return {
        alpha: normalizeFloat(params.alpha, 0.5, 3.0, getDefault(type, 'alpha')),
        beta: normalizeInteger(params.beta, -100, 100, getDefault(type, 'beta'))
      };
    case 'erosion':
    case 'dilation':
    case 'opening':
    case 'closing':
      return {
        kernelSize: normalizeInteger(params.kernelSize, 1, 15, getDefault(type, 'kernelSize')),
        iterations: normalizeInteger(params.iterations, 1, 10, getDefault(type, 'iterations'))
      };
    default:
      return null;
  }
}

export function formatOperationParams(type, params = {}) {
  const normalizedParams = normalizeOperationParams(type, params);

  if (!normalizedParams) {
    return '';
  }

  switch (type) {
    case 'gaussianBlur':
    case 'medianBlur':
      return `kernel ${normalizedParams.kernelSize}`;
    case 'rotateImage':
      return normalizedParams.rotationCode === 0
        ? '90° CW'
        : normalizedParams.rotationCode === 1
          ? '180°'
          : '90° CCW';
    case 'threshold':
    case 'binaryInverseThreshold':
      return `threshold ${normalizedParams.thresholdValue}, max ${normalizedParams.maxValue}`;
    case 'canny':
      return `low ${normalizedParams.lowThreshold}, high ${normalizedParams.highThreshold}`;
    case 'sharpen':
      return `intensity ${formatFloat(normalizedParams.intensity)}`;
    case 'brightnessContrast':
      return `alpha ${formatFloat(normalizedParams.alpha)}, beta ${normalizedParams.beta}`;
    case 'erosion':
    case 'dilation':
    case 'opening':
    case 'closing':
      return `kernel ${normalizedParams.kernelSize}, iterations ${normalizedParams.iterations}`;
    default:
      return '';
  }
}

export function serializePipelineForExport(pipeline) {
  return {
    version: 1,
    pipeline: pipeline.map((step) => ({
      type: step.type,
      params: normalizeOperationParams(step.type, step.params) ?? {}
    }))
  };
}

export function parseImportedPipelinePayload(payload) {
  if (!isPlainObject(payload)) {
    throw new Error('Imported JSON must be an object.');
  }

  if (payload.version !== undefined && payload.version !== 1) {
    throw new Error('Unsupported pipeline version.');
  }

  if (!Array.isArray(payload.pipeline)) {
    throw new Error('Imported JSON must contain a pipeline array.');
  }

  return payload.pipeline.map((step, index) => parseImportedStep(step, index));
}

function parseImportedStep(step, index) {
  if (!isPlainObject(step)) {
    throw new Error(`Pipeline step ${index + 1} is invalid.`);
  }

  if (!isKnownOperationType(step.type)) {
    throw new Error(`Unsupported pipeline operation: ${step.type}`);
  }

  if (step.params !== undefined && !isPlainObject(step.params)) {
    throw new Error(`Pipeline step ${index + 1} has invalid params.`);
  }

  return {
    type: step.type,
    params: normalizeOperationParams(step.type, step.params ?? {}) ?? {}
  };
}

function normalizeOddKernelSize(value, fallback) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  let kernelSize = Math.round(numericValue);
  kernelSize = clampInteger(kernelSize, 1, 31, fallback);

  if (kernelSize % 2 === 0) {
    kernelSize = kernelSize < 31 ? kernelSize + 1 : kernelSize - 1;
  }

  return clampInteger(kernelSize, 1, 31, fallback);
}

function normalizeInteger(value, min, max, fallback) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return clampInteger(Math.round(numericValue), min, max, fallback);
}

function normalizeFloat(value, min, max, fallback) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return clampFloat(numericValue, min, max, fallback);
}

function clampInteger(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampFloat(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function formatFloat(value) {
  return Number(value).toFixed(1);
}

function getDefault(type, key) {
  return OPERATION_DEFINITIONS[type]?.defaults?.[key];
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
