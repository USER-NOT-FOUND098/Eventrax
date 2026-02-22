import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpenseSummaryProps {
  budget: number;
  totalExpenses: number;
  className?: string;
}

export function ExpenseSummary({ budget, totalExpenses, className }: ExpenseSummaryProps) {
  const remaining = budget - totalExpenses;
  const percentageUsed = budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const isOverBudget = remaining < 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      label: 'Total Budget',
      value: formatCurrency(budget),
      icon: Wallet,
      color: 'blue',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'rose',
    },
    {
      label: 'Remaining',
      value: formatCurrency(Math.abs(remaining)),
      icon: isOverBudget ? TrendingDown : TrendingUp,
      color: isOverBudget ? 'rose' : 'emerald',
      prefix: isOverBudget ? '-' : '',
    },
  ];

  const colorVariants = {
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
    rose: 'from-rose-500/20 to-rose-600/10 text-rose-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
  };

  const iconBgVariants = {
    blue: 'bg-blue-500/20 text-blue-400',
    rose: 'bg-rose-500/20 text-rose-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress bar */}
      <div className="bg-[#0E0E12] rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Budget Usage</span>
          <span className={cn('text-sm font-medium', isOverBudget ? 'text-rose-400' : 'text-emerald-400')}>
            {percentageUsed.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'
            )}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {isOverBudget
            ? `Over budget by ${formatCurrency(Math.abs(remaining))}`
            : `${formatCurrency(remaining)} remaining`}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                'relative overflow-hidden rounded-xl bg-gradient-to-br border border-white/5 p-4',
                colorVariants[card.color as keyof typeof colorVariants]
              )}
            >
              <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/5 blur-xl" />

              <div className="relative">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', iconBgVariants[card.color as keyof typeof iconBgVariants])}>
                  <Icon className="w-4 h-4" />
                </div>

                <p className="text-xs text-gray-400">{card.label}</p>
                <p className="text-lg font-bold text-white mt-1">
                  {card.prefix}{card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
