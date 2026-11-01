import { Button } from './Button.jsx';
import { Spinner } from './Spinner.jsx';

export function LoadingView({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-text-secondary">
      <Spinner size={32} label={label} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorView({ message, retryLabel = 'Try again', onRetry }) {
  return (
    <div role="alert" className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="max-w-md text-text-primary">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-lg font-semibold text-text-primary">{title}</p>
      {message ? <p className="max-w-md text-sm text-text-secondary">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
