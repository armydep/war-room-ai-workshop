import { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { TimelineBucket } from '../../types';

interface TimelineChartProps {
  data: TimelineBucket[];
  loading: boolean;
  dark: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
};

export function TimelineChart({ data, loading, dark }: TimelineChartProps): JSX.Element {
  const chartData = useMemo(() => {
    return data.map((bucket) => ({
      ...bucket,
      label: bucket.bucket.slice(5),
    }));
  }, [data]);

  const gridColor = dark ? '#374151' : '#F3F4F6';
  const tickColor = dark ? '#9CA3AF' : '#6B7280';

  if (loading) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Incidents Over Time</h3>
        <div className="flex items-center justify-center h-60 text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Incidents Over Time</h3>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis tick={{ fontSize: 12, fill: tickColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: dark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${dark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '6px',
              color: dark ? '#F3F4F6' : '#111827',
            }}
          />
          <Area type="monotone" dataKey="critical" fill={SEVERITY_COLORS.critical} fillOpacity={0.1} stroke="none" />
          <Area type="monotone" dataKey="high" fill={SEVERITY_COLORS.high} fillOpacity={0.1} stroke="none" />
          <Line type="monotone" dataKey="critical" stroke={SEVERITY_COLORS.critical} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="high" stroke={SEVERITY_COLORS.high} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="medium" stroke={SEVERITY_COLORS.medium} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="low" stroke={SEVERITY_COLORS.low} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
