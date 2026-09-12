import { describe, it, expect } from 'vitest';
import {
  normalizeOperationParams,
  isKnownOperationType,
  createDefaultParams,
  formatOperationParams
} from '../operationConfig.js';

// ---------------------------------------------------------------------------
// isKnownOperationType
// ---------------------------------------------------------------------------
describe('isKnownOperationType', () => {
  it('returns true for every registered operation', () => {
    const knownTypes = [
      'grayscale', 'rotateImage', 'bilateralFilter', 'antiAliasBinary',
      'gaussianBlur', 'medianBlur', 'threshold', 'binaryInverseThreshold',
      'canny', 'sharpen', 'brightnessContrast', 'erosion', 'dilation',
      'opening', 'closing', 'histogramEqualisation'
    ];
    for (const type of knownTypes) {
      expect(isKnownOperationType(type), type).toBe(true);
    }
  });

  it('returns false for unknown types', () => {
    expect(isKnownOperationType('unknown')).toBe(false);
    expect(isKnownOperationType('')).toBe(false);
    expect(isKnownOperationType(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createDefaultParams
// ---------------------------------------------------------------------------
describe('createDefaultParams', () => {
  it('returns empty object for grayscale', () => {
    expect(createDefaultParams('grayscale')).toEqual({});
  });

  it('returns correct defaults for gaussianBlur', () => {
    expect(createDefaultParams('gaussianBlur')).toEqual({ kernelSize: 5 });
  });

  it('returns correct defaults for canny', () => {
    expect(createDefaultParams('canny')).toEqual({ lowThreshold: 100, highThreshold: 200 });
  });

  it('returns empty object for unknown type', () => {
    expect(createDefaultParams('notReal')).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// normalizeOperationParams — return value shape
// ---------------------------------------------------------------------------
describe('normalizeOperationParams', () => {
  it('returns null for an unknown type', () => {
    expect(normalizeOperationParams('notAnOp', {})).toBeNull();
  });

  it('returns empty object for grayscale regardless of input', () => {
    expect(normalizeOperationParams('grayscale', { anything: 99 })).toEqual({});
  });

  it('returns empty object for histogramEqualisation', () => {
    expect(normalizeOperationParams('histogramEqualisation', {})).toEqual({});
  });

  // gaussianBlur — kernelOdd normalisation
  it('gaussianBlur: clamps kernel to default when given a string', () => {
    const result = normalizeOperationParams('gaussianBlur', { kernelSize: 'abc' });
    expect(result.kernelSize).toBe(5); // falls back to default
  });

  it('gaussianBlur: rounds even kernel up to next odd number', () => {
    const result = normalizeOperationParams('gaussianBlur', { kernelSize: 4 });
    expect(result.kernelSize % 2).toBe(1); // must be odd
    expect(result.kernelSize).toBe(5);
  });

  it('gaussianBlur: accepts a valid odd kernel', () => {
    const result = normalizeOperationParams('gaussianBlur', { kernelSize: 7 });
    expect(result.kernelSize).toBe(7);
  });

  it('gaussianBlur: clamps above max (31)', () => {
    const result = normalizeOperationParams('gaussianBlur', { kernelSize: 99 });
    expect(result.kernelSize).toBeLessThanOrEqual(31);
    expect(result.kernelSize % 2).toBe(1);
  });

  // canny — range and swap
  it('canny: keeps valid thresholds as-is', () => {
    const result = normalizeOperationParams('canny', { lowThreshold: 50, highThreshold: 150 });
    expect(result).toEqual({ lowThreshold: 50, highThreshold: 150 });
  });

  it('canny: swaps thresholds when low > high', () => {
    const result = normalizeOperationParams('canny', { lowThreshold: 200, highThreshold: 50 });
    expect(result.lowThreshold).toBeLessThanOrEqual(result.highThreshold);
  });

  it('canny: clamps values to [0, 255]', () => {
    const result = normalizeOperationParams('canny', { lowThreshold: -10, highThreshold: 300 });
    expect(result.lowThreshold).toBeGreaterThanOrEqual(0);
    expect(result.highThreshold).toBeLessThanOrEqual(255);
  });

  // sharpen — float normalisation
  it('sharpen: clamps intensity below min to 0.5', () => {
    const result = normalizeOperationParams('sharpen', { intensity: 0.1 });
    expect(result.intensity).toBe(0.5);
  });

  it('sharpen: clamps intensity above max to 3.0', () => {
    const result = normalizeOperationParams('sharpen', { intensity: 10 });
    expect(result.intensity).toBe(3.0);
  });

  it('sharpen: accepts a valid intensity', () => {
    const result = normalizeOperationParams('sharpen', { intensity: 1.5 });
    expect(result.intensity).toBe(1.5);
  });

  // rotateImage — select field
  it('rotateImage: accepts valid rotation codes 0, 1, 2', () => {
    expect(normalizeOperationParams('rotateImage', { rotationCode: 0 })).toEqual({ rotationCode: 0 });
    expect(normalizeOperationParams('rotateImage', { rotationCode: 1 })).toEqual({ rotationCode: 1 });
    expect(normalizeOperationParams('rotateImage', { rotationCode: 2 })).toEqual({ rotationCode: 2 });
  });

  it('rotateImage: clamps out-of-range code to default', () => {
    const result = normalizeOperationParams('rotateImage', { rotationCode: 5 });
    expect(result.rotationCode).toBeGreaterThanOrEqual(0);
    expect(result.rotationCode).toBeLessThanOrEqual(2);
  });

  // brightnessContrast
  it('brightnessContrast: clamps beta to [-100, 100]', () => {
    const result = normalizeOperationParams('brightnessContrast', { alpha: 1.0, beta: 999 });
    expect(result.beta).toBe(100);
  });

  it('brightnessContrast: clamps non-finite alpha to default, integer-rounds beta', () => {
    // undefined is non-finite → falls back to default (1.0)
    // null coerces to 0 via Number(null), which is finite but below min 0.5 → clamped to 0.5
    const resultUndefined = normalizeOperationParams('brightnessContrast', { alpha: undefined, beta: undefined });
    expect(resultUndefined.alpha).toBe(1.0);
    expect(resultUndefined.beta).toBe(0);

    const resultNull = normalizeOperationParams('brightnessContrast', { alpha: null, beta: null });
    expect(resultNull.alpha).toBe(0.5); // Number(null)=0, clamped up to min
    expect(resultNull.beta).toBe(0);    // Number(null)=0, within [-100,100]
  });

  // erosion / dilation / opening / closing — integer fields
  it.each(['erosion', 'dilation', 'opening', 'closing'])(
    '%s: returns valid kernelSize and iterations',
    (type) => {
      const result = normalizeOperationParams(type, { kernelSize: 5, iterations: 3 });
      expect(result).toEqual({ kernelSize: 5, iterations: 3 });
    }
  );

  it('erosion: clamps iterations above max to 10', () => {
    const result = normalizeOperationParams('erosion', { kernelSize: 3, iterations: 99 });
    expect(result.iterations).toBe(10);
  });

  // handles missing params by using defaults
  it('uses defaults when params object is empty', () => {
    const result = normalizeOperationParams('bilateralFilter', {});
    expect(result).toEqual({ diameter: 9, sigmaColor: 75, sigmaSpace: 75 });
  });

  it('uses defaults when rawParams is not a plain object', () => {
    const result = normalizeOperationParams('gaussianBlur', null);
    expect(result).toEqual({ kernelSize: 5 });
  });
});

// ---------------------------------------------------------------------------
// formatOperationParams
// ---------------------------------------------------------------------------
describe('formatOperationParams', () => {
  it('formats gaussianBlur correctly', () => {
    expect(formatOperationParams('gaussianBlur', { kernelSize: 7 })).toBe('kernel 7');
  });

  it('formats canny correctly', () => {
    expect(formatOperationParams('canny', { lowThreshold: 100, highThreshold: 200 }))
      .toBe('low 100, high 200');
  });

  it('formats rotateImage for each code', () => {
    expect(formatOperationParams('rotateImage', { rotationCode: 0 })).toBe('90° CW');
    expect(formatOperationParams('rotateImage', { rotationCode: 1 })).toBe('180°');
    expect(formatOperationParams('rotateImage', { rotationCode: 2 })).toBe('90° CCW');
  });

  it('returns empty string for grayscale (no params)', () => {
    expect(formatOperationParams('grayscale', {})).toBe('');
  });

  it('returns empty string for unknown type', () => {
    expect(formatOperationParams('notReal', {})).toBe('');
  });
});
