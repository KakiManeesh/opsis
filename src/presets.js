/**
 * presets.js
 *
 * Built-in pipeline presets. Each preset uses only existing operations
 * defined in operationConfig.js — no new OpenCV ops are introduced.
 *
 * Structure mirrors the pipeline array in App.jsx:
 *   [{ type: string, params: object }]   (no id — App assigns those on load)
 */

export const PRESETS = [
  {
    id: 'cartoonify',
    label: 'Cartoonify',
    description: 'Bold edges over a smoothed, colour-preserved base',
    steps: [
      { type: 'bilateralFilter', params: { diameter: 9,  sigmaColor: 75, sigmaSpace: 75 } },
      { type: 'bilateralFilter', params: { diameter: 9,  sigmaColor: 75, sigmaSpace: 75 } },
      { type: 'bilateralFilter', params: { diameter: 9,  sigmaColor: 75, sigmaSpace: 75 } },
      { type: 'sharpen',         params: { intensity: 1.5 } }
    ]
  },
  {
    id: 'oldPhotoRestore',
    label: 'Old Photo Restore',
    description: 'Soften grain, boost contrast, equalise tones',
    steps: [
      { type: 'medianBlur',          params: { kernelSize: 3 } },
      { type: 'brightnessContrast',  params: { alpha: 1.3, beta: 10 } },
      { type: 'histogramEqualisation', params: {} }
    ]
  },
  {
    id: 'pencilSketch',
    label: 'Pencil Sketch',
    description: 'Clean pencil-line look via edge inversion',
    steps: [
      { type: 'grayscale',     params: {} },
      { type: 'gaussianBlur',  params: { kernelSize: 21 } },
      { type: 'sharpen',       params: { intensity: 2.0 } },
      { type: 'canny',         params: { lowThreshold: 30, highThreshold: 80 } }
    ]
  },
  {
    id: 'documentScanner',
    label: 'Document Scanner',
    description: 'High-contrast black-and-white scan look',
    steps: [
      { type: 'bilateralFilter',     params: { diameter: 5, sigmaColor: 50, sigmaSpace: 50 } },
      { type: 'brightnessContrast',  params: { alpha: 1.4, beta: 20 } },
      { type: 'antiAliasBinary',     params: { blurKernel: 5, thresholdValue: 140 } }
    ]
  }
];
