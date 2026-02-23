# WarRoom — Frontend Components

## Component Hierarchy

```
App
├── Dashboard (main layout — grid-based)
│   ├── StatCards (4 stat cards in a row)
│   │   ├── Total Incidents
│   │   ├── Open Incidents
│   │   ├── MTTR (Critical)
│   │   └── MTTR (High)
│   ├── Charts Row (2-column grid)
│   │   ├── SeverityChart (bar chart — left)
│   │   └── TimelineChart (line chart — right)
│   ├── SourceChart (pie chart — full width, smaller)
│   ├── IncidentFeed (real-time feed — sidebar or collapsible)
│   └── IncidentTable (filterable table — full width)
├── IncidentDetail (single incident view, accessed via table click)
└── AlertConfig (alert rule management)
```

## State Management

Use React hooks only — no Redux, no Zustand. This is small enough for local state + prop drilling.

| State | Location | Type |
|-------|----------|------|
| Incidents list | `useIncidents` hook | `Incident[]` |
| Filters (severity, status, source) | `IncidentTable` local state | `FilterState` |
| Pagination | `IncidentTable` local state | `{ page, limit }` |
| Analytics data | `Dashboard` via `useEffect` | `AnalyticsSummary` |
| Live feed | `useSocket` hook | `Incident[]` (last 10) |
| Selected incident | `App` level state | `number | null` |

## Chart Specifications

### SeverityChart (Bar Chart)
- Library: Recharts `<BarChart>`
- Data: `severity_distribution` from `/api/analytics/summary`
- X-axis: severity labels (Critical, High, Medium, Low)
- Y-axis: count
- Colors: Critical = `#DC2626`, High = `#F59E0B`, Medium = `#3B82F6`, Low = `#6B7280`
- Style: Rounded bar tops, no grid lines on x-axis, subtle y-axis grid

### TimelineChart (Line Chart)
- Library: Recharts `<LineChart>` with `<Area>` fill
- Data: `/api/analytics/timeline?period=7d&granularity=day`
- X-axis: date labels
- Y-axis: incident count
- Lines: One line per severity (color-coded same as above)
- Style: Smooth curves (`type="monotone"`), subtle area fill with transparency

### SourceChart (Pie Chart)
- Library: Recharts `<PieChart>`
- Data: `source_distribution` from `/api/analytics/summary`
- Labels: Outside labels with percentage
- Colors: Monitoring = `#8B5CF6`, User Report = `#EC4899`, Automated = `#14B8A6`, External = `#F97316`

### StatCards
- Four cards in a flex row
- Each card: large number (32px+), label below, subtle background color
- Data: `total_incidents`, `open_incidents`, `mttr_by_severity.critical`, `mttr_by_severity.high`
- Format MTTR as human-readable: "45 min", "2h", "6h", "24h"

## WebSocket Integration

### Connection Hook (`useSocket.ts`)

```typescript
// Pattern:
const useSocket = (serverUrl: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveFeed, setLiveFeed] = useState<Incident[]>([]);

  useEffect(() => {
    const s = io(serverUrl);

    s.on('connect', () => console.log('Connected to WarRoom'));
    s.on('disconnect', () => console.log('Disconnected from WarRoom'));

    s.on('incident:created', (incident: Incident) => {
      setLiveFeed(prev => [incident, ...prev].slice(0, 10)); // Keep last 10
    });

    s.on('incident:updated', (incident: Incident) => {
      setLiveFeed(prev => {
        const updated = prev.map(i => i.id === incident.id ? incident : i);
        return updated;
      });
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [serverUrl]);

  return { socket, liveFeed };
};
```

### IncidentFeed Component
- Displays last 10 incidents received via WebSocket
- New incidents animate in (CSS transition on mount)
- Each item shows: severity badge (color-coded), title, source, timestamp (relative: "2 min ago")
- Clicking an item opens IncidentDetail

## IncidentTable Spec

- Columns: Severity (badge), Title, Source, Status (badge), Assigned To, Created At
- Filter row above table: dropdowns for severity, status, source
- Sort: click column headers to toggle sort
- Pagination: page controls below table, show "Showing 1-20 of 87"
- Row click → navigates to IncidentDetail

### Severity Badges
- Critical: red background (`#FEE2E2`), red text (`#991B1B`)
- High: amber background (`#FEF3C7`), amber text (`#92400E`)
- Medium: blue background (`#DBEAFE`), blue text (`#1E40AF`)
- Low: gray background (`#F3F4F6`), gray text (`#374151`)

### Status Badges
- Open: red outline badge
- Investigating: yellow outline badge
- Resolved: green outline badge

## API Client (`services/api.ts`)

```typescript
const API_BASE = 'http://localhost:3001/api';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-role': 'admin', // Default role for demo
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'API request failed');
  }
  const json = await res.json();
  return json.data;
}
```

## Layout

- Use CSS Grid for the dashboard layout
- Responsive: 2-column on desktop, single column on mobile
- Dark theme optional, light theme default
- Card components: white background, subtle border, `border-radius: 8px`, `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
