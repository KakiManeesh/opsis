---
status: resolved
trigger: "Problem: The app UI loads, but OpenCV never becomes ready. The status badge stays stuck on Loading..., and operation controls remain disabled. Need debug/fix OpenCV initialization flow in src/processor.js with smallest possible focused change."
created: 2026-06-09T00:00:00.000Z
updated: 2026-06-09T00:30:00.000Z
---

## Current Focus

hypothesis: Fix verified by static checks/build; browser should now transition to ready once OpenCV emits readiness through immediate API detection, cv.then, or onRuntimeInitialized fallback.
test: Browser console/network verification by user.
expecting: Console shows [OpenCV] script load/readiness path and status badge changes to OpenCV Ready, or shows a useful timeout/load error.
next_action: report debug complete and browser checks

## Symptoms

expected: Status badge transitions from Loading... to OpenCV Ready when OpenCV.js is usable, enabling operation controls after image upload.
actual: Status badge stays on Loading..., and operation controls remain disabled.
errors: No specific error reported by user.
reproduction: Load the app UI; observe OpenCV status never reaches ready.
started: Unknown.

## Eliminated

## Evidence

- timestamp: 2026-06-09T00:05:00.000Z
  checked: src/processor.js loadOpenCv implementation
  found: Loader resolves only when window.cv.Mat is already a function or when window.cv.onRuntimeInitialized fires after script onload. It has no timeout and no Promise-like cv handling.
  implication: If OpenCV.js exposes cv as a Promise/module-like object, or if runtime initialization happens before the callback is attached but before Mat is present, the app can remain in loading indefinitely.

- timestamp: 2026-06-09T00:05:00.000Z
  checked: src/App.jsx OpenCV status flow
  found: App sets status to ready only when loadOpenCv resolves, and error only when it rejects.
  implication: A pending loadOpenCv promise exactly matches the reported UI: status remains Loading... and controls stay disabled.

- timestamp: 2026-06-09T00:12:00.000Z
  checked: https://docs.opencv.org/4.x/opencv.js redirect and final script
  found: 4.x redirects to https://docs.opencv.org/4.13.0/opencv.js. The final script assigns root.cv = factory(), exposes Module.then(func), and Module.then invokes func immediately if calledRun is true or wires onRuntimeInitialized otherwise.
  implication: The current script URL is valid, but the current loader ignores the robust thenable/module readiness path that the OpenCV build provides.

- timestamp: 2026-06-09T00:12:00.000Z
  checked: Current attachRuntimeReadyHandler timing
  found: It overwrites window.cv.onRuntimeInitialized only after script onload and has no fallback timeout.
  implication: If runtime initialization completes before this assignment, or if the callback path differs, the promise can stay pending forever with no user-visible error.

- timestamp: 2026-06-09T00:18:00.000Z
  checked: Native Promise behavior with a self-returning thenable
  found: A test object with then(resolve) { resolve(self) } caused repeated thenable calls and did not reach the .then resolved handler.
  implication: Current resolve(window.cv) is unsafe because the OpenCV module exposes Module.then and passes Module to the callback. This is a direct mechanism for loadOpenCv staying pending.

- timestamp: 2026-06-09T00:30:00.000Z
  checked: node --check src/processor.js
  found: Passed with no syntax errors.
  implication: Loader changes parse successfully.

- timestamp: 2026-06-09T00:30:00.000Z
  checked: npm run build
  found: Vite production build completed successfully.
  implication: React/Vite bundle compiles with the loader changes.

## Resolution

root_cause: loadOpenCv resolves its native Promise with window.cv, but the current OpenCV.js CDN module is thenable (Module.then) and resolves to itself. Native Promise thenable assimilation can keep loadOpenCv pending forever, so App.jsx never runs its ready handler. The loader also lacks timeout/error visibility for this pending state.
fix: Updated src/processor.js loadOpenCv to detect usable OpenCV APIs, wait through cv.then when present, keep onRuntimeInitialized as fallback, resolve with a non-thenable wrapper object instead of cv directly, and reject with useful errors on load failure/timeout.
verification: node --check src/processor.js passed; npm run build passed. Browser runtime verification should confirm the console readiness path and status transition.
files_changed: [src/processor.js]
