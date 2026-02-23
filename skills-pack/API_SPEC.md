# WarRoom — API Specification

Base URL: `http://localhost:3001/api`

All responses follow this envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2025-01-15T10:30:00Z" }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "INCIDENT_NOT_FOUND",
    "message": "Incident with id 999 not found",
    "status": 404
  }
}
```

---

## 1. GET /api/incidents

List incidents with filtering, sorting, and pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `severity` | string | — | Filter: `critical`, `high`, `medium`, `low` |
| `status` | string | — | Filter: `open`, `investigating`, `resolved` |
| `source` | string | — | Filter: `monitoring`, `user_report`, `automated`, `external` |
| `sort` | string | `created_at` | Sort field: `created_at`, `severity`, `updated_at` |
| `order` | string | `desc` | Sort order: `asc`, `desc` |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "incidents": [ { ...incident } ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 87,
      "totalPages": 5
    }
  }
}
```

**Access:** viewer, responder, admin

---

## 2. GET /api/incidents/:id

Get a single incident with full timeline.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Database connection pool exhausted",
    "description": "Production DB connections maxed at 100, causing 503 errors on /api/orders",
    "severity": "critical",
    "status": "investigating",
    "source": "monitoring",
    "assigned_to": "backend-team",
    "created_at": "2025-01-15T08:30:00Z",
    "updated_at": "2025-01-15T09:15:00Z",
    "resolved_at": null,
    "timeline": [
      { "id": 1, "incident_id": 1, "action": "created", "details": "Auto-detected by monitoring", "actor": "system", "created_at": "2025-01-15T08:30:00Z" },
      { "id": 2, "incident_id": 1, "action": "status_change", "details": "Status changed to investigating", "actor": "alice", "created_at": "2025-01-15T08:35:00Z" }
    ]
  }
}
```

**Response (404):** `INCIDENT_NOT_FOUND`

**Access:** viewer, responder, admin

---

## 3. POST /api/incidents

Create a new incident. Severity is auto-classified if not provided.

**Request Body:**

```json
{
  "title": "Payment gateway timeout",
  "description": "Stripe webhook responses exceeding 30s timeout",
  "source": "monitoring",
  "severity": "high",
  "assigned_to": "payments-team"
}
```

Required: `title`, `source`
Optional: `description`, `severity` (auto-classified if omitted), `assigned_to`

**Response (201):** Created incident object

**Side effect:** Emits `incident:created` via WebSocket to all connected clients.

**Access:** responder, admin

---

## 4. PATCH /api/incidents/:id

Update an incident's status, severity, or assignment.

**Request Body (partial update):**

```json
{
  "status": "resolved",
  "assigned_to": "ops-team"
}
```

Updatable fields: `status`, `severity`, `assigned_to`, `description`

When `status` changes to `resolved`, `resolved_at` is automatically set.

**Response (200):** Updated incident object

**Side effect:** Emits `incident:updated` via WebSocket. Adds timeline entry.

**Access:** responder, admin

---

## 5. GET /api/analytics/summary

Dashboard summary statistics.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "total_incidents": 87,
    "open_incidents": 23,
    "mttr_by_severity": {
      "critical": 45,
      "high": 120,
      "medium": 360,
      "low": 1440
    },
    "severity_distribution": {
      "critical": 8,
      "high": 22,
      "medium": 35,
      "low": 22
    },
    "source_distribution": {
      "monitoring": 40,
      "user_report": 25,
      "automated": 15,
      "external": 7
    }
  }
}
```

`mttr_by_severity` values are in **minutes**.

**Access:** viewer, responder, admin

---

## 6. GET /api/analytics/timeline

Incidents over time for chart rendering.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `7d` | Time range: `24h`, `7d`, `30d` |
| `granularity` | string | `day` | Bucket size: `hour`, `day` |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "timeline": [
      { "bucket": "2025-01-09", "count": 12, "critical": 2, "high": 4, "medium": 4, "low": 2 },
      { "bucket": "2025-01-10", "count": 8, "critical": 1, "high": 2, "medium": 3, "low": 2 }
    ]
  }
}
```

**Access:** viewer, responder, admin

---

## 7. GET /api/alert-configs

List all alert configurations.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "configs": [
      {
        "id": 1,
        "name": "Critical Spike",
        "severity": "critical",
        "threshold": 5,
        "window_minutes": 60,
        "enabled": true,
        "created_at": "2025-01-10T00:00:00Z"
      }
    ]
  }
}
```

**Access:** responder, admin

---

## 8. POST /api/alert-configs

Create a new alert configuration.

**Request Body:**

```json
{
  "name": "High Severity Surge",
  "severity": "high",
  "threshold": 10,
  "window_minutes": 30,
  "enabled": true
}
```

Required: `name`, `severity`, `threshold`, `window_minutes`

**Response (201):** Created config object

**Access:** admin only
