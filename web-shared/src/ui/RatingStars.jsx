// Read-only stars (value 0-5, halves rounded) or an interactive picker (onChange).
export function RatingStars({ value = 0, count, onChange, size = 16, label }) {
  const stars = [1, 2, 3, 4, 5];
  const rounded = Math.round(value);
  if (onChange) {
    return (
      <div role="radiogroup" aria-label={label} className="inline-flex gap-1">
        {stars.map(n => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === rounded}
            aria-label={`${n}`}
            onClick={() => onChange(n)}
            className={n <= rounded ? 'text-secondary' : 'text-disabled'}
          >
            <Star size={size + 8} />
          </button>
        ))}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={label ?? `${value} / 5`}>
      {stars.map(n => (
        <span key={n} className={n <= rounded ? 'text-secondary' : 'text-disabled'}>
          <Star size={size} />
        </span>
      ))}
      {count != null ? <span className="text-xs text-text-secondary">({count})</span> : null}
    </span>
  );
}

function Star({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  );
}
