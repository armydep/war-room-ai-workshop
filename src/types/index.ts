export interface IncidentRecord {
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

export interface IncidentWithTimeline extends IncidentRecord {
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

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export interface IncidentFilters {
  severity?: string;
  status?: string;
  source?: string;
  sort: string;
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateIncidentInput {
  title: string;
  description?: string;
  source: string;
  severity?: string;
  assigned_to?: string;
}

export interface UpdateIncidentInput {
  status?: string;
  severity?: string;
  assigned_to?: string;
  description?: string;
}

export interface CreateAlertConfigInput {
  name: string;
  severity: string;
  threshold: number;
  window_minutes: number;
  enabled?: boolean;
}

export type Role = 'admin' | 'responder' | 'viewer';
