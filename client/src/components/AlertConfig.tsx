import { useState, useEffect } from 'react';
import { AlertConfig as AlertConfigType } from '../types';
import { getAlertConfigs, createAlertConfig } from '../services/api';

interface AlertConfigProps {
  onBack: () => void;
}

export function AlertConfig({ onBack }: AlertConfigProps): JSX.Element {
  const [configs, setConfigs] = useState<AlertConfigType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [severity, setSeverity] = useState('critical');
  const [threshold, setThreshold] = useState(5);
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [enabled, setEnabled] = useState(true);

  async function fetchConfigs(): Promise<void> {
    setLoading(true);
    try {
      const data = await getAlertConfigs();
      setConfigs(data.configs);
    } catch (err) {
      console.error('Failed to fetch alert configs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!name.trim()) throw new Error('Name is required');

      await createAlertConfig({
        name: name.trim(),
        severity,
        threshold,
        window_minutes: windowMinutes,
        enabled,
      });

      setName('');
      setThreshold(5);
      setWindowMinutes(60);
      await fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert config');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200';

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">&larr; Back to Dashboard</button>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Alert Configuration</h2>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Critical Spike"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)} className={inputClass}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Threshold (count)</label>
              <input
                type="number"
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                min={1}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Window (minutes)</label>
              <input
                type="number"
                value={windowMinutes}
                onChange={e => setWindowMinutes(Number(e.target.value))}
                min={1}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700 dark:text-gray-300">Enabled</label>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Alert Rule'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Existing Rules</h3>
        </div>
        {loading ? (
          <div className="p-4 text-center text-gray-400">Loading...</div>
        ) : configs.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No alert rules configured</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-gray-600 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Threshold</th>
                  <th className="px-4 py-3 font-medium">Window</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {configs.map((config) => (
                  <tr key={config.id}>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{config.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{config.severity}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{config.threshold} incidents</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{config.window_minutes} min</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {config.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
