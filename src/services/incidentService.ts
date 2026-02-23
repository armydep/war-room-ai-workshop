import { getDb } from '../db/connection';
import { classifySeverity } from './classifierService';
import {
  IncidentRecord,
  IncidentWithTimeline,
  TimelineEvent,
  IncidentFilters,
  PaginationMeta,
  CreateIncidentInput,
  UpdateIncidentInput,
  AppError,
} from '../types';

function getIncidents(filters: IncidentFilters): { incidents: IncidentRecord[]; pagination: PaginationMeta } {
  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.severity) {
    conditions.push('severity = @severity');
    params.severity = filters.severity;
  }
  if (filters.status) {
    conditions.push('status = @status');
    params.status = filters.status;
  }
  if (filters.source) {
    conditions.push('source = @source');
    params.source = filters.source;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSorts = ['created_at', 'severity', 'updated_at', 'title'];
  const sortCol = allowedSorts.includes(filters.sort) ? filters.sort : 'created_at';
  const sortOrder = filters.order === 'asc' ? 'ASC' : 'DESC';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM incidents ${whereClause}`).get(params) as { total: number };
  const total = countRow.total;

  const offset = (filters.page - 1) * filters.limit;
  params.limit = filters.limit;
  params.offset = offset;

  const incidents = db.prepare(
    `SELECT * FROM incidents ${whereClause} ORDER BY ${sortCol} ${sortOrder} LIMIT @limit OFFSET @offset`
  ).all(params) as IncidentRecord[];

  return {
    incidents,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit) || 1,
    },
  };
}

function getIncidentById(id: number): IncidentWithTimeline {
  const db = getDb();

  const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as IncidentRecord | undefined;

  if (!incident) {
    const err = new Error(`Incident with id ${id} not found`) as AppError;
    err.statusCode = 404;
    err.code = 'INCIDENT_NOT_FOUND';
    throw err;
  }

  const timeline = db.prepare(
    'SELECT * FROM timeline_events WHERE incident_id = ? ORDER BY created_at ASC'
  ).all(id) as TimelineEvent[];

  return { ...incident, timeline };
}

function createIncident(input: CreateIncidentInput): IncidentRecord {
  const db = getDb();
  const severity = input.severity || classifySeverity(input.title, input.source);

  const result = db.prepare(`
    INSERT INTO incidents (title, description, severity, source, assigned_to)
    VALUES (@title, @description, @severity, @source, @assigned_to)
  `).run({
    title: input.title,
    description: input.description || null,
    severity,
    source: input.source,
    assigned_to: input.assigned_to || null,
  });

  const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(result.lastInsertRowid) as IncidentRecord;

  db.prepare(`
    INSERT INTO timeline_events (incident_id, action, details, actor)
    VALUES (?, 'created', ?, 'system')
  `).run(incident.id, `Incident created from ${input.source}`);

  console.info(`[${new Date().toISOString()}] [INFO] [incidents] Created incident ${incident.id}: ${incident.title}`);

  return incident;
}

function updateIncident(id: number, input: UpdateIncidentInput, actor: string): IncidentRecord {
  const db = getDb();

  const existing = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as IncidentRecord | undefined;
  if (!existing) {
    const err = new Error(`Incident with id ${id} not found`) as AppError;
    err.statusCode = 404;
    err.code = 'INCIDENT_NOT_FOUND';
    throw err;
  }

  const updates: string[] = [];
  const params: Record<string, unknown> = { id };

  if (input.status !== undefined) {
    updates.push('status = @status');
    params.status = input.status;
  }
  if (input.severity !== undefined) {
    updates.push('severity = @severity');
    params.severity = input.severity;
  }
  if (input.assigned_to !== undefined) {
    updates.push('assigned_to = @assigned_to');
    params.assigned_to = input.assigned_to;
  }
  if (input.description !== undefined) {
    updates.push('description = @description');
    params.description = input.description;
  }

  if (input.status === 'resolved') {
    updates.push("resolved_at = datetime('now')");
  }

  updates.push("updated_at = datetime('now')");

  if (updates.length > 1) {
    db.prepare(`UPDATE incidents SET ${updates.join(', ')} WHERE id = @id`).run(params);
  }

  if (input.status && input.status !== existing.status) {
    db.prepare(`
      INSERT INTO timeline_events (incident_id, action, details, actor)
      VALUES (?, 'status_change', ?, ?)
    `).run(id, `Status changed to ${input.status}`, actor);
  }

  if (input.severity && input.severity !== existing.severity) {
    db.prepare(`
      INSERT INTO timeline_events (incident_id, action, details, actor)
      VALUES (?, 'severity_change', ?, ?)
    `).run(id, `Severity changed from ${existing.severity} to ${input.severity}`, actor);
  }

  if (input.assigned_to && input.assigned_to !== existing.assigned_to) {
    db.prepare(`
      INSERT INTO timeline_events (incident_id, action, details, actor)
      VALUES (?, 'assigned', ?, ?)
    `).run(id, `Assigned to ${input.assigned_to}`, actor);
  }

  const updated = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as IncidentRecord;

  console.info(`[${new Date().toISOString()}] [INFO] [incidents] Updated incident ${id}`);

  return updated;
}

export const incidentService = { getIncidents, getIncidentById, createIncident, updateIncident };
