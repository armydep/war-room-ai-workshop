const CRITICAL_KEYWORDS = ['down', 'outage', 'data loss', 'security breach', 'production down', 'p0'];
const HIGH_KEYWORDS = ['degraded', 'timeout', 'memory leak', 'cpu', 'error rate', 'payment', 'exhausted'];
const MEDIUM_KEYWORDS = ['slow', 'intermittent', 'warning', 'certificate', 'disk', 'latency'];

export function classifySeverity(title: string, source: string): string {
  const lower = title.toLowerCase();

  if (CRITICAL_KEYWORDS.some(kw => lower.includes(kw))) return 'critical';
  if (source === 'monitoring' && HIGH_KEYWORDS.some(kw => lower.includes(kw))) return 'high';
  if (HIGH_KEYWORDS.some(kw => lower.includes(kw))) return 'high';
  if (MEDIUM_KEYWORDS.some(kw => lower.includes(kw))) return 'medium';

  if (source === 'monitoring') return 'medium';
  if (source === 'external') return 'high';
  return 'low';
}
