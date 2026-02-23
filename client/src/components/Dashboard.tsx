import { useState, useEffect } from 'react';
import { StatCards } from './charts/StatCards';
import { SeverityChart } from './charts/SeverityChart';
import { TimelineChart } from './charts/TimelineChart';
import { SourceChart } from './charts/SourceChart';
import { IncidentFeed } from './IncidentFeed';
import { IncidentTable } from './IncidentTable';
import { AnalyticsSummary, TimelineBucket, Incident } from '../types';
import { getAnalyticsSummary, getAnalyticsTimeline } from '../services/api';

interface DashboardProps {
  liveFeed: Incident[];
  onSelectIncident: (id: number) => void;
  dark: boolean;
}

export function Dashboard({ liveFeed, onSelectIncident, dark }: DashboardProps): JSX.Element {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics(): Promise<void> {
      try {
        const [summaryData, timelineData] = await Promise.all([
          getAnalyticsSummary(),
          getAnalyticsTimeline('7d', 'day'),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setTimeline(timelineData.timeline);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <StatCards data={summary} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SeverityChart data={summary?.severity_distribution ?? null} loading={loading} dark={dark} />
        <TimelineChart data={timeline} loading={loading} dark={dark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SourceChart data={summary?.source_distribution ?? null} loading={loading} dark={dark} />
        </div>
        <IncidentFeed incidents={liveFeed} onSelectIncident={onSelectIncident} />
      </div>

      <IncidentTable onSelectIncident={onSelectIncident} />
    </div>
  );
}
