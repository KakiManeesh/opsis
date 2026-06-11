import { useState } from 'react';
import {
  OPERATION_OPTIONS,
  createOperationParamsMap,
  formatOperationParams,
  getOperationDefinition
} from '../operationConfig.js';

/**
 * Renders the pipeline controls and ordered operation list.
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
  onResetPipeline
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
          {pipeline.map((step, index) => (
            <li key={step.id} className="pipeline-step-item">
              <div className="pipeline-step-header">
                <span>{formatPipelineStep(step)}</span>
                <div className="button-row">
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => onMoveStep(step.id, -1)}
                    disabled={!canEditPipeline || index === 0}
                  >
                    Move Up
                  </button>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => onMoveStep(step.id, 1)}
                    disabled={!canEditPipeline || index === pipeline.length - 1}
                  >
                    Move Down
                  </button>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => onDuplicateStep(step.id)}
                    disabled={!canEditPipeline}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="action-button"
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

      <section className="sidebar-utility-section" aria-label="Pipeline JSON utilities">
        <div className="button-row sidebar-utility-row">
          <button type="button" className="action-button" onClick={onExportPipeline}>
            Export JSON
          </button>
          <label className="action-button">
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

        return (
          <label key={field.name} className="param-label" htmlFor={inputId}>
            {field.label}
            {field.kind === 'select' ? (
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
            ) : (
              <input
                id={inputId}
                className="param-input"
                type="number"
                min={field.min}
                max={field.max}
                step={field.kind === 'float' ? field.step ?? 0.1 : field.step ?? 1}
                value={inputValue}
                onChange={(event) => onParamChange(field.name, event.target.value)}
                disabled={!canEditPipeline}
              />
            )}
          </label>
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
