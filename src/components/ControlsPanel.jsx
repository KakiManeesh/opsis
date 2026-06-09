import { useState } from 'react';

const OPERATION_OPTIONS = [
  { type: 'grayscale', label: 'Grayscale' },
  { type: 'gaussianBlur', label: 'Gaussian Blur' },
  { type: 'medianBlur', label: 'Median Blur' },
  { type: 'threshold', label: 'Threshold' },
  { type: 'binaryInverseThreshold', label: 'Binary Inverse Threshold' },
  { type: 'canny', label: 'Canny Edge Detection' },
  { type: 'erosion', label: 'Erosion' },
  { type: 'dilation', label: 'Dilation' },
  { type: 'opening', label: 'Opening' },
  { type: 'closing', label: 'Closing' },
  { type: 'histogramEqualisation', label: 'Histogram Equalisation' },
  { type: 'sharpen', label: 'Sharpen preset' }
];

const DEFAULT_PARAMS = {
  gaussianBlur: { kernelSize: 5 },
  medianBlur: { kernelSize: 3 },
  threshold: { thresholdValue: 127 },
  binaryInverseThreshold: { thresholdValue: 127 },
  canny: { threshold1: 100, threshold2: 200 },
  erosion: { kernelSize: 3, iterations: 1 },
  dilation: { kernelSize: 3, iterations: 1 },
  opening: { kernelSize: 3, iterations: 1 },
  closing: { kernelSize: 3, iterations: 1 }
};

/**
 * Renders the pipeline controls and ordered operation list.
 */
function ControlsPanel({
  canEditPipeline,
  selectedOperation,
  pipeline,
  onSelectedOperationChange,
  onAppendOperation,
  onUndoLastStep,
  onResetPipeline
}) {
  const [operationParams, setOperationParams] = useState(DEFAULT_PARAMS);

  const handleParamChange = (operationType, paramName, value) => {
    setOperationParams((currentParams) => ({
      ...currentParams,
      [operationType]: {
        ...currentParams[operationType],
        [paramName]: Number(value)
      }
    }));
  };

  const handleAppendOperation = () => {
    onAppendOperation(getParamsForOperation(selectedOperation, operationParams));
  };

  return (
    <div className="panel-block">
      <label className="panel-label" htmlFor="operation-select">
        Add Operation
      </label>
      <select
        id="operation-select"
        className="operation-select"
        value={selectedOperation}
        onChange={(event) => onSelectedOperationChange(event.target.value)}
        disabled={!canEditPipeline}
      >
        {OPERATION_OPTIONS.map((operation) => (
          <option key={operation.type} value={operation.type}>
            {operation.label}
          </option>
        ))}
      </select>

      <OperationParams
        selectedOperation={selectedOperation}
        operationParams={operationParams}
        canEditPipeline={canEditPipeline}
        onParamChange={handleParamChange}
      />

      <button
        type="button"
        className="action-button control-button"
        onClick={handleAppendOperation}
        disabled={!canEditPipeline}
      >
        Add to Pipeline
      </button>

      <div className="button-row">
        <button
          type="button"
          className="action-button"
          onClick={onUndoLastStep}
          disabled={!canEditPipeline || pipeline.length === 0}
        >
          Undo Last Step
        </button>
        <button
          type="button"
          className="action-button"
          onClick={onResetPipeline}
          disabled={!canEditPipeline || pipeline.length === 0}
        >
          Reset Pipeline
        </button>
      </div>

      <h2 className="panel-heading pipeline-heading">Pipeline</h2>
      {pipeline.length ? (
        <ol className="pipeline-list">
          {pipeline.map((step) => (
            <li key={step.id}>{formatPipelineStep(step)}</li>
          ))}
        </ol>
      ) : (
        <p className="empty-pipeline">No operations yet.</p>
      )}
    </div>
  );
}

