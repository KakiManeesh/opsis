# Visual Image Processing Pipeline App

A browser-based tool for building image-processing pipelines without writing any code. Upload a photo, chain together operations like blur, edge detection, or thresholding, watch the result update in real time, and read the equivalent Python OpenCV code that was generated automatically from your pipeline.

---

## Key Features

- **No-code pipeline builder** — select an operation, configure its parameters, and add it to a live, ordered pipeline
- **Side-by-side preview** — original and processed images are rendered on separate HTML5 canvases
- **Real-time processing** — the output canvas updates immediately after every pipeline change
- **Python code generation** — a `Generated Python Code` panel shows runnable `cv2` code that mirrors exactly what the browser is doing
- **Undo and reset** — remove the last step or clear the entire pipeline in one click
- **Runs entirely in the browser** — OpenCV.js is loaded from a CDN at runtime; no server, no backend

---

## Supported Operations

| Operation | Configurable Parameters |
|---|---|
| Grayscale | None |
| Gaussian Blur | Kernel size (3, 5, or 7) |
| Threshold | Threshold value (0–255) |
| Binary Inverse Threshold | Threshold value (0–255) |
| Canny Edge Detection | Threshold 1 and Threshold 2 (0–255 each) |
| Sharpen | None (fixed 3×3 kernel preset) |

Operations can be stacked in any order and the same operation can appear more than once in a pipeline.

---

## How It Works

The app is organised around three concerns that are kept deliberately separate:

**`processor.js`** — owns all OpenCV.js interactions. It handles loading the library from the CDN (with timeout and multiple readiness-detection strategies to cope with OpenCV's Emscripten quirks), draws the uploaded file onto the original canvas, and runs the pipeline step by step using OpenCV `Mat` objects. Every `Mat` is deleted after use to avoid memory leaks.

**`codegen.js`** — a pure function (`generatePythonCode`) that maps the same pipeline array to Python source code. It tracks grayscale state across steps so it only emits `cv2.cvtColor` conversions when actually needed, and only imports `numpy` when the sharpen operation is present.

**`App.jsx`** — coordinates state and side effects. It stores the pipeline as an array of `{ id, type, params }` objects. A single `useEffect` that depends on `[hasImage, openCvStatus, pipeline]` re-runs the processor and code generator whenever any of those change.

**Components:**

| File | Responsibility |
|---|---|
| `ImageUploader.jsx` | File input; forwards the `File` object to `App` |
| `ControlsPanel.jsx` | Operation selector, per-operation parameter controls, pipeline list, undo/reset buttons |
| `ImagePreview.jsx` | Thin wrapper that attaches a React ref to an HTML canvas |
| `CodePanel.jsx` | Renders the generated Python string inside a `<pre>` block |

---

## Tech Stack

- **React 18** — UI and state
- **Vite 5** — dev server and build tooling
- **OpenCV.js 4.x** — image processing (loaded from `docs.opencv.org` CDN)
- **Vanilla CSS** — layout and styling (no framework)
- **JavaScript (ES Modules)** — no TypeScript

---

## Getting Started

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <repo-directory>

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

> **Note:** The app fetches OpenCV.js (~9 MB) from the OpenCV CDN on first load. The header badge will read **Loading…** until the library is ready, at which point it switches to **OpenCV Ready** and the pipeline controls become active. An internet connection is required.

### Other scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with hot module replacement |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Serve the production build locally for a quick check |

---

## Project Structure

```
project-root/
├── index.html              # App shell; sets the page title
├── vite.config.js          # Vite config (React plugin only)
├── package.json
└── src/
    ├── main.jsx            # React root mount point
    ├── App.jsx             # Top-level state, effects, layout
    ├── App.css             # All styles; responsive grid breakpoint at 900px
    ├── processor.js        # OpenCV.js loading and pipeline execution
    ├── codegen.js          # Python code generation from pipeline array
    └── components/
        ├── ImageUploader.jsx   # File input component
        ├── ControlsPanel.jsx   # Pipeline builder UI and operation params
        ├── ImagePreview.jsx    # Canvas wrapper for image display
        └── CodePanel.jsx       # Generated code display
```

---

## Example User Flow

1. Open the app in a browser — wait for the **OpenCV Ready** badge.
2. Click **Upload Image** and choose a JPEG, PNG, or any browser-supported format.
3. The original image appears in the left canvas. The right canvas shows the same image (no operations yet).
4. In the sidebar, select **Gaussian Blur**, set the kernel size to `5`, and click **Add to Pipeline**. The processed canvas updates immediately.
5. Select **Canny Edge Detection**, set Threshold 1 to `100` and Threshold 2 to `200`, and add it. The canvases update again.
6. Scroll down to the **Generated Python Code** panel. You will see:
   ```python
   import cv2

   img = cv2.imread("image.jpg")
   img = cv2.GaussianBlur(img, (5, 5), 0)
   img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
   img = cv2.Canny(img, 100, 200)

   cv2.imshow("output", img)
   cv2.waitKey(0)
   ```
7. Copy the code, paste it into a local Python script, and run it — it will produce the same result.
8. Use **Undo Last Step** to remove Canny, or **Reset Pipeline** to start over.

---

## Current Limitations

- **No export** — there is no button to save the processed image or copy the generated code to the clipboard.
- **OpenCV.js bundle size** — the library is ~9 MB and must be downloaded fresh on each visit (not cached locally by the app).
- **Linear pipeline only** — operations are applied sequentially; branching or parallel paths are not supported.
- **Single image** — only one image can be loaded at a time.
- **No parameter editing after adding** — once a step is in the pipeline it cannot be changed in place; you must undo to the step and re-add it.
- **Sharpen has no parameters** — the kernel (`[0, -1, 0, -1, 5, -1, 0, -1, 0]`) is hardcoded.

---

## Roadmap

These are ideas for future work, not yet implemented:

- [ ] Download processed image as PNG
- [ ] Copy generated Python code to clipboard
- [ ] Edit parameters of an existing pipeline step in place
- [ ] Drag-and-drop to reorder pipeline steps
- [ ] Additional operations: Dilation, Erosion, Median Blur, Histogram Equalisation
- [ ] Configurable sharpen strength
- [ ] Persist pipeline to `localStorage` so it survives a page refresh
- [ ] Dark mode
- [ ] Generate code for additional languages (e.g., JavaScript with OpenCV.js)

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository and create a feature branch.
2. Run `npm run dev` and verify your changes work locally.
3. Keep changes focused — one feature or fix per pull request.
4. Follow the existing code style: JSDoc comments on exported functions, explicit parameter defaults, and `Mat` cleanup in `finally` blocks.

Please open an issue before starting significant work so the approach can be discussed first.

---

## License

This project does not yet have a license file. Until one is added, all rights are reserved by the author.
