# WarRoom — Code Patterns

These are concrete examples of the patterns used in this project. When generating code, follow these patterns exactly.

---

## Pattern 1: Express Route with Validation, Service Call, and Response Envelope

```typescript
// routes/incidents.ts
import { Router, Request, Response, NextFunction } from 'express';
import { incidentService } from '../services/incidentService';
import { requireRole } from '../middleware/auth';

const router = Router();

router.get('/incidents', requireRole('viewer', 'responder', 'admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { severity, status, source, sort = 'created_at', order = 'desc', page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

    const result = incidentService.getIncidents({
      severity: severity as string | undefined,
      status: status as string | undefined,
      source: source as string | undefined,
      sort: sort as string,
      order: order as 'asc' | 'desc',
      page: pageNum,
      limit: limitNum,
    });

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/incidents', requireRole('responder', 'admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, source, severity, assigned_to } = req.body;

    if (!title || !source) {
      const err = new Error('title and source are required') as any;
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const incident = incidentService.createIncident({ title, description, source, severity, assigned_to });

    // Emit WebSocket event (io is attached to req.app)
    const io = req.app.get('io');
    if (io) {
      io.emit('incident:created', incident);
    }

    res.status(201).json({
      success: true,
      data: incident,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Pattern 2: Service Layer with Database Access

```typescript
// services/incidentService.ts
import { getDb } from '../db/connection';
import { classifySeverity } from './classifierService';

interface CreateIncidentInput {
  title: string;
  description?: string;
  source: string;
  severity?: string;
  assigned_to?: string;
}

interface IncidentFilters {
  severity?: string;
  status?: string;
  source?: string;
  sort: string;
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface IncidentRecord {
  id: number;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  source: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

function getIncidents(filters: IncidentFilters): { incidents: IncidentRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } } {
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

  // Whitelist sort columns to prevent SQL injection
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
      totalPages: Math.ceil(total / filters.limit),
    },
  };
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

  // Add timeline event
  db.prepare(`
    INSERT INTO timeline_events (incident_id, action, details, actor)
    VALUES (?, 'created', ?, 'system')
  `).run(incident.id, `Incident created from ${input.source}`);

  console.info(`[${new Date().toISOString()}] [INFO] [incidents] Created incident ${incident.id}: ${incident.title}`);

  return incident;
}

export const incidentService = { getIncidents, createIncident };
```

---

## Pattern 3: React Component with Data Fetching and Chart

```tsx
// components/charts/SeverityChart.tsx
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
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
};

export function SeverityChart({ data, loading }: SeverityChartProps): JSX.Element {
  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data).map(([severity, count]) => ({
      severity: severity.charAt(0).toUpperCase() + severity.slice(1),
      count,
      color: SEVERITY_COLORS[severity],
    }));
  }, [data]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Severity Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="severity" tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Pattern 4: Database Connection Singleton

```typescript
// db/connection.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(path.join(dataDir, 'warroom.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

---

## Pattern 5: Role-Based Auth Middleware

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';

type Role = 'admin' | 'responder' | 'viewer';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = (req.headers['x-role'] as Role) || 'viewer';

    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role '${role}' does not have access to this resource`,
          status: 403,
        },
      });
      return;
    }

    // Attach role to request for downstream use
    (req as any).userRole = role;
    next();
  };
}
```

---

## Pattern 6: Auto-Severity Classifier

```typescript
// services/classifierService.ts

const CRITICAL_KEYWORDS = ['down', 'outage', 'data loss', 'security breach', 'production down', 'p0'];
const HIGH_KEYWORDS = ['degraded', 'timeout', 'memory leak', 'cpu', 'error rate', 'payment'];
const MEDIUM_KEYWORDS = ['slow', 'intermittent', 'warning', 'certificate', 'disk'];

export function classifySeverity(title: string, source: string): string {
  const lower = title.toLowerCase();

  if (CRITICAL_KEYWORDS.some(kw => lower.includes(kw))) return 'critical';
  if (source === 'monitoring' && HIGH_KEYWORDS.some(kw => lower.includes(kw))) return 'high';
  if (HIGH_KEYWORDS.some(kw => lower.includes(kw))) return 'high';
  if (MEDIUM_KEYWORDS.some(kw => lower.includes(kw))) return 'medium';

  // Default: source-based fallback
  if (source === 'monitoring') return 'medium';
  if (source === 'external') return 'high';
  return 'low';
}
```
