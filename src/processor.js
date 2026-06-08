const OPEN_CV_SCRIPT_ID = 'opencv-js-cdn';
const OPEN_CV_SCRIPT_SRC = 'https://docs.opencv.org/4.x/opencv.js';
const OPEN_CV_LOAD_TIMEOUT_MS = 30000;

let openCvReadyPromise = null;

function isOpenCvUsable(cvInstance) {
  return Boolean(
    cvInstance &&
      typeof cvInstance.Mat === 'function' &&
      typeof cvInstance.imread === 'function' &&
      typeof cvInstance.imshow === 'function' &&
      typeof cvInstance.cvtColor === 'function'
  );
}

/**
 * Returns the OpenCV instance from the browser window when it is available.
 */
function getOpenCvInstance() {
  if (!isOpenCvUsable(window.cv)) {
    throw new Error('OpenCV is not ready yet.');
  }

  return window.cv;
}

/**
 * Resolves once OpenCV.js has finished loading and initializing in the browser.
 */
export function loadOpenCv() {
  if (openCvReadyPromise) {
    console.info('[OpenCV] Reusing existing load promise.');
    return openCvReadyPromise;
  }

  console.info('[OpenCV] Starting load from:', OPEN_CV_SCRIPT_SRC);

  openCvReadyPromise = new Promise((resolve, reject) => {
    let isSettled = false;
    const timeoutId = window.setTimeout(() => {
      fail(
        new Error(
          `Timed out after ${OPEN_CV_LOAD_TIMEOUT_MS / 1000}s while initializing OpenCV.js.`
        )
      );
    }, OPEN_CV_LOAD_TIMEOUT_MS);

    const markReady = (cvInstance, source) => {
      if (isSettled) {
        return true;
      }

      if (!isOpenCvUsable(cvInstance)) {
        console.info(`[OpenCV] ${source}: cv exists but is not usable yet.`, cvInstance);
        return false;
      }

      isSettled = true;
      window.clearTimeout(timeoutId);
      window.cv = cvInstance;
      console.info(`[OpenCV] Ready via ${source}.`);

      // Do not resolve with cvInstance directly. OpenCV's Emscripten module is
      // thenable, and native Promise resolution can keep assimilating it.
      resolve({ cv: cvInstance });
      return true;
    };

    function fail(error) {
      if (isSettled) {
        return;
      }

      isSettled = true;
      window.clearTimeout(timeoutId);
      console.error('[OpenCV] Initialization failed.', error);
      reject(error);
    }

    const waitForRuntimeReady = (source) => {
      const cvInstance = window.cv;

      if (!cvInstance) {
        console.info(`[OpenCV] ${source}: window.cv is not available yet.`);
        return false;
      }

      if (markReady(cvInstance, source)) {
        return true;
      }

      if (typeof cvInstance.then === 'function') {
        console.info(`[OpenCV] ${source}: waiting via cv.then().`);

        try {
          cvInstance.then(
            (readyCv) => {
              console.info('[OpenCV] cv.then readiness callback fired.');
              window.cv = readyCv || window.cv;

              if (!markReady(window.cv, 'cv.then')) {
                fail(
                  new Error('OpenCV runtime initialized, but required APIs are unavailable.')
                );
              }
            },
            (error) => {
              fail(new Error(`OpenCV runtime initialization failed: ${error}`));
            }
          );
        } catch (error) {
          fail(new Error(`OpenCV readiness callback failed: ${error.message}`));
        }

        return true;
      }

      console.info(`[OpenCV] ${source}: waiting via onRuntimeInitialized fallback.`);

      const previousHandler = cvInstance.onRuntimeInitialized;
      cvInstance.onRuntimeInitialized = () => {
        console.info('[OpenCV] onRuntimeInitialized fired.');

        if (typeof previousHandler === 'function') {
          previousHandler();
        }

        if (!markReady(window.cv, 'onRuntimeInitialized')) {
          fail(new Error('OpenCV runtime initialized, but required APIs are unavailable.'));
        }
      };

      return true;
    };

    if (waitForRuntimeReady('initial check')) {
      return;
    }

    const existingScript = document.getElementById(OPEN_CV_SCRIPT_ID);
    if (existingScript) {
      console.info('[OpenCV] Found existing script tag; waiting for it to finish loading.');
      existingScript.addEventListener(
        'load',
        () => {
          console.info('[OpenCV] Existing script load event fired.');

          if (!waitForRuntimeReady('existing script load')) {
            fail(new Error('OpenCV script loaded without exposing window.cv.'));
          }
        },
        { once: true }
      );
      existingScript.addEventListener(
        'error',
        () => {
          fail(new Error(`Failed to load OpenCV.js from ${OPEN_CV_SCRIPT_SRC}.`));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = OPEN_CV_SCRIPT_ID;
    script.async = true;
    script.src = OPEN_CV_SCRIPT_SRC;
    script.onload = () => {
      console.info('[OpenCV] Script load event fired.');

      if (!waitForRuntimeReady('script load')) {
        fail(new Error('OpenCV script loaded without exposing window.cv.'));
      }
    };
    script.onerror = () => {
      fail(new Error(`Failed to load OpenCV.js from ${OPEN_CV_SCRIPT_SRC}.`));
    };

    document.body.appendChild(script);
    console.info('[OpenCV] Script tag appended.');
  });

  return openCvReadyPromise;
}

/**
 * Draws an uploaded image file onto the provided canvas.
 */
export function drawImageFileToCanvas(file, canvas) {
  return new Promise((resolve, reject) => {
    const context = canvas.getContext('2d');
    if (!context) {
      reject(new Error('Could not get the canvas drawing context.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(objectUrl);
      resolve();
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The selected file could not be drawn to the canvas.'));
    };

    image.src = objectUrl;
  });
}

/**
 * Clears the visible content from a canvas without changing its size.
 */
export function clearCanvas(canvas) {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not get the canvas drawing context.');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Makes the processed canvas match the original canvas dimensions before rendering output.
 */
export function prepareCanvasPair(sourceCanvas, targetCanvas) {
  targetCanvas.width = sourceCanvas.width;
  targetCanvas.height = sourceCanvas.height;
}

/**
 * Converts the image on the source canvas to grayscale and draws it on the target canvas.
 */
export function applyGrayscaleToCanvas(sourceCanvas, targetCanvas) {
  applyPipelineToCanvas(sourceCanvas, targetCanvas, [{ type: 'grayscale' }]);
}

/**
 * Applies the ordered processing pipeline from the original canvas to the target canvas.
 */
export function applyPipelineToCanvas(sourceCanvas, targetCanvas, pipeline = []) {
  const cv = getOpenCvInstance();
  let currentMat = cv.imread(sourceCanvas);
  let displayMat = null;

  try {
    prepareCanvasPair(sourceCanvas, targetCanvas);

    for (const step of pipeline) {
      const nextMat = applyPipelineStep(cv, currentMat, step);
      currentMat.delete();
      currentMat = nextMat;
    }

    displayMat = matToDisplayMat(cv, currentMat);
    cv.imshow(targetCanvas, displayMat);
  } finally {
    currentMat.delete();

    if (displayMat) {
      displayMat.delete();
    }
  }
}

function applyPipelineStep(cv, sourceMat, step) {
  switch (step.type) {
    case 'grayscale':
      return convertToGrayscale(cv, sourceMat);
    case 'gaussianBlur':
      return applyGaussianBlur(cv, sourceMat, step.params);
    case 'threshold':
      return applyThreshold(cv, sourceMat, step.params, cv.THRESH_BINARY);
    case 'binaryInverseThreshold':
      return applyThreshold(cv, sourceMat, step.params, cv.THRESH_BINARY_INV);
    case 'canny':
      return applyCanny(cv, sourceMat, step.params);
    case 'sharpen':
      return applySharpen(cv, sourceMat);
    default:
      throw new Error(`Unsupported pipeline operation: ${step.type}`);
  }
}

function applyGaussianBlur(cv, sourceMat, params = {}) {
  const kernelSize = normalizeOddKernelSize(params.kernelSize ?? 5);
  const blurredMat = new cv.Mat();
  const size = new cv.Size(kernelSize, kernelSize);

  cv.GaussianBlur(sourceMat, blurredMat, size, 0, 0, cv.BORDER_DEFAULT);
  return blurredMat;
}

function applyThreshold(cv, sourceMat, params = {}, thresholdType) {
  const grayMat = convertToGrayscale(cv, sourceMat);
  const thresholdMat = new cv.Mat();
  const thresholdValue = clampByte(params.thresholdValue ?? 127);

  try {
    cv.threshold(grayMat, thresholdMat, thresholdValue, 255, thresholdType);
    return thresholdMat;
  } finally {
    grayMat.delete();
  }
}

function applyCanny(cv, sourceMat, params = {}) {
  const grayMat = convertToGrayscale(cv, sourceMat);
  const edgeMat = new cv.Mat();
  const threshold1 = clampByte(params.threshold1 ?? 100);
  const threshold2 = clampByte(params.threshold2 ?? 200);

  try {
    cv.Canny(grayMat, edgeMat, threshold1, threshold2);
    return edgeMat;
  } finally {
    grayMat.delete();
  }
}

function applySharpen(cv, sourceMat) {
  const sharpenedMat = new cv.Mat();
  const kernel = cv.matFromArray(3, 3, cv.CV_32F, [0, -1, 0, -1, 5, -1, 0, -1, 0]);

  try {
    cv.filter2D(sourceMat, sharpenedMat, -1, kernel);
    return sharpenedMat;
  } finally {
    kernel.delete();
  }
}

function convertToGrayscale(cv, sourceMat) {
  const grayMat = new cv.Mat();

  if (sourceMat.channels() === 1) {
    sourceMat.copyTo(grayMat);
  } else {
    cv.cvtColor(sourceMat, grayMat, cv.COLOR_RGBA2GRAY);
  }

  return grayMat;
}

function normalizeOddKernelSize(value) {
  const kernelSize = Number(value);

  if (!Number.isFinite(kernelSize) || kernelSize < 1) {
    throw new Error('Gaussian Blur kernel size must be a positive odd number.');
  }

  const roundedKernelSize = Math.round(kernelSize);

  if (roundedKernelSize % 2 === 0) {
    throw new Error('Gaussian Blur kernel size must be odd.');
  }

  return roundedKernelSize;
}

function clampByte(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error('Operation parameter must be a number between 0 and 255.');
  }

  return Math.min(255, Math.max(0, Math.round(numberValue)));
}

/**
 * Converts single-channel mats to RGBA for consistent canvas display.
 */
function matToDisplayMat(cv, sourceMat) {
  const displayMat = new cv.Mat();

  if (sourceMat.channels() === 1) {
    cv.cvtColor(sourceMat, displayMat, cv.COLOR_GRAY2RGBA);
  } else {
    sourceMat.copyTo(displayMat);
  }

  return displayMat;
}
