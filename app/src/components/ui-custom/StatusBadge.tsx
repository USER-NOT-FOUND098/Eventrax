import { cn } from '@/lib/utils';

type StatusType =
  | 'active' | 'pending' | 'blocked' | 'suspended' | 'inactive'
  | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  | 'confirmed' | 'attended' | 'available' | 'in-use' | 'damaged' | 'lost'
  | 'low' | 'medium' | 'high';

interface StatusBadgeProps {
  status: StatusType;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusColorMap: Record<StatusType, string> = {
  // User statuses
  active: 'var(--status-success)',
  pending: 'var(--status-warning)',
  blocked: 'var(--status-error)',
  suspended: 'var(--status-error)',
  inactive: 'var(--text-muted)',

  // Event statuses
  upcoming: 'var(--status-warning)',
  ongoing: 'var(--status-success)',
  completed: 'var(--status-info)',
  cancelled: 'var(--status-error)',

  // Registration statuses
  confirmed: 'var(--status-success)',
  attended: 'var(--status-info)',

  // Accessory statuses
  available: 'var(--status-success)',
  'in-use': 'var(--status-warning)',
  damaged: 'var(--status-error)',
  lost: 'var(--text-muted)',

  // Priority levels
  low: 'var(--status-info)',
  medium: 'var(--status-warning)',
  high: 'var(--status-error)',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function StatusBadge({ status, children, className, size = 'md' }: StatusBadgeProps) {
  const colorVar = statusColorMap[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium capitalize transition-colors duration-200',
        sizeStyles[size],
        className
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${colorVar}, transparent 85%)`,
        color: colorVar,
        borderColor: `color-mix(in srgb, ${colorVar}, transparent 80%)`
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: colorVar }}
      />
      {children || status}
    </span>
  );
}
