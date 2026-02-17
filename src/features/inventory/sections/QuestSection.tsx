import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { analyzeQuestUses } from '@/features/recommendations/questAnalysis';
import { OverflowModal } from '@/shared/components/OverflowModal';

interface Props {
  item: InventoryItem;
  cdnItem: CdnItem | null;
  character: CharacterExport;
  indexes: GameDataIndexes;
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
              <span className="font-medium">{m.questName}</span>
              {m.count > 1 && (
                <span className="text-gorgon-text-dim ml-1">({m.count} needed)</span>
              )}
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs text-gorgon-text-dim mb-1">Other Quests</p>
          {inactive.slice(0, 3).map((m, i) => (
            <div key={i} className="text-sm text-gorgon-text-dim pl-3 border-l-2 border-gorgon-border mb-1">
              {m.questName} ({m.count} needed)
            </div>
          ))}
          {inactive.length > 3 && (
            <OverflowModal overflowCount={inactive.length - 3} label="more quests" title="Other Quests">
              <div className="space-y-1">
                {inactive.map((m, i) => (
                  <div key={i} className="text-sm text-gorgon-text-dim pl-3 border-l-2 border-gorgon-border mb-1">
                    {m.questName} ({m.count} needed)
                  </div>
                ))}
              </div>
            </OverflowModal>
          )}
        </div>
      )}
    </div>
  );
}
