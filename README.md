<div align="center">

# 👁️ Opsis

**A browser-based image processing pipeline builder powered by OpenCV.js**

Upload an image, stack operations, tune parameters with live sliders, and get a copy-paste Python `cv2` script — all in the browser, no backend required.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-opsis--3sw.pages.dev-4f46e5?style=for-the-badge)](https://opsis-3sw.pages.dev/)
[![GitHub](https://img.shields.io/badge/GitHub-KakiManeesh%2Fopsis-181717?style=for-the-badge&logo=github)](https://github.com/KakiManeesh/opsis)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

</div>

---

## What it does

Opsis lets you build an OpenCV image-processing pipeline visually. Each operation you add is rendered live on a canvas and simultaneously translated into a Python `cv2` script. Copy the script, run it locally — the output matches what you saw in the browser.

> **Try it → [opsis-3sw.pages.dev](https://opsis-3sw.pages.dev/)**

---

## Features

- **16 built-in operations** — blur, edge detection, morphology, thresholding, colour transforms, and more
- **Real-time canvas preview** — updates on every parameter change
- **Three view modes** — Final result · Original · Side-by-side split
- **Step inspection** — click any pipeline card to preview the result at that exact stage
- **Python code generation** — complete `cv2` script in the footer, always in sync with the canvas
- **Per-step code snippet** — the right inspector shows the Python for just the selected step
- **Full step control** — reorder, duplicate, or delete any step
- **Pipeline import / export** — save pipelines as JSON and reload them later
- **Drag-and-drop image upload**
- **No backend** — OpenCV runs as WASM in the browser

---

## Supported operations

| # | Operation | Parameters |
|---|---|---|
| 1 | Grayscale | — |
| 2 | Rotate | 90° CW · 180° · 90° CCW |
| 3 | Gaussian Blur | Kernel size (odd, 1–31) |
| 4 | Median Blur | Kernel size (odd, 1–31) |
| 5 | Bilateral Filter | Diameter, sigma colour, sigma space |
| 6 | Anti-Alias Binary Edge | Blur kernel, threshold |
| 7 | Threshold | Threshold value, max value |
| 8 | Binary Inverse Threshold | Threshold value, max value |
| 9 | Canny Edge Detection | Low threshold, high threshold |
| 10 | Sharpen | Intensity (0.5–3.0) |
| 11 | Brightness / Contrast | Alpha (contrast), beta (brightness) |
| 12 | Erosion | Kernel size, iterations |
| 13 | Dilation | Kernel size, iterations |
| 14 | Opening | Kernel size, iterations |
| 15 | Closing | Kernel size, iterations |
| 16 | Histogram Equalization | — |

Operations can be stacked in any order and repeated.

---

## Example pipeline

The pipeline below removes noise, detects edges, and cleans them up with a morphological close. Opsis generates this Python script automatically as you build it in the UI.

```python
import cv2
import numpy as np

img = cv2.imread("photo.jpg")

# Reduce noise while preserving edges
img = cv2.bilateralFilter(img, 9, 75, 75)

# Convert to grayscale for edge detection
img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Detect edges
img = cv2.Canny(img, 50, 150)

# Close small gaps in the edges
kernel = np.ones((3, 3), np.uint8)
img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel, iterations=1)

cv2.imshow("output", img)
cv2.waitKey(0)
```

---

## How it works

Three modules, kept deliberately separate:

**`operationConfig.js`** — the single source of truth for all 16 operations. Defines labels, default parameters, field descriptors (sliders, selects, odd-kernel inputs), and the `normalizeOperationParams` function that clamps and validates every param. Used by both the processor and the code generator so the canvas and the Python output always agree.

**`processor.js`** — the only file that touches OpenCV.js. Loads the WASM module from the CDN, then executes each pipeline step using `cv.Mat` objects. Deletes every `Mat` after use.

**`codegen.js`** — a pure function that takes the pipeline array and returns a Python string. Tracks grayscale state across steps to avoid redundant `cvtColor` calls, and adds `import numpy as np` only when a step needs it.

**`App.jsx`** — coordinates state. The pipeline is an array of `{ id, type, params }` objects. A `useEffect` keyed on the active pipeline, image-loaded flag, and OpenCV status drives both the canvas render and the code generator on every change.

---

## Tech stack

| | |
|---|---|
| UI | React 18 |
| Build | Vite 5 |
| Image processing | OpenCV.js 4.x (WASM, loaded from CDN) |
| Styling | Vanilla CSS with custom properties |
| Language | JavaScript ES Modules |
| Tests | Vitest |
| Hosting | Cloudflare Pages |

Two production npm dependencies: `react` and `react-dom`.

---

## Run locally

**Prerequisites:** Node.js 18+ and npm

```bash
git clone https://github.com/KakiManeesh/opsis.git
cd opsis
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> **First-load note:** Opsis fetches OpenCV.js (~9 MB WASM) from the OpenCV CDN. The header shows **Loading…** until it's ready, then unlocks all controls. An internet connection is needed.

```bash
npm run dev       # dev server with HMR
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm test          # run unit tests
```

---

## Project structure

```
opsis/
├── src/
│   ├── App.jsx                 # State, layout, event handlers
│   ├── processor.js            # OpenCV.js loader + pipeline runner
│   ├── codegen.js              # Python code generator (pure function)
│   ├── operationConfig.js      # Operation registry + param normalisation
│   └── components/
│       ├── LeftPanel.jsx       # Sidebar: upload, pipeline, controls
│       ├── CenterCanvas.jsx    # Live canvas + view-mode toggle
│       ├── RightInspector.jsx  # Step params + per-step code snippet
│       └── FooterCode.jsx      # Collapsible generated code panel
└── src/tests/
    ├── operationConfig.test.js # Param normalisation tests
    ├── codegen.test.js         # Code generation tests
    └── pipeline.test.js        # Import/export validation tests
```

---

## Contributing

1. Fork and create a feature branch
2. `npm run dev` to verify locally, `npm test` to run the test suite
3. One feature or fix per PR — open an issue first for significant changes
4. Follow the existing style: JSDoc on exported functions, `Mat` cleanup in `finally` blocks

---

## License

[MIT](./LICENSE)
