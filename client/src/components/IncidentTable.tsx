import { useState, useCallback } from 'react';
import { useIncidents } from '../hooks/useIncidents';

interface IncidentTableProps {
  onSelectIncident: (id: number) => void;
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-amber-100 text-amber-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-700',
};

const STATUS_BADGE: Record<string, string> = {
  open: 'border-red-400 text-red-600',
  investigating: 'border-yellow-400 text-yellow-700',
  resolved: 'border-green-400 text-green-600',
};

export function IncidentTable({ onSelectIncident }: IncidentTableProps): JSX.Element {
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { incidents, pagination, loading, error } = useIncidents({
    severity: severity || undefined,
    status: status || undefined,
    source: source || undefined,
    sort,
    order,
    page,
    limit,
  });

  const toggleSort = useCallback((column: string) => {
    if (sort === column) {
      setOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSort(column);
      setOrder('desc');
    }
    setPage(1);
  }, [sort]);

  const handleFilterChange = useCallback((setter: React.Dispatch<React.SetStateAction<string>>) => {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    };
  }, []);

  const sortIndicator = (column: string): string => {
    if (sort !== column) return '';
    return order === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="card">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Incident Log</h3>
        <div className="flex flex-wrap gap-3">
          <select value={severity} onChange={handleFilterChange(setSeverity)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={status} onChange={handleFilterChange(setStatus)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
          <select value={source} onChange={handleFilterChange(setSource)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
            <option value="">All Sources</option>
            <option value="monitoring">Monitoring</option>
            <option value="user_report">User Report</option>
            <option value="automated">Automated</option>
            <option value="external">External</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-gray-900" onClick={() => toggleSort('severity')}>
                Severity{sortIndicator('severity')}
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-gray-900" onClick={() => toggleSort('title')}>
                Title{sortIndicator('title')}
              </th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Assigned To</th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-gray-900" onClick={() => toggleSort('created_at')}>
                Created{sortIndicator('created_at')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : incidents.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No incidents found</td></tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id}
                  onClick={() => onSelectIncident(incident.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[incident.severity]}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{incident.title}</td>
                  <td className="px-4 py-3 text-gray-600">{incident.source.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[incident.status]}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{incident.assigned_to || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(incident.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
