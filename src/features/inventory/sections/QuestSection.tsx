import { useState } from 'react';
import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { analyzeQuestUses, type QuestMatch } from '@/features/recommendations/questAnalysis';
import { getWikiUrl } from '@/shared/utils/itemHelpers';
import { OverflowModal } from '@/shared/components/OverflowModal';

interface Props {
  item: InventoryItem;
  cdnItem: CdnItem | null;
  character: CharacterExport;
  indexes: GameDataIndexes;
}

function QuestLink({ quest }: { quest: QuestMatch }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-medium">{quest.questName}</span>
      <a
        href={getWikiUrl(quest.questName)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-action-blue hover:text-action-blue/80 shrink-0"
        title="View on Wiki"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
      {quest.count > 1 && (
        <span className="text-gorgon-text-dim">({quest.count} needed)</span>
      )}
    </span>
  );
}

function SpoilerQuest({ quest }: { quest: QuestMatch }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <div className="text-sm text-gorgon-text-dim pl-3 border-l-2 border-gorgon-border mb-1">
        <QuestLink quest={quest} />
      </div>
    );
  }

  return (
    <div className="text-sm pl-3 border-l-2 border-gorgon-border mb-1">
      <button
        onClick={() => setRevealed(true)}
        className="text-gorgon-text-dim hover:text-gorgon-text transition-colors italic"
      >
        Quest (click to reveal)
      </button>
    </div>
  );
}

export function QuestSection({ item, cdnItem, character, indexes }: Props) {
  const matches = analyzeQuestUses(item, cdnItem ?? undefined, character, indexes);

  if (matches.length === 0) return null;

  const active = matches.filter((m) => m.isActive);
  const inactive = matches.filter((m) => !m.isActive);

  return (
    <div>
      <h3 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">
        Quest Connections ({matches.length})
      </h3>

      {active.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-action-blue mb-1">Active Quests</p>
          {active.map((m, i) => (
            <div key={i} className="text-sm text-gorgon-text pl-3 border-l-2 border-action-blue mb-1">
              <QuestLink quest={m} />
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs text-gorgon-text-dim mb-1">Other Quests (spoilers)</p>
          {inactive.slice(0, 3).map((m, i) => (
            <SpoilerQuest key={i} quest={m} />
          ))}
          {inactive.length > 3 && (
            <OverflowModal overflowCount={inactive.length - 3} label="more quests" title="Other Quests">
              <div className="space-y-1">
                {inactive.map((m, i) => (
                  <SpoilerQuest key={i} quest={m} />
                ))}
              </div>
            </OverflowModal>
          )}
        </div>
      )}
    </div>
  );
}
