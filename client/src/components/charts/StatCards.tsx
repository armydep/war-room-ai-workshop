import { useMemo } from 'react';
import { AnalyticsSummary } from '../../types';

interface StatCardsProps {
  data: AnalyticsSummary | null;
  loading: boolean;
}

function formatMTTR(minutes: number): string {
  if (minutes === 0) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

interface CardData {
  label: string;
  value: string;
  bgColor: string;
  textColor: string;
}

export function StatCards({ data, loading }: StatCardsProps): JSX.Element {
  const cards: CardData[] = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: 'Total Incidents',
        value: String(data.total_incidents),
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
      },
      {
        label: 'Open Incidents',
        value: String(data.open_incidents),
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
      },
      {
        label: 'MTTR (Critical)',
        value: formatMTTR(data.mttr_by_severity.critical),
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
      },
      {
        label: 'MTTR (High)',
        value: formatMTTR(data.mttr_by_severity.high),
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`card p-5 ${card.bgColor}`}>
          <div className={`text-3xl font-bold ${card.textColor}`}>{card.value}</div>
          <div className="text-sm text-gray-600 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
