import { Incident } from '../types';

interface IncidentFeedProps {
  incidents: Incident[];
  onSelectIncident: (id: number) => void;
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function IncidentFeed({ incidents, onSelectIncident }: IncidentFeedProps): JSX.Element {
  if (incidents.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Live Feed</h3>
        <p className="text-sm text-gray-400 text-center py-8">
          Waiting for real-time incidents...
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Live Feed
        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {incidents.map((incident) => (
          <button
            key={incident.id}
            onClick={() => onSelectIncident(incident.id)}
            className="w-full text-left p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[incident.severity]}`}>
                {incident.severity}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(incident.created_at)}</span>
            </div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{incident.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{incident.source.replace('_', ' ')}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
