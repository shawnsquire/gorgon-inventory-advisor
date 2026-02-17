import { useAppStore } from '@/lib/store';
import type { NpcPriorityStatus } from './types';

interface Props {
  npcId: string;
  currentStatus: NpcPriorityStatus;
}

export function NpcPriorityControls({ npcId, currentStatus }: Props) {
  const setNpcPriority = useAppStore((s) => s.setNpcPriority);
  const clearNpcPriority = useAppStore((s) => s.clearNpcPriority);
  const persistToDb = useAppStore((s) => s.persistToDb);

  const toggle = (status: NpcPriorityStatus) => {
    if (currentStatus === status) {
      clearNpcPriority(npcId);
    } else {
      setNpcPriority(npcId, status);
    }
    persistToDb();
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => toggle('priority')}
        className={`p-1.5 rounded transition-colors ${
          currentStatus === 'priority'
            ? 'text-action-yellow bg-action-yellow/10'
            : 'text-gorgon-text-dim hover:text-action-yellow'
        }`}
        title={currentStatus === 'priority' ? 'Remove from priorities' : 'Mark as priority'}
      >
        {currentStatus === 'priority' ? '\u2605' : '\u2606'}
      </button>
      <button
        onClick={() => toggle('ignored')}
        className={`p-1.5 rounded transition-colors text-sm ${
          currentStatus === 'ignored'
            ? 'text-action-red bg-action-red/10'
            : 'text-gorgon-text-dim hover:text-action-red'
        }`}
        title={currentStatus === 'ignored' ? 'Stop ignoring' : 'Ignore this NPC'}
      >
        {currentStatus === 'ignored' ? '\u2298' : '\u2296'}
      </button>
    </div>
  );
}
