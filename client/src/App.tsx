import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { IncidentDetail } from './components/IncidentDetail';
import { AlertConfig } from './components/AlertConfig';
import { useSocket } from './hooks/useSocket';
import { useDarkMode } from './hooks/useDarkMode';

type View = 'dashboard' | 'incident' | 'alerts';

export default function App(): JSX.Element {
  const [view, setView] = useState<View>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const { liveFeed, connected } = useSocket('http://localhost:3001');
  const [dark, toggleDark] = useDarkMode();

  function handleSelectIncident(id: number): void {
    setSelectedIncidentId(id);
    setView('incident');
  }

  function handleBack(): void {
    setSelectedIncidentId(null);
    setView('dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">WarRoom</h1>
              <span className="text-xs text-gray-400 dark:text-gray-500">Incident Command Center</span>
            </div>
            <nav className="flex items-center gap-4">
              <button
                onClick={() => { setView('dashboard'); setSelectedIncidentId(null); }}
                className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  view === 'dashboard'
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('alerts')}
                className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  view === 'alerts'
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                Alerts
              </button>
              <button
                onClick={toggleDark}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
                {connected ? 'Connected' : 'Disconnected'}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'dashboard' && (
          <Dashboard liveFeed={liveFeed} onSelectIncident={handleSelectIncident} dark={dark} />
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
