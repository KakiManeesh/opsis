import { useEffect, useRef, useState } from 'react';
import ImageUploader from './components/ImageUploader.jsx';
import ImagePreview from './components/ImagePreview.jsx';
import ControlsPanel from './components/ControlsPanel.jsx';
import CodePanel from './components/CodePanel.jsx';
import {
  applyPipelineToCanvas,
  clearCanvas,
  drawImageFileToCanvas,
  loadOpenCv,
  prepareCanvasPair
} from './processor.js';
import { generatePythonCode } from './codegen.js';
import './App.css';

const OPEN_CV_STATUS = {
  loading: 'Loading...',
  ready: 'OpenCV Ready',
  error: 'OpenCV Error'
};

const DEFAULT_OPERATION = 'grayscale';

/**
 * Renders the main application shell and coordinates upload, processing, and code display.
 */
function App() {
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const nextPipelineStepIdRef = useRef(0);
  const [openCvStatus, setOpenCvStatus] = useState('loading');
  const [hasImage, setHasImage] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pipeline, setPipeline] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState(DEFAULT_OPERATION);

  useEffect(() => {
    loadOpenCv()
      .then(() => {
        setOpenCvStatus('ready');
      })
      .catch((error) => {
        setOpenCvStatus('error');
        setErrorMessage(error.message);
      });
  }, []);

  useEffect(() => {
    setGeneratedCode(generatePythonCode(pipeline));

    if (!hasImage || openCvStatus !== 'ready') {
      return;
    }

    if (!originalCanvasRef.current || !processedCanvasRef.current) {
      return;
    }

    try {
      setErrorMessage('');
      applyPipelineToCanvas(
        originalCanvasRef.current,
        processedCanvasRef.current,
        pipeline
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [hasImage, openCvStatus, pipeline]);

  /**
   * Loads the selected file into the original canvas and reapplies the current pipeline.
   */
  const handleFileSelect = async (file) => {
    if (!file || !originalCanvasRef.current || !processedCanvasRef.current) {
      return;
    }

    setErrorMessage('');

    try {
      await drawImageFileToCanvas(file, originalCanvasRef.current);
      prepareCanvasPair(originalCanvasRef.current, processedCanvasRef.current);
      if (openCvStatus === 'ready') {
        applyPipelineToCanvas(
          originalCanvasRef.current,
          processedCanvasRef.current,
          pipeline
        );
      } else {
        clearCanvas(processedCanvasRef.current);
      }
      setHasImage(true);
    } catch (error) {
      setHasImage(false);
      setErrorMessage(error.message);
    }
  };

  /**
   * Appends the selected operation to the linear pipeline.
   */
  const handleAppendOperation = (params = {}) => {
    setPipeline((currentPipeline) => [
      ...currentPipeline,
      {
        id: `step-${nextPipelineStepIdRef.current++}`,
        type: selectedOperation,
        params
      }
    ]);
  };

  const handleUndoLastStep = () => {
    setPipeline((currentPipeline) => currentPipeline.slice(0, -1));
  };

  const handleResetPipeline = () => {
    setPipeline([]);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Visual Image Processing Pipeline App</h1>
        <span className={`status-badge status-${openCvStatus}`}>
          {OPEN_CV_STATUS[openCvStatus]}
        </span>
      </header>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      <main className="workspace-grid">
        <aside className="sidebar">
          <ImageUploader onFileSelect={handleFileSelect} />
          <ControlsPanel
            canEditPipeline={openCvStatus === 'ready' && hasImage}
            selectedOperation={selectedOperation}
            pipeline={pipeline}
            onSelectedOperationChange={setSelectedOperation}
            onAppendOperation={handleAppendOperation}
            onUndoLastStep={handleUndoLastStep}
            onResetPipeline={handleResetPipeline}
          />
        </aside>

        <section className="canvas-column">
          <ImagePreview canvasRef={originalCanvasRef} title="Original Image" />
        </section>

        <section className="canvas-column">
          <ImagePreview canvasRef={processedCanvasRef} title="Processed Image" />
        </section>
      </main>

      <CodePanel code={generatedCode} />
    </div>
  );
}

export default App;
