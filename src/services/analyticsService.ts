import { getDb } from '../db/connection';

interface SeverityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface SourceDistribution {
  monitoring: number;
  user_report: number;
  automated: number;
  external: number;
}

interface AnalyticsSummary {
  total_incidents: number;
  open_incidents: number;
  mttr_by_severity: Record<string, number>;
  severity_distribution: SeverityDistribution;
  source_distribution: SourceDistribution;
}

interface TimelineBucket {
  bucket: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

function getSummary(): AnalyticsSummary {
  const db = getDb();

  const totalRow = db.prepare('SELECT COUNT(*) as count FROM incidents').get() as { count: number };
  const openRow = db.prepare("SELECT COUNT(*) as count FROM incidents WHERE status != 'resolved'").get() as { count: number };

  const severityRows = db.prepare('SELECT severity, COUNT(*) as count FROM incidents GROUP BY severity').all() as { severity: string; count: number }[];
  const severity_distribution: SeverityDistribution = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const row of severityRows) {
    severity_distribution[row.severity as keyof SeverityDistribution] = row.count;
  }

  const sourceRows = db.prepare('SELECT source, COUNT(*) as count FROM incidents GROUP BY source').all() as { source: string; count: number }[];
  const source_distribution: SourceDistribution = { monitoring: 0, user_report: 0, automated: 0, external: 0 };
  for (const row of sourceRows) {
    source_distribution[row.source as keyof SourceDistribution] = row.count;
  }

  const mttrRows = db.prepare(`
    SELECT severity,
      CAST(AVG((julianday(resolved_at) - julianday(created_at)) * 1440) AS INTEGER) as avg_minutes
    FROM incidents
    WHERE resolved_at IS NOT NULL
    GROUP BY severity
  `).all() as { severity: string; avg_minutes: number }[];

  const mttr_by_severity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const row of mttrRows) {
    mttr_by_severity[row.severity] = row.avg_minutes || 0;
  }

  return {
    total_incidents: totalRow.count,
    open_incidents: openRow.count,
    mttr_by_severity,
    severity_distribution,
    source_distribution,
  };
}

function getTimeline(period: string, granularity: string): { timeline: TimelineBucket[] } {
  const db = getDb();

  let daysBack = 7;
  if (period === '24h') daysBack = 1;
  else if (period === '30d') daysBack = 30;

  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

  let bucketExpr: string;
  if (granularity === 'hour') {
    bucketExpr = "strftime('%Y-%m-%d %H:00', created_at)";
  } else {
    bucketExpr = "strftime('%Y-%m-%d', created_at)";
  }

  const rows = db.prepare(`
    SELECT
      ${bucketExpr} as bucket,
      COUNT(*) as count,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
      SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
      SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
    FROM incidents
    WHERE created_at >= @startDate
    GROUP BY bucket
    ORDER BY bucket ASC
  `).all({ startDate }) as TimelineBucket[];

  return { timeline: rows };
}

export const analyticsService = { getSummary, getTimeline };
