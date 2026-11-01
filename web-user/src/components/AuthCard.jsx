import { Card } from '@dopamine/web-shared';

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle ? <p className="mt-1 mb-6 text-sm text-text-secondary">{subtitle}</p> : <div className="mb-6" />}
        {children}
      </Card>
      {footer ? <p className="mt-4 text-center text-sm text-text-secondary">{footer}</p> : null}
    </div>
  );
}
