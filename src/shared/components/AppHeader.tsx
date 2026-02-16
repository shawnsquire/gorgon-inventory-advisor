import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { ExportButton } from '@/features/export/ExportButton';

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeCharacter = useAppStore((s) => s.activeCharacter);

  // Don't show header on import page
  if (location.pathname === '/import') return null;

  return (
    <header className="border-b border-gorgon-border bg-gorgon-panel/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center flex-wrap gap-3">
        <Link to="/dashboard" className="font-display text-lg text-gorgon-text-bright tracking-wide shrink-0">
          GIA
        </Link>

        <div className="flex-1" />

        {activeCharacter && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gorgon-text-dim">{activeCharacter}</span>
            <ExportButton />
            <button
              onClick={() => navigate('/settings')}
              className="text-gorgon-text-dim hover:text-gorgon-text transition-colors p-1"
              aria-label="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
