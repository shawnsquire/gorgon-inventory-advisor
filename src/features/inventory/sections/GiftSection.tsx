import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { analyzeGiftPotential } from '@/features/recommendations/giftAnalysis';

interface Props {
  item: InventoryItem;
  cdnItem: CdnItem | null;
  character: CharacterExport;
  indexes: GameDataIndexes;
}

export function GiftSection({ item, cdnItem, character, indexes }: Props) {
  const suggestions = analyzeGiftPotential(item, cdnItem ?? undefined, character, indexes);

  if (suggestions.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">
        NPC Gift Potential ({suggestions.length})
      </h3>
      <div className="space-y-1">
        {suggestions.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div>
              <span className={`font-medium ${s.desire === 'Love' ? 'text-action-purple' : 'text-gorgon-text'}`}>
                {s.npcName}
              </span>
              <span className="text-gorgon-text-dim ml-1">
                {s.desire}s this
              </span>
            </div>
            <span className="text-xs text-gorgon-text-dim">{s.playerFavor}</span>
          </div>
        ))}
        {suggestions.length > 5 && (
          <p className="text-xs text-gorgon-text-dim">...and {suggestions.length - 5} more NPCs</p>
        )}
      </div>
    </div>
  );
}
