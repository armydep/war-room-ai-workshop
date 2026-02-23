# WarRoom — Database Schema

Database: SQLite via better-sqlite3 (synchronous API)
File: `./data/warroom.db`

---

## Tables

### incidents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `title` | TEXT | NOT NULL | Short description |
| `description` | TEXT | | Detailed description |
| `severity` | TEXT | NOT NULL, CHECK IN ('critical','high','medium','low') | |
| `status` | TEXT | NOT NULL DEFAULT 'open', CHECK IN ('open','investigating','resolved') | |
| `source` | TEXT | NOT NULL, CHECK IN ('monitoring','user_report','automated','external') | |
| `assigned_to` | TEXT | | Team or person assigned |
| `created_at` | TEXT | NOT NULL DEFAULT (datetime('now')) | ISO 8601 |
| `updated_at` | TEXT | NOT NULL DEFAULT (datetime('now')) | ISO 8601 |
| `resolved_at` | TEXT | | Set when status → resolved |

**Indexes:**
- `idx_incidents_severity` ON (severity)
- `idx_incidents_status` ON (status)
- `idx_incidents_created_at` ON (created_at)
- `idx_incidents_source` ON (source)

---

### timeline_events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `incident_id` | INTEGER | NOT NULL, FOREIGN KEY → incidents(id) | |
| `action` | TEXT | NOT NULL | `created`, `status_change`, `severity_change`, `assigned`, `comment` |
| `details` | TEXT | | Human-readable description |
| `actor` | TEXT | NOT NULL DEFAULT 'system' | Who did it |
| `created_at` | TEXT | NOT NULL DEFAULT (datetime('now')) | |

**Indexes:**
- `idx_timeline_incident_id` ON (incident_id)

---

### alert_configs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `name` | TEXT | NOT NULL | Alert rule name |
| `severity` | TEXT | NOT NULL | Which severity to watch |
| `threshold` | INTEGER | NOT NULL | Number of incidents to trigger |
| `window_minutes` | INTEGER | NOT NULL | Time window for threshold |
| `enabled` | INTEGER | NOT NULL DEFAULT 1 | 0 or 1 (SQLite boolean) |
| `created_at` | TEXT | NOT NULL DEFAULT (datetime('now')) | |

---

### activity_log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `method` | TEXT | NOT NULL | HTTP method |
| `path` | TEXT | NOT NULL | Request path |
| `status_code` | INTEGER | | Response status |
| `duration_ms` | INTEGER | | Request duration |
| `role` | TEXT | | Requesting user's role |
| `created_at` | TEXT | NOT NULL DEFAULT (datetime('now')) | |

---

## Seed Data Strategy

The seed script should generate realistic incident data:

**Volume:** 50-75 incidents spread over the last 7 days.

**Distribution:**
- Severity: ~10% critical, ~25% high, ~40% medium, ~25% low
- Status: ~25% open, ~15% investigating, ~60% resolved
- Source: ~45% monitoring, ~30% user_report, ~15% automated, ~10% external

**Realistic titles (use a pool of templates):**
- Monitoring: "CPU usage exceeding 90% on {service}", "Memory leak detected in {service}", "Response time degraded on {endpoint}"
- User reports: "Users reporting {symptom} on {feature}", "Intermittent {error} during {action}"
- Automated: "Deployment rollback triggered for {service}", "Certificate expiring in {n} days"
- External: "Third-party API {provider} returning 503", "DNS resolution failures for {domain}"

**Timeline events per incident:**
- Every incident gets a "created" event
- Investigating incidents get 1-2 additional events (status change, assignment)
- Resolved incidents get 3-5 events (creation → investigation → updates → resolution)

**Resolved timestamps:**
- Critical incidents: resolved within 30-90 minutes
- High: 1-4 hours
- Medium: 4-12 hours
- Low: 12-48 hours

**Alert configs:** Seed 2-3 default alert rules (e.g., ">5 critical in 1 hour", ">10 high in 30 minutes").

---

## Query Patterns

All queries use parameterized statements. Example:

```typescript
const stmt = db.prepare(`
  SELECT * FROM incidents
  WHERE (@severity IS NULL OR severity = @severity)
    AND (@status IS NULL OR status = @status)
  ORDER BY created_at DESC
  LIMIT @limit OFFSET @offset
`);
const rows = stmt.all({ severity: filter.severity ?? null, status: filter.status ?? null, limit, offset });
```

For aggregations, use SQLite's built-in functions:

```sql
-- Severity distribution
SELECT severity, COUNT(*) as count FROM incidents GROUP BY severity;

-- MTTR by severity (in minutes)
SELECT severity,
  AVG((julianday(resolved_at) - julianday(created_at)) * 1440) as avg_minutes
FROM incidents
WHERE resolved_at IS NOT NULL
GROUP BY severity;
```
