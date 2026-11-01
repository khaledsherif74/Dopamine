import { Spinner } from './Spinner.jsx';

const VARIANTS = {
  primary: 'bg-primary text-text-inverse hover:opacity-90 disabled:bg-disabled disabled:text-text-secondary',
  outline: 'border border-primary text-primary bg-transparent hover:bg-primary-tint disabled:border-disabled disabled:text-disabled',
  ghost: 'text-text-primary hover:bg-surface-alt disabled:text-disabled',
  danger: 'bg-danger text-text-inverse hover:opacity-90 disabled:bg-disabled disabled:text-text-secondary',
};
const SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

export function Button({ variant = 'primary', size = 'md', loading = false, disabled = false, className = '', type = 'button', children, ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size={16} label="" /> : null}
      {children}
    </button>
  );
}
