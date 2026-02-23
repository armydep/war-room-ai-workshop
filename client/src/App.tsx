import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { IncidentDetail } from './components/IncidentDetail';
import { AlertConfig } from './components/AlertConfig';
import { useSocket } from './hooks/useSocket';

type View = 'dashboard' | 'incident' | 'alerts';

export default function App(): JSX.Element {
  const [view, setView] = useState<View>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const { liveFeed, connected } = useSocket('http://localhost:3001');

  function handleSelectIncident(id: number): void {
    setSelectedIncidentId(id);
    setView('incident');
  }

  function handleBack(): void {
    setSelectedIncidentId(null);
    setView('dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900">WarRoom</h1>
              <span className="text-xs text-gray-400">Incident Command Center</span>
            </div>
            <nav className="flex items-center gap-4">
              <button
                onClick={() => { setView('dashboard'); setSelectedIncidentId(null); }}
                className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  view === 'dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('alerts')}
                className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  view === 'alerts' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Alerts
              </button>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
                {connected ? 'Connected' : 'Disconnected'}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'dashboard' && (
          <Dashboard liveFeed={liveFeed} onSelectIncident={handleSelectIncident} />
        )}
        {view === 'incident' && selectedIncidentId !== null && (
          <IncidentDetail incidentId={selectedIncidentId} onBack={handleBack} />
        )}
        {view === 'alerts' && (
          <AlertConfig onBack={handleBack} />
        )}
      </main>
    </div>
  );
}
