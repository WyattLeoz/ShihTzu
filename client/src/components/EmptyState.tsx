interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && (
        <div className="mb-4 text-ink-muted">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-ink-muted text-center mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}