import { useState } from 'react';
import {
  OPERATION_OPTIONS,
  createOperationParamsMap,
  formatOperationParams
} from '../operationConfig.js';

function LeftPanel({
  canEditPipeline,
  selectedOperation,
  pipeline,
  onSelectedOperationChange,
  onAppendOperation,
  onMoveStep,
  onDuplicateStep,
  onDeleteStep,
  onExportPipeline,
  onImportPipeline,
  onUndoLastStep,
  onResetPipeline,
  inspectStepIndex,
  onInspectStepChange,
  onFileSelect,
  hasImage,
  fileName,
  fileSize
}) {
  const [operationParams] = useState(createOperationParamsMap());

  const handleAppendOperation = () => {
    onAppendOperation(operationParams[selectedOperation] ?? {});
  };

  const handleImportChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => onImportPipeline(String(reader.result ?? ''));
    reader.onerror = () => onImportPipeline('');
    reader.readAsText(file);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <aside className="left-panel">
      {/* Upload Area */}
      <div className="panel-section">
        <label htmlFor="image-upload" className={`upload-area ${hasImage ? 'upload-compact' : ''}`}>
          {!hasImage ? (
            <>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-tertiary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="upload-text">Drop image here or click to browse</p>
              <p className="upload-hint">JPG, PNG, WebP</p>
            </>
          ) : (
            <>
              <div className="upload-thumbnail" style={{ background: 'var(--bg-base)' }}></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="upload-filename" title={fileName}>{fileName || 'image.jpg'}</div>
                <div className="upload-hint">{fileSize || ''}</div>
              </div>
              <button 
                className="btn-icon" 
                onClick={(e) => { e.preventDefault(); onFileSelect(null); }}
                title="Remove image"
              >
                ✕
              </button>
            </>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Add Operation */}
      <div className="panel-section">
        <select
          className="select-input"
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
        
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAppendOperation}
          disabled={!canEditPipeline}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Step
        </button>
      </div>

      {/* Pipeline Stack */}
      <div className="panel-section" style={{ flex: 1 }}>
        <h2 className="section-label">
          PIPELINE
          {pipeline.length > 0 && <span className="badge-count">{pipeline.length}</span>}
        </h2>
        
        {pipeline.length === 0 ? (
          <div style={{ padding: 'var(--space-8) 0', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-2)' }}>
            <p className="upload-text">No operations yet</p>
            <p className="upload-hint">Add an operation to begin</p>
          </div>
        ) : (
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column' }}>
            {pipeline.map((step, index) => {
              const operation = OPERATION_OPTIONS.find((opt) => opt.type === step.type);
              const label = operation?.label ?? step.type;
              const paramText = formatOperationParams(step.type, step.params);
              const isSelected = inspectStepIndex === index;

              return (
                <div 
                  key={step.id}
                  className={`pipeline-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onInspectStepChange(index)}
                >
                  <div className="pipeline-card-header">
                    <div className="pipeline-step-number">{index + 1}</div>
                    <div className="pipeline-step-title">{label}</div>
                    <div className="card-actions">
                      <button className="btn-icon drag-handle" title="Drag to reorder">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </button>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onDuplicateStep(step.id); }} title="Duplicate">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onDeleteStep(step.id); }} title="Delete" style={{ color: 'var(--accent-error)' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {paramText && <div className="pipeline-step-params">{paramText}</div>}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button 
            className="btn btn-ghost" 
            onClick={onUndoLastStep}
            disabled={!canEditPipeline || pipeline.length === 0}
            style={{ flex: 1 }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </button>
          <button 
            className="btn btn-ghost" 
            onClick={onResetPipeline}
            disabled={!canEditPipeline || pipeline.length === 0}
            style={{ flex: 1 }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {/* JSON Utilities */}
      <div className="panel-section">
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={onExportPipeline} style={{ flex: 1 }}>
            Export JSON
          </button>
          <label className="btn btn-secondary" style={{ flex: 1, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            Import JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </aside>
  );
}

export default LeftPanel;
