export function Card({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`rounded-2xl border border-border bg-surface p-4 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
