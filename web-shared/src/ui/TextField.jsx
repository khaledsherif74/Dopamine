import { useId, useState } from 'react';

export function TextField({ label, error, hint, id, className = '', inputClassName = '', ...rest }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-xl border bg-surface px-3 py-2.5 text-text-primary placeholder:text-text-secondary ${error ? 'border-danger' : 'border-border'} ${inputClassName}`}
        {...rest}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField({ showLabel = 'Show', hideLabel = 'Hide', ...props }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <TextField {...props} type={shown ? 'text' : 'password'} inputClassName="pe-16" />
      <button
        type="button"
        onClick={() => setShown(s => !s)}
        aria-pressed={shown}
        className="absolute end-3 top-[34px] text-xs font-semibold text-primary"
      >
        {shown ? hideLabel : showLabel}
      </button>
    </div>
  );
}
