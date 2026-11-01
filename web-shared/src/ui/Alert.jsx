const TONES = {
  info: 'border-border bg-surface-alt text-text-primary',
  success: 'border-success/40 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  danger: 'border-danger/40 bg-danger/10 text-danger',
};

export function Alert({ tone = 'info', className = '', children }) {
  return (
    <div role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} className={`rounded-xl border px-3 py-2 text-sm ${TONES[tone]} ${className}`}>
      {children}
    </div>
  );
}
