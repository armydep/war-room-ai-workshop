import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SeverityData {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface SeverityChartProps {
  data: SeverityData | null;
  loading: boolean;
  dark: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
};

export function SeverityChart({ data, loading, dark }: SeverityChartProps): JSX.Element {
  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data).map(([severity, count]) => ({
      severity: severity.charAt(0).toUpperCase() + severity.slice(1),
      count,
      color: SEVERITY_COLORS[severity],
    }));
  }, [data]);

  const gridColor = dark ? '#374151' : '#F3F4F6';
  const tickColor = dark ? '#9CA3AF' : '#6B7280';

  if (loading) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Severity Distribution</h3>
        <div className="flex items-center justify-center h-60 text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Severity Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis dataKey="severity" tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis tick={{ fontSize: 12, fill: tickColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: dark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${dark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '6px',
              color: dark ? '#F3F4F6' : '#111827',
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.severity} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
