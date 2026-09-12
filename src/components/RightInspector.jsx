import {
  getOperationDefinition,
  OPERATION_OPTIONS
} from '../operationConfig.js';
import { generateStepSnippet } from '../codegen.js';

function RightInspector({
  pipeline,
  inspectStepIndex,
  canEditPipeline,
  onUpdateStepParams
}) {
  if (inspectStepIndex === null || inspectStepIndex >= pipeline.length) {
    return (
      <aside className="right-inspector" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-6)', textAlign: 'center' }}>
        <div>Select a step in the pipeline to view and edit its parameters.</div>
      </aside>
    );
  }

  const step = pipeline[inspectStepIndex];
  const operation = OPERATION_OPTIONS.find((opt) => opt.type === step.type);
  const label = operation?.label ?? step.type;

  const handleParamChange = (paramName, value) => {
    onUpdateStepParams(step.id, {
      ...step.params,
      [paramName]: Number(value)
    });
  };

  const handleSelectChange = (paramName, value) => {
    // HTML select always gives a string; coerce to number to stay consistent
    // with handleParamChange and avoid strict-equality surprises in processor/codegen.
    onUpdateStepParams(step.id, {
      ...step.params,
      [paramName]: Number(value)
    });
  };

  return (
    <aside className="right-inspector">
      <div className="inspector-header">
        <div className="inspector-title">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent-primary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {label}
        </div>
        <div className="inspector-subtitle">Step {inspectStepIndex + 1} of {pipeline.length}</div>
      </div>

      <div style={{ padding: 'var(--space-4)', flex: 1, overflowY: 'auto' }}>
        <OperationFields
          operationType={step.type}
          params={step.params}
          canEditPipeline={canEditPipeline}
          onParamChange={handleParamChange}
          onSelectChange={handleSelectChange}
        />
      </div>

      <div className="code-preview">
        <div className="code-preview-header">
          <div className="section-label" style={{ margin: 0 }}>Python Code</div>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-tertiary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="code-block-container">
          <pre className="code-block">
            {generateStepSnippet(pipeline, inspectStepIndex)}
          </pre>
        </div>
      </div>
    </aside>
  );
}

function OperationFields({
  operationType,
  params,
  canEditPipeline,
  onParamChange,
  onSelectChange
}) {
  const definition = getOperationDefinition(operationType);

  if (!definition || !definition.fields.length) {
    return <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No parameters for this operation.</div>;
  }

  return (
    <div className="param-group">
      {definition.fields.map((field) => {
        const inputId = `param-${operationType}-${field.name}`;
        const inputValue = params[field.name] ?? '';

        if (field.kind === 'select') {
          return (
            <div key={field.name} className="param-control" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="param-label" htmlFor={inputId}>{field.label}</label>
              <select
                id={inputId}
                className="select-input"
                value={inputValue}
                onChange={(event) => onSelectChange(field.name, event.target.value)}
                disabled={!canEditPipeline}
                style={{ marginTop: 'var(--space-1)' }}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        const minVal = field.min ?? 0;
        const maxVal = field.max ?? 255;
        const stepVal = field.kind === 'float' ? (field.step ?? 0.1) : (field.step ?? 1);

        return (
          <div key={field.name} className="param-control" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="param-label-row">
              <label className="param-label" htmlFor={inputId}>{field.label}</label>
              <div className="param-value-display">{inputValue}</div>
            </div>
            <div className="slider-container" style={{ marginTop: 'var(--space-2)' }}>
              <div className="slider-track" onClick={(e) => {
                if (!canEditPipeline) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const val = minVal + pct * (maxVal - minVal);
                // round to step
                const stepCount = Math.round((val - minVal) / stepVal);
                onParamChange(field.name, minVal + stepCount * stepVal);
              }}>
                <div className="slider-fill" style={{ width: `${Math.max(0, Math.min(100, ((inputValue - minVal) / (maxVal - minVal)) * 100))}%` }}></div>
                <div className="slider-thumb" style={{ left: `${Math.max(0, Math.min(100, ((inputValue - minVal) / (maxVal - minVal)) * 100))}%` }}></div>
                <input
                  id={inputId}
                  type="range"
                  min={minVal}
                  max={maxVal}
                  step={stepVal}
                  value={inputValue}
                  onChange={(event) => onParamChange(field.name, event.target.value)}
                  disabled={!canEditPipeline}
                  className="slider-input"
                  style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              </div>
            </div>
            <div className="slider-labels">
              <span>{minVal}</span>
              <span>{maxVal}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RightInspector;
