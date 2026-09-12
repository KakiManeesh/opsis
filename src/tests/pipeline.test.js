import { describe, it, expect } from 'vitest';
import {
  serializePipelineForExport,
  parseImportedPipelinePayload
} from '../operationConfig.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeStep = (type, params = {}) => ({ id: `step-${type}`, type, params });

// ---------------------------------------------------------------------------
// serializePipelineForExport
// ---------------------------------------------------------------------------
describe('serializePipelineForExport', () => {
  it('returns an object with version 1 and a pipeline array', () => {
    const result = serializePipelineForExport([]);
    expect(result).toEqual({ version: 1, pipeline: [] });
  });

  it('strips internal step IDs from the exported payload', () => {
    const pipeline = [makeStep('grayscale')];
    const { pipeline: exported } = serializePipelineForExport(pipeline);
    expect(exported[0]).not.toHaveProperty('id');
  });

  it('normalizes params on export', () => {
    // Even if the pipeline has an out-of-range kernelSize it should be clamped
    const pipeline = [makeStep('gaussianBlur', { kernelSize: 4 })]; // 4 is even → should become 5
    const { pipeline: exported } = serializePipelineForExport(pipeline);
    expect(exported[0].params.kernelSize % 2).toBe(1);
  });

  it('preserves operation type', () => {
    const pipeline = [makeStep('canny', { lowThreshold: 50, highThreshold: 150 })];
    const { pipeline: exported } = serializePipelineForExport(pipeline);
    expect(exported[0].type).toBe('canny');
    expect(exported[0].params).toEqual({ lowThreshold: 50, highThreshold: 150 });
  });

  it('handles a multi-step pipeline', () => {
    const pipeline = [
      makeStep('grayscale'),
      makeStep('gaussianBlur', { kernelSize: 5 }),
      makeStep('canny', { lowThreshold: 100, highThreshold: 200 })
    ];
    const { pipeline: exported } = serializePipelineForExport(pipeline);
    expect(exported).toHaveLength(3);
    expect(exported.map((s) => s.type)).toEqual(['grayscale', 'gaussianBlur', 'canny']);
  });
});

// ---------------------------------------------------------------------------
// parseImportedPipelinePayload — valid inputs
// ---------------------------------------------------------------------------
describe('parseImportedPipelinePayload — valid payloads', () => {
  it('parses a minimal valid payload', () => {
    const payload = { version: 1, pipeline: [{ type: 'grayscale', params: {} }] };
    const result = parseImportedPipelinePayload(payload);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('grayscale');
    expect(result[0].params).toEqual({});
  });

  it('accepts a payload without a version field', () => {
    const payload = { pipeline: [{ type: 'gaussianBlur', params: { kernelSize: 7 } }] };
    const result = parseImportedPipelinePayload(payload);
    expect(result[0].type).toBe('gaussianBlur');
    expect(result[0].params.kernelSize).toBe(7);
  });

  it('normalizes imported params during parse', () => {
    const payload = {
      version: 1,
      pipeline: [{ type: 'gaussianBlur', params: { kernelSize: 4 } }] // even → 5
    };
    const result = parseImportedPipelinePayload(payload);
    expect(result[0].params.kernelSize).toBe(5);
  });

  it('accepts a step without a params field and fills defaults', () => {
    const payload = { version: 1, pipeline: [{ type: 'gaussianBlur' }] };
    const result = parseImportedPipelinePayload(payload);
    expect(result[0].params).toEqual({ kernelSize: 5 });
  });

  it('round-trips a pipeline through export then import', () => {
    const pipeline = [
      makeStep('grayscale'),
      makeStep('bilateralFilter', { diameter: 9, sigmaColor: 75, sigmaSpace: 75 }),
      makeStep('canny', { lowThreshold: 50, highThreshold: 150 })
    ];
    const exported = serializePipelineForExport(pipeline);
    const imported = parseImportedPipelinePayload(exported);

    expect(imported).toHaveLength(3);
    expect(imported[0].type).toBe('grayscale');
    expect(imported[1].type).toBe('bilateralFilter');
    expect(imported[2].type).toBe('canny');
    expect(imported[2].params).toEqual({ lowThreshold: 50, highThreshold: 150 });
  });
});

// ---------------------------------------------------------------------------
// parseImportedPipelinePayload — invalid inputs
// ---------------------------------------------------------------------------
describe('parseImportedPipelinePayload — invalid payloads', () => {
  it('throws when payload is not an object', () => {
    expect(() => parseImportedPipelinePayload('not an object')).toThrow();
    expect(() => parseImportedPipelinePayload(null)).toThrow();
    expect(() => parseImportedPipelinePayload(42)).toThrow();
  });

  it('throws when pipeline field is missing', () => {
    expect(() => parseImportedPipelinePayload({ version: 1 })).toThrow(/pipeline/i);
  });

  it('throws when pipeline field is not an array', () => {
    expect(() => parseImportedPipelinePayload({ version: 1, pipeline: 'nope' })).toThrow();
  });

  it('throws when version is unsupported', () => {
    expect(() => parseImportedPipelinePayload({ version: 99, pipeline: [] })).toThrow(/version/i);
  });

  it('throws when a step has an unknown operation type', () => {
    const payload = { version: 1, pipeline: [{ type: 'notReal', params: {} }] };
    expect(() => parseImportedPipelinePayload(payload)).toThrow(/notReal/);
  });

  it('throws when a step is not an object', () => {
    const payload = { version: 1, pipeline: ['grayscale'] };
    expect(() => parseImportedPipelinePayload(payload)).toThrow();
  });

  it('throws when a step has a non-object params field', () => {
    const payload = { version: 1, pipeline: [{ type: 'grayscale', params: 'bad' }] };
    expect(() => parseImportedPipelinePayload(payload)).toThrow(/params/i);
  });
});
