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
import {
  normalizeOperationParams,
  parseImportedPipelinePayload,
  serializePipelineForExport
} from './operationConfig.js';
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

  const createPipelineStepId = () => `step-${nextPipelineStepIdRef.current++}`;

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
        id: createPipelineStepId(),
        type: selectedOperation,
        params: normalizeOperationParams(selectedOperation, params) ?? {}
      }
    ]);
  };

  const handleUpdateStepParams = (stepId, params) => {
    setPipeline((currentPipeline) =>
      currentPipeline.map((step) =>
        step.id === stepId
          ? {
              ...step,
              params: normalizeOperationParams(step.type, params) ?? {}
            }
          : step
      )
    );
  };

  const handleMoveStep = (stepId, direction) => {
    setPipeline((currentPipeline) => {
      const currentIndex = currentPipeline.findIndex((step) => step.id === stepId);

      if (currentIndex < 0) {
        return currentPipeline;
      }

      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= currentPipeline.length) {
        return currentPipeline;
      }

      const nextPipeline = [...currentPipeline];
      [nextPipeline[currentIndex], nextPipeline[nextIndex]] = [
        nextPipeline[nextIndex],
        nextPipeline[currentIndex]
      ];

      return nextPipeline;
    });
  };

  const handleDuplicateStep = (stepId) => {
    setPipeline((currentPipeline) => {
      const currentIndex = currentPipeline.findIndex((step) => step.id === stepId);

      if (currentIndex < 0) {
        return currentPipeline;
      }

      const sourceStep = currentPipeline[currentIndex];
      const duplicateStep = {
        id: createPipelineStepId(),
        type: sourceStep.type,
        params: normalizeOperationParams(sourceStep.type, sourceStep.params) ?? {}
      };

      const nextPipeline = [...currentPipeline];
      nextPipeline.splice(currentIndex + 1, 0, duplicateStep);
      return nextPipeline;
    });
  };

  const handleDeleteStep = (stepId) => {
    setPipeline((currentPipeline) => currentPipeline.filter((step) => step.id !== stepId));
  };

  const handleExportPipeline = () => {
    const payload = serializePipelineForExport(pipeline);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'opsis-pipeline.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPipeline = (jsonText) => {
    try {
      const payload = JSON.parse(jsonText);
      const importedSteps = parseImportedPipelinePayload(payload);
      const nextPipeline = importedSteps.map((step) => ({
        id: createPipelineStepId(),
        type: step.type,
        params: step.params
      }));

      setErrorMessage('');
      setPipeline(nextPipeline);
    } catch (error) {
      setErrorMessage(error.message);
    }
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
            canEditPipeline={openCvStatus === 'ready'}
            selectedOperation={selectedOperation}
            pipeline={pipeline}
            onSelectedOperationChange={setSelectedOperation}
            onAppendOperation={handleAppendOperation}
            onUpdateStepParams={handleUpdateStepParams}
            onMoveStep={handleMoveStep}
            onDuplicateStep={handleDuplicateStep}
            onDeleteStep={handleDeleteStep}
            onExportPipeline={handleExportPipeline}
            onImportPipeline={handleImportPipeline}
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
