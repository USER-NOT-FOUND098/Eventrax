import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'indigo' | 'green' | 'amber' | 'rose' | 'blue' | 'violet';
  className?: string;
}

const colorVariants = {
  indigo: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400',
  green: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
  amber: 'from-amber-500/20 to-amber-600/10 text-amber-400',
  rose: 'from-rose-500/20 to-rose-600/10 text-rose-400',
  blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
  violet: 'from-violet-500/20 to-violet-600/10 text-violet-400',
};

const iconBgVariants = {
  indigo: 'bg-indigo-500/20 text-indigo-400',
  green: 'bg-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/20 text-amber-400',
  rose: 'bg-rose-500/20 text-rose-400',
  blue: 'bg-blue-500/20 text-blue-400',
  violet: 'bg-violet-500/20 text-violet-400',
};

export function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
  className,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br border p-6',
        colorVariants[color],
        className
      )}
      style={{ borderColor: 'var(--border-color)' }}
    >
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl dark:bg-white/5 bg-black/5" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
            <h3 className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{value}</h3>
            {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}

            {trend && (
              <div className="flex items-center gap-1 mt-3">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs last month</span>
              </div>
            )}
          </div>

          <div className={cn('p-3 rounded-xl', iconBgVariants[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
