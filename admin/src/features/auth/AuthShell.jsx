export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">{title}</h1>
        <p className="text-sm text-text-secondary mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export const fieldLabelClass = "text-xs font-semibold text-text-secondary uppercase tracking-wide";
export const fieldInputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary";
export const primaryButtonClass =
  "w-full rounded-lg bg-primary text-white font-semibold py-3 hover:bg-primary-dark disabled:opacity-60 transition-colors";
