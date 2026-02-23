import { getDb, closeDb } from './db/connection';
import { initializeSchema } from './db/schema';

const SERVICES = ['api-gateway', 'auth-service', 'payment-service', 'order-service', 'user-service', 'inventory-service', 'notification-service', 'search-service'];
const ENDPOINTS = ['/api/orders', '/api/users', '/api/payments', '/api/search', '/api/inventory', '/api/auth/login'];
const SYMPTOMS = ['slow page loads', 'login failures', '500 errors', 'timeouts', 'missing data', 'incorrect totals'];
const FEATURES = ['checkout', 'search', 'user profile', 'order history', 'payment processing', 'dashboard'];
const ERRORS = ['500 errors', 'timeout errors', 'connection refused', 'null pointer exceptions'];
const ACTIONS = ['checkout', 'login', 'signup', 'search', 'file upload'];
const PROVIDERS = ['Stripe', 'SendGrid', 'Twilio', 'AWS S3', 'Cloudflare', 'GitHub API'];
const DOMAINS = ['cdn.example.com', 'api.partner.io', 'feeds.data.com', 'ws.realtime.io'];
const TEAMS = ['backend-team', 'frontend-team', 'ops-team', 'platform-team', 'payments-team', 'security-team', 'infra-team'];
const ACTORS = ['alice', 'bob', 'carol', 'dave', 'eve', 'system', 'frank'];

interface TitleTemplate {
  template: string;
  pools: Record<string, string[]>;
}

const MONITORING_TITLES: TitleTemplate[] = [
  { template: 'CPU usage exceeding 90% on {service}', pools: { service: SERVICES } },
  { template: 'Memory leak detected in {service}', pools: { service: SERVICES } },
  { template: 'Response time degraded on {endpoint}', pools: { endpoint: ENDPOINTS } },
  { template: 'Error rate spike on {service}', pools: { service: SERVICES } },
  { template: 'Disk usage at 95% on {service} host', pools: { service: SERVICES } },
  { template: 'Connection pool exhausted on {service}', pools: { service: SERVICES } },
  { template: 'High latency detected on {endpoint}', pools: { endpoint: ENDPOINTS } },
  { template: 'Health check failing for {service}', pools: { service: SERVICES } },
];

const USER_REPORT_TITLES: TitleTemplate[] = [
  { template: 'Users reporting {symptom} on {feature}', pools: { symptom: SYMPTOMS, feature: FEATURES } },
  { template: 'Intermittent {error} during {action}', pools: { error: ERRORS, action: ACTIONS } },
  { template: 'Customers unable to complete {action}', pools: { action: ACTIONS } },
  { template: 'Multiple reports of {symptom}', pools: { symptom: SYMPTOMS } },
];

const AUTOMATED_TITLES: TitleTemplate[] = [
  { template: 'Deployment rollback triggered for {service}', pools: { service: SERVICES } },
  { template: 'Certificate expiring in {n} days for {service}', pools: { service: SERVICES, n: ['3', '7', '14', '30'] } },
  { template: 'Auto-scaling triggered for {service}', pools: { service: SERVICES } },
  { template: 'Backup job failed for {service}', pools: { service: SERVICES } },
];

