# Opsis — Visual Image Processing Pipeline

A browser-based, no-code image processing pipeline builder. Upload an image, chain together OpenCV operations through a visual GUI, watch the result update live, and get a runnable Python `cv2` script generated automatically — no server, no backend, everything runs in the browser.

---

## Key Features

- **No-code pipeline builder** — select from 16 operations, configure parameters with sliders and dropdowns, and stack them into a live pipeline
- **Real-time preview** — the output canvas updates immediately after every change
- **Three view modes** — toggle between Final Result, Original, or Side-by-Side split view
- **Per-step inspection** — click any pipeline step to preview the intermediate result up to that point
- **Python code generation** — a collapsible footer panel shows a complete, runnable `cv2` script that mirrors exactly what the browser computed
- **Per-step code snippets** — the right inspector also shows the Python snippet for the selected step specifically
- **Step management** — reorder, duplicate, or delete any step in the pipeline
- **Undo & Reset** — remove the last step or clear the entire pipeline
- **Pipeline import / export** — save and load pipelines as JSON files
- **Drag-and-drop upload** — drop an image directly onto the canvas
- **Runs entirely in the browser** — OpenCV.js is loaded from a CDN; no server required

---

## Supported Operations (16)

| Operation | Configurable Parameters |
|---|---|
| Grayscale | None |
| Rotate Image | Rotation code (90° CW / 180° / 90° CCW) |
| Gaussian Blur | Kernel size (odd, 1–31) |
| Median Blur | Kernel size (odd, 1–31) |
| Bilateral Filter (Noise Reduction) | Diameter, sigma color, sigma space |
| Anti-Alias Binary Edge | Blur kernel, threshold value |
| Threshold | Threshold value, max value |
| Binary Inverse Threshold | Threshold value, max value |
| Canny Edge Detection | Low threshold, high threshold |
| Sharpen | Intensity (0.5–3.0) |
| Brightness / Contrast | Alpha (contrast), beta (brightness) |
| Erosion | Kernel size, iterations |
| Dilation | Kernel size, iterations |
| Opening | Kernel size, iterations |
| Closing | Kernel size, iterations |
| Histogram Equalization | None |

Operations can be stacked in any order and the same operation can appear multiple times.

---

## How It Works

The app is organised around three concerns kept deliberately separate:

**`processor.js`** — the only file that touches OpenCV.js. Handles loading the WASM module from the CDN (with three fallback strategies for the Emscripten initialization quirks and a 30-second timeout), then executes the pipeline by reading pixels into `cv.Mat` objects, running each step, and writing the result back to a canvas. Every `Mat` is deleted in `finally` blocks to prevent memory leaks.

**`codegen.js`** — a pure function (`generatePythonCode`) that takes the pipeline array and returns a Python string. It tracks grayscale state across steps to avoid emitting redundant `cvtColor` calls, adds `import numpy as np` only when an operation needs it, and exposes `generateStepSnippet` for per-step code in the inspector.

**`operationConfig.js`** — the single source of truth for all 16 operations: labels, default parameters, field definitions (sliders, selects, odd-kernel inputs), normalization/clamping logic, and display formatting. Both `processor.js` and `codegen.js` call `normalizeOperationParams` from here, ensuring the Python code always matches what OpenCV computed. Also provides `serializePipelineForExport` and `parseImportedPipelinePayload` for JSON pipeline I/O.

**`App.jsx`** — state hub. Stores the pipeline as an array of `{ id, type, params }` objects and coordinates rendering via a `useEffect` that re-runs whenever the active pipeline, image, or OpenCV status changes. The "active pipeline" is either the full pipeline or a slice up to the inspected step, enabling the intermediate preview mode.

---

## UI Layout

```
┌──────────────────────────────────────────────────────┐
│  HEADER — title, OpenCV status badge, image filename │
├──────────┬─────────────────────────┬─────────────────┤
│  LEFT    │    CENTER CANVAS        │  RIGHT          │
│  PANEL   │    (flexible width)     │  INSPECTOR      │
│  (280px) │                         │  (320px)        │
├──────────┴─────────────────────────┴─────────────────┤
│  FOOTER — collapsible generated Python code panel    │
└──────────────────────────────────────────────────────┘
```

| Panel | Contents |
|---|---|
| Left | Image upload, operation dropdown, Add Step button, pipeline step cards (reorder / duplicate / delete), Undo / Reset, JSON export / import |
| Center | Live canvas with view-mode toggle (Final / Original / Split); drag-and-drop target |
| Right Inspector | Parameter controls for the selected step (sliders, dropdowns), per-step Python snippet |
| Footer | Full generated Python script, collapsible |

---

## Tech Stack

- **React 18** — UI and state
- **Vite 5** — dev server and build tooling
- **OpenCV.js 4.x** — image processing (loaded from `docs.opencv.org` CDN at runtime)
- **Vanilla CSS** with CSS custom properties — layout and styling (no framework)
- **JavaScript (ES Modules)** — no TypeScript

Production dependencies: `react` and `react-dom` only.

---

## Getting Started

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone the repository
git clone https://github.com/KakiManeesh/opsis.git
cd opsis

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

> **Note:** The app fetches OpenCV.js (~9 MB) from the OpenCV CDN on first load. The header badge shows **Loading…** until the library is ready, then switches to **OpenCV Ready** and enables all pipeline controls. An internet connection is required.

### Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with hot module replacement |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |

---

## Project Structure

```
opsis/
├── index.html                  # App shell
├── vite.config.js              # Vite config (React plugin)
├── package.json
└── src/
    ├── main.jsx                # React root mount
    ├── App.jsx                 # Top-level state, effects, layout
    ├── App.css                 # Global styles
    ├── processor.js            # OpenCV.js loading + pipeline execution
    ├── codegen.js              # Python code generation
    ├── operationConfig.js      # Operation metadata, params, normalization
    └── components/
        ├── LeftPanel.jsx       # Pipeline builder sidebar
        ├── CenterCanvas.jsx    # Live canvas with view-mode toggle
        ├── RightInspector.jsx  # Per-step param controls + code snippet
        ├── FooterCode.jsx      # Collapsible Python code panel
        ├── ImageUploader.jsx   # File input component
        ├── ImagePreview.jsx    # Canvas wrapper
        └── CodePanel.jsx       # Code display block
```

---

## Example User Flow

1. Open the app — wait for the **OpenCV Ready** badge in the header.
2. Click **Upload Image** (or drag a file onto the canvas) and choose any browser-supported image.
3. Select **Gaussian Blur**, set the kernel to `5`, and click **Add Step**. The canvas updates instantly.
4. Select **Canny Edge Detection**, set Low to `100` and High to `200`, and add it.
5. Click the Canny step card in the left panel — the right inspector shows its parameters and the partial Python snippet. The canvas shows the result only up to that step.
6. Open the footer to see the full generated Python script:
   ```python
   import cv2

   img = cv2.imread("image.jpg")
   img = cv2.GaussianBlur(img, (5, 5), 0)
   img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
   img = cv2.Canny(img, 100, 200)

   cv2.imshow("output", img)
   cv2.waitKey(0)
   ```
7. Use the export button to save the pipeline as JSON and reload it later.

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a feature branch.
2. Run `npm run dev` and verify your changes locally.
3. Keep changes focused — one feature or fix per pull request.
4. Follow the existing code style: JSDoc comments on exported functions, explicit parameter defaults, and `Mat` cleanup in `finally` blocks.

Open an issue before starting significant work so the approach can be discussed first.

---

## License

This project does not yet have a license file. Until one is added, all rights are reserved by the author.
