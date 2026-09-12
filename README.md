<div align="center">

# 👁️ Opsis

### Visual Image Processing Pipeline — in the Browser

**Build OpenCV pipelines without writing a single line of code.**  
Stack operations, tweak parameters with live sliders, and get a copy-paste Python script — instantly.

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-opsis--3sw.pages.dev-4f46e5?style=for-the-badge)](https://opsis-3sw.pages.dev/)
[![GitHub](https://img.shields.io/badge/GitHub-KakiManeesh%2Fopsis-181717?style=for-the-badge&logo=github)](https://github.com/KakiManeesh/opsis)
[![Built with React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![OpenCV.js](https://img.shields.io/badge/OpenCV.js-4.x-5c3317?style=for-the-badge)](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html)

</div>

---

## ✨ What is Opsis?

Opsis is a **browser-based, no-code image processing playground**. Upload any image, visually chain together 16 OpenCV operations, and watch the result render in real time — all without leaving your browser.

The best part? Every pipeline you build is simultaneously compiled into a **complete, runnable Python `cv2` script** that you can drop straight into your own project. No gap between what you see and what the code does.

> 🔗 **Try it live → [opsis-3sw.pages.dev](https://opsis-3sw.pages.dev/)**  
> No install. No sign-up. Just open and go.

---

## 🎬 How It Works — 60 seconds

```
1. Upload an image  →  drag & drop or click to browse
2. Add operations   →  pick from 16 filters & transforms
3. Tune params      →  live sliders update the canvas instantly
4. Inspect steps    →  click any step to preview mid-pipeline
5. Copy the code    →  full Python cv2 script is ready in the footer
6. Save your work   →  export the pipeline as JSON, import it later
```

---

## 🔧 Features

| Feature | Details |
|---|---|
| **16 built-in operations** | Blur, edge detection, morphology, color transforms, and more |
| **Real-time canvas preview** | Result updates on every slider move or parameter change |
| **3 view modes** | Final result · Original · Side-by-side split |
| **Step inspection mode** | Click any pipeline card to preview the result at that exact stage |
| **Python code generation** | Complete `cv2` script, always in sync with what the browser computed |
| **Per-step code snippets** | Right inspector shows the Python snippet for the selected step |
| **Step management** | Reorder ↑↓, duplicate, delete — any step, any time |
| **Pipeline import / export** | Save pipelines as JSON and reload them later |
| **Drag-and-drop upload** | Drop images directly onto the canvas |
| **Zero backend** | OpenCV runs as WASM in the browser — fully offline once loaded |

---

## ⚙️ Supported Operations (16)

| # | Operation | Parameters |
|---|---|---|
| 1 | **Grayscale** | — |
| 2 | **Rotate** | 90° CW · 180° · 90° CCW |
| 3 | **Gaussian Blur** | Kernel size (odd, 1–31) |
| 4 | **Median Blur** | Kernel size (odd, 1–31) |
| 5 | **Bilateral Filter** | Diameter, sigma color, sigma space |
| 6 | **Anti-Alias Binary Edge** | Blur kernel, threshold |
| 7 | **Threshold** | Threshold value, max value |
| 8 | **Binary Inverse Threshold** | Threshold value, max value |
| 9 | **Canny Edge Detection** | Low threshold, high threshold |
| 10 | **Sharpen** | Intensity (0.5 – 3.0) |
| 11 | **Brightness / Contrast** | Alpha (contrast), beta (brightness) |
| 12 | **Erosion** | Kernel size, iterations |
| 13 | **Dilation** | Kernel size, iterations |
| 14 | **Opening** | Kernel size, iterations |
| 15 | **Closing** | Kernel size, iterations |
| 16 | **Histogram Equalization** | — |

Every operation can be stacked multiple times, in any order.

---

## 🏗️ Architecture

Three concerns, kept deliberately separate — no operation logic leaks into the UI, and no UI logic leaks into code generation.

```
┌─────────────────────────────────────────────────────────┐
│  App.jsx  —  state hub, pipeline array, useEffect loop  │
└───────────────┬─────────────────────┬───────────────────┘
                ▼                     ▼
        processor.js            codegen.js
   (OpenCV.js execution)   (Python string output)
                │                     │
                └──────────┬──────────┘
                           ▼
                  operationConfig.js
          (single source of truth for all ops)
```

**`processor.js`** — the only file that touches OpenCV. Loads the WASM module from CDN with three fallback strategies for Emscripten's initialization quirks. Executes the pipeline step by step using `cv.Mat` objects. Every `Mat` is deleted in `finally` blocks — no memory leaks.

**`codegen.js`** — a pure function. Takes the pipeline array, returns a Python string. Tracks grayscale state across steps so it only emits `cvtColor` when actually needed, and only adds `import numpy as np` when the pipeline requires it.

**`operationConfig.js`** — the registry for all 16 operations: labels, defaults, field descriptors (sliders, selects, odd-kernel inputs), normalization logic, and display formatting. Both `processor.js` and `codegen.js` call `normalizeOperationParams` from here — guaranteeing the Python code always matches what OpenCV computed.

---

## 🖥️ UI Layout

```
┌──────────────────────────────────────────────────────┐
│  HEADER  —  title · OpenCV status badge · filename   │
├──────────┬─────────────────────────┬─────────────────┤
│  LEFT    │    CENTER CANVAS        │  RIGHT          │
│  PANEL   │    view-mode toggle     │  INSPECTOR      │
│  280 px  │    drag & drop target   │  320 px         │
├──────────┴─────────────────────────┴─────────────────┤
│  FOOTER  —  collapsible Python code panel            │
└──────────────────────────────────────────────────────┘
```

| Zone | What's inside |
|---|---|
| **Left** | Upload · operation picker · Add Step · pipeline cards (reorder / duplicate / delete) · Undo / Reset · JSON export/import |
| **Center** | Live canvas · Final / Original / Split toggle |
| **Right Inspector** | Parameter sliders & dropdowns · per-step Python snippet |
| **Footer** | Full generated Python script |

---

## 🚀 Run Locally

**Prerequisites:** Node.js 18+ and npm

```bash
git clone https://github.com/KakiManeesh/opsis.git
cd opsis
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **First load note:** Opsis fetches OpenCV.js (~9 MB WASM) from the OpenCV CDN. The header badge shows **Loading…** until it's ready, then unlocks all controls. An internet connection is needed for the initial load.

| Script | Action |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |

---

## 📁 Project Structure

```
opsis/
├── index.html                  # App shell
├── vite.config.js              # Vite + React plugin
├── package.json
└── src/
    ├── main.jsx                # React root
    ├── App.jsx                 # State, effects, layout
    ├── App.css                 # Global styles (CSS custom properties)
    ├── processor.js            # OpenCV.js loader + pipeline runner
    ├── codegen.js              # Python code generator
    ├── operationConfig.js      # Operation registry + param normalization
    └── components/
        ├── LeftPanel.jsx       # Sidebar: upload, pipeline, controls
        ├── CenterCanvas.jsx    # Live canvas + view-mode toggle
        ├── RightInspector.jsx  # Step params + code snippet
        ├── FooterCode.jsx      # Collapsible code panel
        ├── ImageUploader.jsx   # File input
        ├── ImagePreview.jsx    # Canvas wrapper
        └── CodePanel.jsx       # Code display block
```

---

## 💡 Example Pipeline

Build this in Opsis, then run the generated code locally:

```python
import cv2

img = cv2.imread("photo.jpg")

# Step 1 — soften noise before edge detection
img = cv2.GaussianBlur(img, (5, 5), 0)

# Step 2 — convert to grayscale (required by Canny)
img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Step 3 — detect edges
img = cv2.Canny(img, 100, 200)

cv2.imshow("output", img)
cv2.waitKey(0)
```

Opsis generated every line of that automatically.

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| UI & state | React 18 |
| Build | Vite 5 |
| Image processing | OpenCV.js 4.x (WASM, CDN) |
| Styling | Vanilla CSS + custom properties |
| Language | JavaScript ES Modules |
| Hosting | Cloudflare Pages |

Zero UI framework. Two production npm dependencies (`react`, `react-dom`).

---

## 🤝 Contributing

Contributions are welcome.

1. Fork and create a feature branch
2. `npm run dev` — verify locally
3. One feature or fix per PR
4. Follow existing code style: JSDoc on exports, `Mat` cleanup in `finally` blocks

Open an issue before tackling anything large so we can align on approach first.

---

## 📄 License

No license file yet — all rights reserved by the author until one is added.
