import { useState } from 'react';
import { useAppStore } from '@/lib/store';

interface Props {
  npcId: string;
}

export function NpcDislikesSection({ npcId }: Props) {
  const [open, setOpen] = useState(false);
  const indexes = useAppStore((s) => s.indexes);

  if (!indexes) return null;

  const npc = indexes.npcById.get(npcId);
  if (!npc?.Preferences) return null;

  const dislikes = npc.Preferences.filter(
    (p) => p.Desire === 'Dislike' || p.Desire === 'Hate',
  );

  if (dislikes.length === 0) return null;

  return (
    <div className="border-t border-gorgon-border pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gorgon-text-dim hover:text-gorgon-text transition-colors w-full text-left"
      >
        <span className="text-xs">{open ? '\u25BC' : '\u25B6'}</span>
        <span>Dislikes ({dislikes.length})</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1 pl-4">
          {dislikes.map((pref, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className={`text-xs font-bold ${pref.Desire === 'Hate' ? 'text-action-red' : 'text-action-yellow'}`}>
                {pref.Desire === 'Hate' ? '\u2717' : '\u2013'}
              </span>
              <span className="text-gorgon-text-dim">
                {pref.Keywords?.join(', ')}
              </span>
              <span className="text-xs text-gorgon-text-dim">
                ({pref.Desire})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
