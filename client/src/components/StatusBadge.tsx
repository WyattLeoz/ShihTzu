import { IncidentStatus } from '../types';

interface StatusBadgeProps {
  status: IncidentStatus;
}

const statusConfig: Record<
  IncidentStatus,
  { label: string; color: string; bgColor: string }
> = {
  open: { label: 'OPEN', color: 'text-ink', bgColor: 'bg-paper' },
  triaging: { label: 'TRIAGING', color: 'text-amber-dark', bgColor: 'bg-amber-light' },
  dispatched: { label: 'DISPATCHED', color: 'text-teal-dark', bgColor: 'bg-teal-light' },
  on_scene: { label: 'ON SCENE', color: 'text-navy-mid', bgColor: 'bg-navy-light' },
  resolved: { label: 'RESOLVED', color: 'text-teal-dark', bgColor: 'bg-teal-light' },
  closed: { label: 'CLOSED', color: 'text-ink-muted', bgColor: 'bg-paper-border' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center px-2 py-1
        text-xs font-mono font-medium
        ${config.color} ${config.bgColor}
        border border-paper-border
      `}
      role="status"
    >
      {config.label}
    </span>
  );
}