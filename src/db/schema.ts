import { getDb } from './connection';

export function initializeSchema(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low')),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved')),
      source TEXT NOT NULL CHECK (source IN ('monitoring','user_report','automated','external')),
      assigned_to TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);
    CREATE INDEX IF NOT EXISTS idx_incidents_source ON incidents(source);

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      actor TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (incident_id) REFERENCES incidents(id)
    );

    CREATE INDEX IF NOT EXISTS idx_timeline_incident_id ON timeline_events(incident_id);

    CREATE TABLE IF NOT EXISTS alert_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      severity TEXT NOT NULL,
      threshold INTEGER NOT NULL,
      window_minutes INTEGER NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER,
      duration_ms INTEGER,
      role TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
