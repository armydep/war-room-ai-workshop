# WarRoom — Architecture

## Tech Stack
- **Runtime:** Node.js 20+ with TypeScript (strict mode)
- **Backend:** Express 4.x
- **Database:** SQLite via better-sqlite3 (synchronous API, no ORM)
- **Real-time:** Socket.io 4.x
- **Frontend:** React 18 + Vite
- **Charts:** Recharts
- **Styling:** Tailwind CSS (via CDN or utility classes)

## Folder Structure

```
warroom/
├── server/
│   ├── src/
│   │   ├── index.ts              # Express + Socket.io setup, middleware chain
│   │   ├── db/
│   │   │   ├── schema.ts         # Table creation, migrations
│   │   │   ├── seed.ts           # Seed data generator
│   │   │   └── connection.ts     # Database singleton
│   │   ├── routes/
│   │   │   ├── incidents.ts      # CRUD + search/filter
│   │   │   ├── analytics.ts      # Aggregation endpoints
│   │   │   └── alerts.ts         # Alert config CRUD
│   │   ├── services/
│   │   │   ├── incidentService.ts    # Business logic
│   │   │   ├── analyticsService.ts   # Query builders for stats
│   │   │   └── classifierService.ts  # Auto-severity classification
│   │   ├── middleware/
│   │   │   ├── auth.ts           # Role-based access
│   │   │   ├── errorHandler.ts   # Structured error responses
│   │   │   └── logger.ts         # Request logging
│   │   └── types/
│   │       └── index.ts          # Shared type definitions
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Dashboard.tsx         # Main dashboard layout
│   │   │   ├── IncidentFeed.tsx      # Real-time feed (WebSocket)
│   │   │   ├── IncidentTable.tsx     # Filterable/sortable table
│   │   │   ├── IncidentDetail.tsx    # Single incident view
│   │   │   ├── charts/
│   │   │   │   ├── SeverityChart.tsx
│   │   │   │   ├── TimelineChart.tsx
│   │   │   │   ├── SourceChart.tsx
│   │   │   │   └── StatCards.tsx
│   │   │   └── AlertConfig.tsx       # Alert threshold configuration
│   │   ├── hooks/
│   │   │   ├── useSocket.ts          # WebSocket connection hook
│   │   │   └── useIncidents.ts       # Data fetching + state
│   │   ├── services/
│   │   │   └── api.ts                # HTTP client wrapper
│   │   └── types/
│   │       └── index.ts              # Shared frontend types
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Layer Responsibilities

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Routes** | HTTP parsing, validation, response formatting | No business logic. Call services. Return structured responses. |
| **Services** | Business logic, orchestration | No direct DB access except via connection module. No HTTP concepts (req/res). |
| **DB** | Schema, queries, connection management | Raw SQL only (no ORM). Parameterized queries always. |
| **Middleware** | Cross-cutting concerns | Auth, logging, error handling. Must call `next()` or end response. |

## Naming Conventions

- Files: `camelCase.ts`
- Types/Interfaces: `PascalCase` — prefix interfaces with context (e.g., `IncidentRecord`, `AnalyticsResponse`)
- Functions: `camelCase` — verb-first (e.g., `getIncidentById`, `calculateMTTR`)
- Constants: `UPPER_SNAKE_CASE`
- API routes: kebab-case (`/api/incidents`, `/api/alert-configs`)
- Database columns: `snake_case`

## Key Design Decisions

1. **SQLite over PostgreSQL** — Zero setup, file-based, perfect for single-server demos. better-sqlite3's synchronous API avoids callback complexity.
2. **No ORM** — Raw SQL is clearer for this scale. Parameterized queries prevent injection.
3. **Socket.io over raw WebSocket** — Automatic reconnection, room support, and fallback transports.
4. **Recharts over D3** — Declarative React components, minimal boilerplate for standard chart types.
5. **Role-based middleware** — Simple string-based roles (admin/responder/viewer) passed via `x-role` header. Not production auth — just enough structure to demonstrate the pattern.
