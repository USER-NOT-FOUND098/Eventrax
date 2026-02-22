import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

type ChartType = 'bar' | 'line' | 'pie';

interface StatChartProps {
  type: ChartType;
  data: any[];
  dataKey?: string;
  xAxisKey?: string;
  colors?: string[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
}

const defaultColors = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg p-3 shadow-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function StatChart({
  type,
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  colors = defaultColors,
  title,
  subtitle,
  className,
  height = 300,
}: StatChartProps) {
  const chartContent = useMemo(() => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
              <XAxis
                dataKey={xAxisKey}
                stroke="var(--text-secondary)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-secondary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-tertiary)' }} />
              <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
              <XAxis
                dataKey={xAxisKey}
                stroke="var(--text-secondary)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-secondary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0], strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: colors[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey={dataKey}
              >
                {data.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="var(--bg-secondary)" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  }, [type, data, dataKey, xAxisKey, colors, height]);

  return (
    <div className={cn('rounded-2xl border p-6', className)} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>}
          {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>
      )}
      {chartContent}
    </div>
  );
}
