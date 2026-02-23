import {
  Incident,
  IncidentWithTimeline,
  PaginationMeta,
  AnalyticsSummary,
  TimelineBucket,
  AlertConfig,
} from '../types';

const API_BASE = '/api';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-role': 'admin',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: 'API request failed' } }));
    throw new Error(error.error?.message || 'API request failed');
  }
  const json = await res.json();
  return json.data;
}

export async function getIncidents(params: {
  severity?: string;
  status?: string;
  source?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}): Promise<{ incidents: Incident[]; pagination: PaginationMeta }> {
  const searchParams = new URLSearchParams();
  if (params.severity) searchParams.set('severity', params.severity);
  if (params.status) searchParams.set('status', params.status);
  if (params.source) searchParams.set('source', params.source);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  return fetchAPI<{ incidents: Incident[]; pagination: PaginationMeta }>(
    `/incidents${qs ? `?${qs}` : ''}`
  );
}

export async function getIncident(id: number): Promise<IncidentWithTimeline> {
  return fetchAPI<IncidentWithTimeline>(`/incidents/${id}`);
}

export async function createIncident(data: {
  title: string;
  description?: string;
  source: string;
  severity?: string;
  assigned_to?: string;
}): Promise<Incident> {
  return fetchAPI<Incident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIncident(
  id: number,
  data: { status?: string; severity?: string; assigned_to?: string; description?: string }
): Promise<Incident> {
  return fetchAPI<Incident>(`/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return fetchAPI<AnalyticsSummary>('/analytics/summary');
}

export async function getAnalyticsTimeline(
  period = '7d',
  granularity = 'day'
): Promise<{ timeline: TimelineBucket[] }> {
  return fetchAPI<{ timeline: TimelineBucket[] }>(
    `/analytics/timeline?period=${period}&granularity=${granularity}`
  );
}

export async function getAlertConfigs(): Promise<{ configs: AlertConfig[] }> {
  return fetchAPI<{ configs: AlertConfig[] }>('/alert-configs');
}

export async function createAlertConfig(data: {
  name: string;
  severity: string;
  threshold: number;
  window_minutes: number;
  enabled?: boolean;
}): Promise<AlertConfig> {
  return fetchAPI<AlertConfig>('/alert-configs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
