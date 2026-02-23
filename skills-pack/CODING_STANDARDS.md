# WarRoom — Coding Standards

## TypeScript

- `strict: true` in tsconfig — no exceptions
- No `any` type. Use `unknown` + type guards when the type is genuinely unknown.
- Explicit return types on all exported functions
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `const` over `let`. Never use `var`.

## Error Handling

### Backend

Every route must be wrapped in a try-catch. Errors propagate to the error handler middleware.

```typescript
// Pattern: route handler
router.get('/incidents', async (req, res, next) => {
  try {
    const result = incidentService.getIncidents(req.query);
    res.json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
});
```

### Error Handler Middleware

```typescript
// Structured error response — always this shape, never raw stack traces
interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  console.error(`[${code}] ${err.message}`, { path: req.path, method: req.method });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message,
      status: statusCode,
    },
  });
}
```

### Frontend

- API calls: always try-catch, show user-friendly error states
- Never swallow errors silently — at minimum console.error
- Loading states: every component that fetches data must show a loading indicator

## Logging

Format: `[TIMESTAMP] [LEVEL] [CONTEXT] message`

```typescript
// Use console methods — no logging library needed for this scale
console.info(`[${new Date().toISOString()}] [INFO] [incidents] Created incident ${id}`);
console.error(`[${new Date().toISOString()}] [ERROR] [incidents] Failed to create: ${error.message}`);
```

Request logger middleware logs: method, path, status code, duration in ms.

## API Response Format

All endpoints return this envelope:

```typescript
// Success
{ success: true, data: T, meta: { timestamp: string } }

// Error
{ success: false, error: { code: string, message: string, status: number } }

// List endpoints add pagination to data
{ success: true, data: { items: T[], pagination: { page, limit, total, totalPages } }, meta: { ... } }
```

## Database

- All queries use parameterized statements (never string concatenation)
- Use `db.prepare().run()` for writes, `db.prepare().all()` for reads, `db.prepare().get()` for single row
- Wrap multi-statement writes in `db.transaction()`
- Column names in snake_case, convert to camelCase at the service layer

## Frontend

- Functional components only, no class components
- Custom hooks for data fetching and WebSocket — keep components focused on rendering
- Memoize expensive computations with `useMemo`
- Key props on all mapped elements (use `id`, never array index)
- No inline styles — use Tailwind utility classes or a styles object

## Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Files | camelCase.ts | `incidentService.ts` |
| React components | PascalCase.tsx | `IncidentTable.tsx` |
| Functions | camelCase, verb-first | `getIncidentById()` |
| Types/Interfaces | PascalCase | `IncidentRecord` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| API routes | kebab-case | `/api/alert-configs` |
| DB columns | snake_case | `created_at` |
| CSS classes | Tailwind utilities | `flex items-center gap-2` |
