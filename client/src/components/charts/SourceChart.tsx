import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SourceData {
  monitoring: number;
  user_report: number;
  automated: number;
  external: number;
}

interface SourceChartProps {
  data: SourceData | null;
  loading: boolean;
  dark: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
  monitoring: '#8B5CF6',
  user_report: '#EC4899',
  automated: '#14B8A6',
  external: '#F97316',
};

const SOURCE_LABELS: Record<string, string> = {
  monitoring: 'Monitoring',
  user_report: 'User Report',
  automated: 'Automated',
  external: 'External',
};

interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

const renderLabel = ({ name, percent }: { name: string; percent: number }): string => {
  return `${name} ${(percent * 100).toFixed(0)}%`;
};

export function SourceChart({ data, loading, dark }: SourceChartProps): JSX.Element {
  const chartData: ChartEntry[] = useMemo(() => {
    if (!data) return [];
    return Object.entries(data).map(([source, count]) => ({
      name: SOURCE_LABELS[source] || source,
      value: count,
      color: SOURCE_COLORS[source] || '#9CA3AF',
    }));
  }, [data]);

  const labelColor = dark ? '#D1D5DB' : '#374151';

  if (loading) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Incidents by Source</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Incidents by Source</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={70}
            dataKey="value"
            label={({ name, percent }: { name: string; percent: number }) => renderLabel({ name, percent })}
            labelLine={true}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: dark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${dark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '6px',
              color: dark ? '#F3F4F6' : '#111827',
            }}
          />
          <Legend wrapperStyle={{ color: labelColor }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
