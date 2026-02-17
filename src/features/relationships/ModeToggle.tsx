import type { RelationshipMode } from './types';

interface Props {
  mode: RelationshipMode;
  onChange: (mode: RelationshipMode) => void;
}

export function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-gorgon-border overflow-hidden text-xs">
      <button
        onClick={() => onChange('opportunistic')}
        className={`px-3 py-1.5 transition-colors ${
          mode === 'opportunistic'
            ? 'bg-action-green/15 text-action-green'
            : 'text-gorgon-text-dim hover:text-gorgon-text'
        }`}
      >
        What I Have
      </button>
      <button
        onClick={() => onChange('strategic')}
        className={`px-3 py-1.5 transition-colors border-l border-gorgon-border ${
          mode === 'strategic'
            ? 'bg-action-purple/15 text-action-purple'
            : 'text-gorgon-text-dim hover:text-gorgon-text'
        }`}
      >
        What I Could Make
      </button>
    </div>
  );
}
