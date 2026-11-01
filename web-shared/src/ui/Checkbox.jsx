import { useId } from 'react';

export function Checkbox({ label, error, id, className = '', ...rest }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2 text-sm text-text-primary">
        <input id={inputId} type="checkbox" aria-invalid={error ? true : undefined} className="mt-0.5 h-4 w-4 accent-[var(--c-primary)]" {...rest} />
        <span>{label}</span>
      </label>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
