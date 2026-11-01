import { useId } from 'react';

export function SelectField({ label, id, options, className = '', ...rest }) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}
      <select id={selectId} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text-primary" {...rest}>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