const EXTERNAL_TITLES: TitleTemplate[] = [
  { template: 'Third-party API {provider} returning 503', pools: { provider: PROVIDERS } },
  { template: 'DNS resolution failures for {domain}', pools: { domain: DOMAINS } },
  { template: '{provider} webhook delivery delays', pools: { provider: PROVIDERS } },
  { template: '{provider} reporting degraded performance', pools: { provider: PROVIDERS } },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTitle(source: string): string {
  const templates: Record<string, TitleTemplate[]> = {
    monitoring: MONITORING_TITLES,
    user_report: USER_REPORT_TITLES,
    automated: AUTOMATED_TITLES,
    external: EXTERNAL_TITLES,
  };
  const tmpl = pick(templates[source]);
  let result = tmpl.template;
  for (const [key, pool] of Object.entries(tmpl.pools)) {
    result = result.replace(`{${key}}`, pick(pool));
  }
  return result;
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function seed(): void {
  console.log('Initializing database schema...');
  initializeSchema();

  const db = getDb();

  db.exec('DELETE FROM timeline_events');
  db.exec('DELETE FROM incidents');
  db.exec('DELETE FROM alert_configs');
  db.exec('DELETE FROM activity_log');

  const incidentCount = randInt(55, 70);
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const severities = ['critical', 'high', 'medium', 'low'];
  const severityWeights = [10, 25, 40, 25];
  const statuses = ['open', 'investigating', 'resolved'];
  const statusWeights = [25, 15, 60];
  const sources = ['monitoring', 'user_report', 'automated', 'external'];
  const sourceWeights = [45, 30, 15, 10];

  const resolutionMinutes: Record<string, [number, number]> = {
    critical: [30, 90],
    high: [60, 240],
    medium: [240, 720],
    low: [720, 2880],
  };

  const insertIncident = db.prepare(`
    INSERT INTO incidents (title, description, severity, status, source, assigned_to, created_at, updated_at, resolved_at)
    VALUES (@title, @description, @severity, @status, @source, @assigned_to, @created_at, @updated_at, @resolved_at)
  `);

  const insertTimeline = db.prepare(`
    INSERT INTO timeline_events (incident_id, action, details, actor, created_at)
    VALUES (@incident_id, @action, @details, @actor, @created_at)
  `);

  const insertAlertConfig = db.prepare(`
    INSERT INTO alert_configs (name, severity, threshold, window_minutes, enabled)
    VALUES (@name, @severity, @threshold, @window_minutes, @enabled)
  `);

  const seedAll = db.transaction(() => {
    for (let i = 0; i < incidentCount; i++) {
      const severity = weightedPick(severities, severityWeights);
      const status = weightedPick(statuses, statusWeights);
      const source = weightedPick(sources, sourceWeights);
      const title = generateTitle(source);

      const createdAtMs = now - Math.floor(Math.random() * sevenDaysMs);
      const createdAt = new Date(createdAtMs).toISOString().replace('T', ' ').slice(0, 19);

      let resolvedAt: string | null = null;
      let updatedAtMs = createdAtMs + randInt(1, 30) * 60 * 1000;

      if (status === 'resolved') {
        const [minMin, maxMin] = resolutionMinutes[severity];
        const resolutionMs = randInt(minMin, maxMin) * 60 * 1000;
        const resolvedAtMs = createdAtMs + resolutionMs;
        resolvedAt = new Date(resolvedAtMs).toISOString().replace('T', ' ').slice(0, 19);
        updatedAtMs = resolvedAtMs;
      } else if (status === 'investigating') {
        updatedAtMs = createdAtMs + randInt(5, 60) * 60 * 1000;
      }

      const updatedAt = new Date(updatedAtMs).toISOString().replace('T', ' ').slice(0, 19);

      const result = insertIncident.run({
        title,
        description: `Incident detected: ${title}. Requires immediate attention.`,
        severity,
        status,
        source,
        assigned_to: pick(TEAMS),
        created_at: createdAt,
        updated_at: updatedAt,
        resolved_at: resolvedAt,
      });

      const incidentId = result.lastInsertRowid as number;

      insertTimeline.run({
        incident_id: incidentId,
        action: 'created',
        details: `Incident created from ${source}`,
        actor: 'system',
        created_at: createdAt,
      });

      if (status === 'investigating' || status === 'resolved') {
        const statusChangeTime = new Date(createdAtMs + randInt(3, 15) * 60 * 1000)
          .toISOString().replace('T', ' ').slice(0, 19);
        insertTimeline.run({
          incident_id: incidentId,
          action: 'status_change',
          details: 'Status changed to investigating',
          actor: pick(ACTORS),
          created_at: statusChangeTime,
        });

        insertTimeline.run({
          incident_id: incidentId,
          action: 'assigned',
          details: `Assigned to ${pick(TEAMS)}`,
          actor: pick(ACTORS),
          created_at: new Date(createdAtMs + randInt(5, 20) * 60 * 1000)
            .toISOString().replace('T', ' ').slice(0, 19),
        });
      }

      if (status === 'resolved') {
        const commentTime = new Date(createdAtMs + randInt(20, 60) * 60 * 1000)
          .toISOString().replace('T', ' ').slice(0, 19);
        insertTimeline.run({
          incident_id: incidentId,
          action: 'comment',
          details: 'Investigating root cause and applying fix',
          actor: pick(ACTORS),
          created_at: commentTime,
        });

        insertTimeline.run({
          incident_id: incidentId,
          action: 'status_change',
          details: 'Status changed to resolved',
          actor: pick(ACTORS),
          created_at: resolvedAt!,
        });
      }
    }

    insertAlertConfig.run({ name: 'Critical Spike', severity: 'critical', threshold: 5, window_minutes: 60, enabled: 1 });
    insertAlertConfig.run({ name: 'High Severity Surge', severity: 'high', threshold: 10, window_minutes: 30, enabled: 1 });
    insertAlertConfig.run({ name: 'Medium Volume Alert', severity: 'medium', threshold: 20, window_minutes: 120, enabled: 0 });
  });

  seedAll();

  const counts = db.prepare('SELECT COUNT(*) as count FROM incidents').get() as { count: number };
  const timelineCounts = db.prepare('SELECT COUNT(*) as count FROM timeline_events').get() as { count: number };
  const alertCounts = db.prepare('SELECT COUNT(*) as count FROM alert_configs').get() as { count: number };

  console.log(`Seeded ${counts.count} incidents`);
  console.log(`Seeded ${timelineCounts.count} timeline events`);
  console.log(`Seeded ${alertCounts.count} alert configs`);
  console.log('Database seeding complete.');

  closeDb();
}

seed();
