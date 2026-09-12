import { useEffect, useRef, useState } from 'react';
import LeftPanel from './components/LeftPanel.jsx';
import CenterCanvas from './components/CenterCanvas.jsx';
import RightInspector from './components/RightInspector.jsx';
import FooterCode from './components/FooterCode.jsx';
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
  ready: 'Ready',
  error: 'Error'
};

const DEFAULT_OPERATION = 'grayscale';

function App() {
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const nextPipelineStepIdRef = useRef(0);
  // Incremented after every successful pipeline render so CenterCanvas
  // knows to repaint its display copies.
  const [renderTick, setRenderTick] = useState(0);
  const [openCvStatus, setOpenCvStatus] = useState('loading');
  const [hasImage, setHasImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pipeline, setPipeline] = useState([]);
  const [inspectStepIndex, setInspectStepIndex] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(DEFAULT_OPERATION);

  const createPipelineStepId = () => `step-${nextPipelineStepIdRef.current++}`;
  const activeRenderPipeline =
    inspectStepIndex === null ? pipeline : pipeline.slice(0, inspectStepIndex + 1);

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
    // activeRenderPipeline is a slice of pipeline, so it already captures
    // every pipeline change. Listing pipeline separately is redundant and
    // causes the effect to fire twice on each pipeline mutation.
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
        activeRenderPipeline
      );
      setRenderTick((t) => t + 1);
    } catch (error) {
      setErrorMessage(error.message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRenderPipeline, hasImage, openCvStatus]);

  const handleFileSelect = async (file) => {
    if (!file) {
      setHasImage(false);
      setImageFile(null);
      if (processedCanvasRef.current) {
        clearCanvas(processedCanvasRef.current);
      }
      return;
    }

    if (!originalCanvasRef.current || !processedCanvasRef.current) {
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
          activeRenderPipeline
        );
      } else {
        clearCanvas(processedCanvasRef.current);
      }
      setHasImage(true);
      setImageFile(file);
      setRenderTick((t) => t + 1);
    } catch (error) {
      setHasImage(false);
      setImageFile(null);
      setErrorMessage(error.message);
    }
  };

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
    // Compute both the new pipeline and the new inspect index together so
    // we never read stale closure values inside a state updater.
    setPipeline((currentPipeline) => {
      const currentIndex = currentPipeline.findIndex((step) => step.id === stepId);
      if (currentIndex < 0) return currentPipeline;

      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= currentPipeline.length) return currentPipeline;

      const nextPipeline = [...currentPipeline];
      [nextPipeline[currentIndex], nextPipeline[nextIndex]] = [
        nextPipeline[nextIndex],
        nextPipeline[currentIndex]
      ];

      // Update inspect step index to follow the moved step — done here
      // while we have access to currentIndex/nextIndex from fresh pipeline.
      setInspectStepIndex((prev) => {
        if (prev === currentIndex) return nextIndex;
        if (prev === nextIndex) return currentIndex;
        return prev;
      });

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
    // Both state updates must derive the deleted index from the same
    // currentPipeline snapshot. Reading `pipeline` from the outer closure
    // inside setInspectStepIndex would risk using a stale value, so we
    // compute the index once inside setPipeline and pass it via a ref.
    let deletedIndex = -1;
    setPipeline((currentPipeline) => {
      deletedIndex = currentPipeline.findIndex((s) => s.id === stepId);
      if (deletedIndex === -1) return currentPipeline;
      return currentPipeline.filter((step) => step.id !== stepId);
    });
    setInspectStepIndex((currentIndex) => {
      if (currentIndex === null || deletedIndex === -1) return currentIndex;
      if (currentIndex === deletedIndex) return null;
      if (currentIndex > deletedIndex) return currentIndex - 1;
      return currentIndex;
    });
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
    if (!jsonText) return;
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
      setInspectStepIndex(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleUndoLastStep = () => {
    setPipeline((currentPipeline) => {
      const lastIndex = currentPipeline.length - 1;
      // Clear the inspect index if it points at the step being removed.
      setInspectStepIndex((prev) =>
        prev !== null && prev >= lastIndex ? null : prev
      );
      return currentPipeline.slice(0, -1);
    });
  };

  const handleResetPipeline = () => {
    setPipeline([]);
    setInspectStepIndex(null);
  };

  const canEditPipeline = openCvStatus === 'ready';

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="app-root">
      {/* Header - Navigate */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <svg className="app-title-icon" viewBox="0 0 24 24">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm10 8a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
            </svg>
            OPSIS
          </h1>
          <div className="status-indicator">
            <div className={`status-dot ${openCvStatus}`}></div>
            {OPEN_CV_STATUS[openCvStatus]}
          </div>
        </div>
        
        <div className="header-center">
          {hasImage && imageFile && (
            <div className="image-info-header">
              {originalCanvasRef.current?.width || 0}×{originalCanvasRef.current?.height || 0} &nbsp;&bull;&nbsp; {imageFile.type.split('/')[1]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="header-right">
          <button className="btn-icon" onClick={handleResetPipeline} title="Reset Pipeline">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button className="btn-icon" onClick={handleExportPipeline} title="Export Image / Pipeline">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button className="btn-icon" title="Settings">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/*
        Hidden backing canvases — always in the DOM from the very first render
        so originalCanvasRef / processedCanvasRef are never null when
        handleFileSelect runs. CenterCanvas reads from these but never
        mounts or unmounts them itself.
      */}
      <canvas ref={originalCanvasRef}  style={{ display: 'none' }} />
      <canvas ref={processedCanvasRef} style={{ display: 'none' }} />

      {/* Main Content Area */}
      <div className="app-main">
        {/* Left Panel - Build */}
        <LeftPanel
          canEditPipeline={canEditPipeline}
          selectedOperation={selectedOperation}
          pipeline={pipeline}
          onSelectedOperationChange={setSelectedOperation}
          onAppendOperation={handleAppendOperation}
          onMoveStep={handleMoveStep}
          onDuplicateStep={handleDuplicateStep}
          onDeleteStep={handleDeleteStep}
          onExportPipeline={handleExportPipeline}
          onImportPipeline={handleImportPipeline}
          onUndoLastStep={handleUndoLastStep}
          onResetPipeline={handleResetPipeline}
          inspectStepIndex={inspectStepIndex}
          onInspectStepChange={setInspectStepIndex}
          onFileSelect={handleFileSelect}
          hasImage={hasImage}
          fileName={imageFile?.name}
          fileSize={imageFile ? formatBytes(imageFile.size) : null}
        />

        {/* Center Canvas - View */}
        <CenterCanvas
          originalCanvasRef={originalCanvasRef}
          processedCanvasRef={processedCanvasRef}
          hasImage={hasImage}
          onFileSelect={handleFileSelect}
          renderTick={renderTick}
        />

        {/* Right Inspector - Edit */}
        <RightInspector
          pipeline={pipeline}
          inspectStepIndex={inspectStepIndex}
          canEditPipeline={canEditPipeline}
          onUpdateStepParams={handleUpdateStepParams}
        />
      </div>

      {/* Footer - Code */}
      <FooterCode pipeline={pipeline} />
    </div>
  );
}

export default App;