function OperationParams({
  selectedOperation,
  operationParams,
  canEditPipeline,
  onParamChange
}) {
  if (selectedOperation === 'gaussianBlur') {
    return (
      <label className="param-label" htmlFor="gaussian-kernel-size">
        Kernel Size
        <select
          id="gaussian-kernel-size"
          className="param-input"
          value={operationParams.gaussianBlur.kernelSize}
          onChange={(event) =>
            onParamChange('gaussianBlur', 'kernelSize', event.target.value)
          }
          disabled={!canEditPipeline}
        >
          {[3, 5, 7].map((kernelSize) => (
            <option key={kernelSize} value={kernelSize}>
              {kernelSize}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (selectedOperation === 'medianBlur') {
    return (
      <label className="param-label" htmlFor="median-kernel-size">
        Kernel Size
        <select
          id="median-kernel-size"
          className="param-input"
          value={operationParams.medianBlur.kernelSize}
          onChange={(event) =>
            onParamChange('medianBlur', 'kernelSize', event.target.value)
          }
          disabled={!canEditPipeline}
        >
          {[3, 5, 7].map((kernelSize) => (
            <option key={kernelSize} value={kernelSize}>
              {kernelSize}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (
    selectedOperation === 'threshold' ||
    selectedOperation === 'binaryInverseThreshold'
  ) {
    const inputId = `${selectedOperation}-threshold-value`;

    return (
      <label className="param-label" htmlFor={inputId}>
        Threshold Value
        <input
          id={inputId}
          className="param-input"
          type="number"
          min="0"
          max="255"
          value={operationParams[selectedOperation].thresholdValue}
          onChange={(event) =>
            onParamChange(selectedOperation, 'thresholdValue', event.target.value)
          }
          disabled={!canEditPipeline}
        />
      </label>
    );
  }

  if (selectedOperation === 'canny') {
    return (
      <div className="param-group">
        <label className="param-label" htmlFor="canny-threshold-1">
          Threshold 1
          <input
            id="canny-threshold-1"
            className="param-input"
            type="number"
            min="0"
            max="255"
            value={operationParams.canny.threshold1}
            onChange={(event) =>
              onParamChange('canny', 'threshold1', event.target.value)
            }
            disabled={!canEditPipeline}
          />
        </label>
        <label className="param-label" htmlFor="canny-threshold-2">
          Threshold 2
          <input
            id="canny-threshold-2"
            className="param-input"
            type="number"
            min="0"
            max="255"
            value={operationParams.canny.threshold2}
            onChange={(event) =>
              onParamChange('canny', 'threshold2', event.target.value)
            }
            disabled={!canEditPipeline}
          />
        </label>
      </div>
    );
  }

  if (
    selectedOperation === 'erosion' ||
    selectedOperation === 'dilation' ||
    selectedOperation === 'opening' ||
    selectedOperation === 'closing'
  ) {
    const operationLabel =
      selectedOperation === 'erosion'
        ? 'Erosion'
        : selectedOperation === 'dilation'
          ? 'Dilation'
          : selectedOperation === 'opening'
            ? 'Opening'
            : 'Closing';

    return (
      <div className="param-group">
        <label className="param-label" htmlFor={`${selectedOperation}-kernel-size`}>
          Kernel Size
          <select
            id={`${selectedOperation}-kernel-size`}
            className="param-input"
            value={operationParams[selectedOperation].kernelSize}
            onChange={(event) =>
              onParamChange(selectedOperation, 'kernelSize', event.target.value)
            }
            disabled={!canEditPipeline}
          >
            {[3, 5, 7].map((kernelSize) => (
              <option key={kernelSize} value={kernelSize}>
                {kernelSize}
              </option>
            ))}
          </select>
        </label>
        <label className="param-label" htmlFor={`${selectedOperation}-iterations`}>
          {operationLabel} Iterations
          <select
            id={`${selectedOperation}-iterations`}
            className="param-input"
            value={operationParams[selectedOperation].iterations}
            onChange={(event) =>
              onParamChange(selectedOperation, 'iterations', event.target.value)
            }
            disabled={!canEditPipeline}
          >
            {[1, 2, 3].map((iterations) => (
              <option key={iterations} value={iterations}>
                {iterations}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return null;
}

function formatPipelineStep(step) {
  const operation = OPERATION_OPTIONS.find((option) => option.type === step.type);
  const label = operation?.label ?? step.type;
  const paramText = formatParams(step.type, step.params);

  return paramText ? `${label} (${paramText})` : label;
}

function formatParams(operationType, params = {}) {
  if (operationType === 'gaussianBlur') {
    return `kernel ${params.kernelSize}`;
  }

  if (operationType === 'medianBlur') {
    return `kernel ${params.kernelSize}`;
  }

  if (operationType === 'threshold' || operationType === 'binaryInverseThreshold') {
    return `threshold ${params.thresholdValue}`;
  }

  if (operationType === 'canny') {
    return `${params.threshold1}, ${params.threshold2}`;
  }

  if (
    operationType === 'erosion' ||
    operationType === 'dilation' ||
    operationType === 'opening' ||
    operationType === 'closing'
  ) {
    return `kernel ${params.kernelSize}, iterations ${params.iterations}`;
  }

  if (operationType === 'histogramEqualisation') {
    return '';
  }

  return '';
}

function getParamsForOperation(operationType, operationParams) {
  return { ...(operationParams[operationType] ?? {}) };
}

export default ControlsPanel;
