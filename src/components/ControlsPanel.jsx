import { useState } from 'react';
import ImageUploader from './ImageUploader.jsx';
import CodePanel from './CodePanel.jsx';
import {
  OPERATION_OPTIONS,
  createOperationParamsMap,
  formatOperationParams,
  getOperationDefinition
} from '../operationConfig.js';

const OPEN_CV_STATUS = {
  loading: 'Loading...',
  ready: 'OpenCV Ready',
  error: 'OpenCV Error'
};

/**
 * Renders the pipeline controls and ordered operation list inside the sidebar-panel.
 */
function ControlsPanel({
  canEditPipeline,
  selectedOperation,
  pipeline,
  onSelectedOperationChange,
  onAppendOperation,
  onUpdateStepParams,
  onMoveStep,
  onDuplicateStep,
  onDeleteStep,
  onExportPipeline,
  onImportPipeline,
  onUndoLastStep,
  onResetPipeline,
  inspectStepIndex,
  onInspectStepChange,
  activeInspectNodes,
  onPinInspectNode,
  openCvStatus,
  errorMessage,
  onFileSelect,
  generatedCode
}) {
  const [operationParams, setOperationParams] = useState(createOperationParamsMap());

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
    onAppendOperation(operationParams[selectedOperation] ?? {});
  };

  const handleImportChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onImportPipeline(String(reader.result ?? ''));
    reader.onerror = () => onImportPipeline('');
    reader.readAsText(file);
  };

  return (
    <div className="sidebar-panel">
      <header className="app-header">
        <h1 className="app-title">Visual Image Processing Pipeline App</h1>
        <span className={`status-badge status-${openCvStatus}`}>
          {OPEN_CV_STATUS[openCvStatus]}
        </span>
      </header>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      <ImageUploader onFileSelect={onFileSelect} />

      <div className="controls-panel">
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

        <OperationFields
          operationType={selectedOperation}
          params={operationParams[selectedOperation] ?? {}}
          canEditPipeline={canEditPipeline}
          onParamChange={(paramName, value) =>
            handleParamChange(selectedOperation, paramName, value)
          }
          paramChangeContext="new-step"
        />

        <button
          type="button"
          className="btn btn--primary control-button"
          onClick={handleAppendOperation}
          disabled={!canEditPipeline}
        >
          Add Step
        </button>

        <div className="button-row">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onUndoLastStep}
            disabled={!canEditPipeline || pipeline.length === 0}
          >
            Undo Last Step
          </button>
          <button
            type="button"
            className="btn btn--destructive"
            onClick={onResetPipeline}
            disabled={!canEditPipeline || pipeline.length === 0}
          >
            Reset Pipeline
          </button>
        </div>

        <h2 className="panel-heading pipeline-heading">Pipeline</h2>
        {pipeline.length ? (
          <ol className="pipeline-list">
            {pipeline.map((step, index) => (
              <li
                key={step.id}
                className={`pipeline-step${inspectStepIndex === index ? ' pipeline-step--active' : ''}`}
              >
                <div className="pipeline-step__header">
                  <div className="pipeline-step__main">
                    <span className="pipeline-step__title">{formatPipelineStep(step)}</span>
                    <span className="pipeline-step__meta">Step {index + 1}</span>
                  </div>
                  <div className="step-actions-row">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => onInspectStepChange(index)}
                      disabled={!canEditPipeline}
                      aria-pressed={inspectStepIndex === index}
                    >
                      Inspect
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => onPinInspectNode(index)}
                      disabled={!canEditPipeline || activeInspectNodes.includes(index)}
                    >
                      Pin to Grid
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => onMoveStep(step.id, -1)}
                      disabled={!canEditPipeline || index === 0}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => onMoveStep(step.id, 1)}
                      disabled={!canEditPipeline || index === pipeline.length - 1}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => onDuplicateStep(step.id)}
                      disabled={!canEditPipeline}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="btn btn--destructive"
                      onClick={() => onDeleteStep(step.id)}
                      disabled={!canEditPipeline}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <OperationFields
                  operationType={step.type}
                  params={step.params}
                  canEditPipeline={canEditPipeline}
                  onParamChange={(paramName, value) =>
                    onUpdateStepParams(step.id, {
                      ...step.params,
                      [paramName]: value
                    })
                  }
                  paramChangeContext="pipeline-step"
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-pipeline">No operations yet.</p>
        )}

        <div className="button-row">
          <span className="inspection-status">
            {inspectStepIndex === null
              ? 'Viewing final output'
              : `Viewing after step ${inspectStepIndex + 1}`}
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onInspectStepChange(null)}
            disabled={!canEditPipeline || inspectStepIndex === null}
          >
            View Final Output
          </button>
        </div>

        <section className="sidebar-utility-section" aria-label="Pipeline JSON utilities">
          <div className="button-row sidebar-utility-row">
            <button type="button" className="btn btn--ghost" onClick={onExportPipeline}>
              Export JSON
            </button>
            <label className="btn btn--ghost">
              Import JSON
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleImportChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </section>
      </div>

      <CodePanel code={generatedCode} />
    </div>
  );
}

function OperationFields({
  operationType,
  params,
  canEditPipeline,
  onParamChange,
  paramChangeContext
}) {
  const definition = getOperationDefinition(operationType);

  if (!definition || !definition.fields.length) {
    return null;
  }

  return (
    <div className="param-group">
      {definition.fields.map((field) => {
        const inputId = `${paramChangeContext}-${operationType}-${field.name}`;
        const inputValue = params[field.name] ?? '';

        if (field.kind === 'select') {
          return (
            <label key={field.name} className="param-label" htmlFor={inputId}>
              {field.label}
              <select
                id={inputId}
                className="param-input"
                value={inputValue}
                onChange={(event) => onParamChange(field.name, event.target.value)}
                disabled={!canEditPipeline}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        // Numeric fields → range sliders
        const minVal = field.min ?? 0;
        const maxVal = field.max ?? 255;
        const stepVal = field.kind === 'float' ? (field.step ?? 0.1) : (field.step ?? 1);

        return (
          <div className="param-slider-row" key={field.name}>
            <label htmlFor={inputId}>{field.label}</label>
            <input
              id={inputId}
              type="range"
              min={minVal}
              max={maxVal}
              step={stepVal}
              value={inputValue}
              onChange={(event) => onParamChange(field.name, event.target.value)}
              disabled={!canEditPipeline}
            />
            <span>{inputValue}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatPipelineStep(step) {
  const operation = OPERATION_OPTIONS.find((option) => option.type === step.type);
  const label = operation?.label ?? step.type;
  const paramText = formatOperationParams(step.type, step.params);

  return paramText ? `${label} (${paramText})` : label;
}

export default ControlsPanel;
