import { useState, useEffect } from 'react';
import { IncidentWithTimeline } from '../types';
import { getIncident } from '../services/api';

interface IncidentDetailProps {
  incidentId: number;
  onBack: () => void;
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  investigating: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  resolved: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
};

const ACTION_ICONS: Record<string, string> = {
  created: '\uD83D\uDD35',
  status_change: '\uD83D\uDD04',
  severity_change: '\u26A0\uFE0F',
  assigned: '\uD83D\uDC64',
  comment: '\uD83D\uDCAC',
};

export function IncidentDetail({ incidentId, onBack }: IncidentDetailProps): JSX.Element {
  const [incident, setIncident] = useState<IncidentWithTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDetail(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const data = await getIncident(incidentId);
        if (!cancelled) setIncident(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load incident');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();
    return () => { cancelled = true; };
  }, [incidentId]);

  if (loading) {
    return (
      <div className="card p-6">
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4">&larr; Back</button>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="card p-6">
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4">&larr; Back</button>
        <div className="text-red-600 dark:text-red-400">{error || 'Incident not found'}</div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4">&larr; Back to Dashboard</button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{incident.title}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[incident.severity]}`}>
            {incident.severity}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[incident.status]}`}>
            {incident.status}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{incident.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Source</span>
            <p className="font-medium dark:text-gray-200">{incident.source.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Assigned To</span>
            <p className="font-medium dark:text-gray-200">{incident.assigned_to || 'Unassigned'}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Created</span>
            <p className="font-medium dark:text-gray-200">{new Date(incident.created_at).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Resolved</span>
            <p className="font-medium dark:text-gray-200">{incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : '\u2014'}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Timeline</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-4">
            {incident.timeline.map((event) => (
              <div key={event.id} className="relative pl-10">
                <div className="absolute left-2.5 top-1 text-sm">
                  {ACTION_ICONS[event.action] || '\u25CF'}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{event.action.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">by {event.actor}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{event.details}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
