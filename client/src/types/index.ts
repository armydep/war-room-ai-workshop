export interface Incident {
  id: number;
  title: string;
  description: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  source: 'monitoring' | 'user_report' | 'automated' | 'external';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface TimelineEvent {
  id: number;
  incident_id: number;
  action: string;
  details: string | null;
  actor: string;
  created_at: string;
}

export interface IncidentWithTimeline extends Incident {
  timeline: TimelineEvent[];
}

export interface AlertConfig {
  id: number;
  name: string;
  severity: string;
  threshold: number;
  window_minutes: number;
  enabled: number;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnalyticsSummary {
  total_incidents: number;
  open_incidents: number;
  mttr_by_severity: Record<string, number>;
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  source_distribution: {
    monitoring: number;
    user_report: number;
    automated: number;
    external: number;
  };
}

export interface TimelineBucket {
  bucket: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface FilterState {
  severity: string;
  status: string;
  source: string;
}
